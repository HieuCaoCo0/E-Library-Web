from collections import defaultdict

from book.models import Book
from book.services import with_stats
from userBookStatus.models import ReadingStatus, UserBookStatus
from userReview.models import UserReview
from userReview.services import ReviewService

TOP_N = 10

# Trọng số khi gộp tín hiệu thành hệ số yêu thích của một cuốn đề xuất.
GENRE_WEIGHT = 0.55
AUTHOR_WEIGHT = 0.35
POPULARITY_WEIGHT = 0.10

# Trọng số ẩn khi user chưa review nhưng đã đánh dấu trạng thái đọc.
IMPLICIT_WEIGHTS = {
    ReadingStatus.READ: 0.80,
    ReadingStatus.WANT_TO_READ: 0.60,
    ReadingStatus.READING: 0.70,
}


def _explicit_weight(rating):
    return rating / 5.0


def _popularity(book):
    rating = book.rating
    if rating is None:
        return 0.0
    return max(0.0, min(float(rating) / 5.0, 1.0))


def _mean_or_zero(values):
    return sum(values) / len(values) if values else 0.0


class RecommendationService:
    @staticmethod
    def get_user_ratings(user):
        return ReviewService.get_user_ratings().filter(user_id=user.id)

    @classmethod
    def build_preference_profile(cls, user):
        """Hệ số yêu thích theo thể loại và tác giả, từ review + READ/WANT_TO_READ."""
        reviews = list(cls.get_user_ratings(user))
        statuses = list(
            UserBookStatus.objects.filter(user=user).values("book_id", "status")
        )

        reviewed_ids = {row["book_id"] for row in reviews}
        status_by_book = {row["book_id"]: row["status"] for row in statuses}

        read_ids = {
            book_id
            for book_id, status in status_by_book.items()
            if status == ReadingStatus.READ
        }
        want_ids = {
            book_id
            for book_id, status in status_by_book.items()
            if status == ReadingStatus.WANT_TO_READ
        }
        reading_ids = {
            book_id
            for book_id, status in status_by_book.items()
            if status == ReadingStatus.READING
        }

        signal_weights = {}
        for row in reviews:
            signal_weights[row["book_id"]] = _explicit_weight(row["rating"])
        for book_id, status in status_by_book.items():
            if book_id in signal_weights:
                continue
            if status in IMPLICIT_WEIGHTS:
                signal_weights[book_id] = IMPLICIT_WEIGHTS[status]

        excluded_ids = reviewed_ids | read_ids | want_ids | reading_ids

        genre_total = defaultdict(float)
        genre_count = defaultdict(int)
        author_total = defaultdict(float)
        author_count = defaultdict(int)

        if signal_weights:
            signal_books = (
                Book.objects.filter(id__in=signal_weights)
                .select_related("author")
                .prefetch_related("genres")
            )
            for book in signal_books:
                weight = signal_weights[book.id]
                author_total[book.author_id] += weight
                author_count[book.author_id] += 1
                for genre in book.genres.all():
                    genre_total[genre.id] += weight
                    genre_count[genre.id] += 1

        genre_affinity = {
            genre_id: genre_total[genre_id] / genre_count[genre_id]
            for genre_id in genre_total
        }
        author_affinity = {
            author_id: author_total[author_id] / author_count[author_id]
            for author_id in author_total
        }

        return {
            "genre_affinity": genre_affinity,
            "author_affinity": author_affinity,
            "excluded_ids": excluded_ids,
            "cold_start": not bool(signal_weights),
        }

    @classmethod
    def score_book(cls, book, profile):
        genre_affinity = profile["genre_affinity"]
        author_affinity = profile["author_affinity"]
        genre_match = _mean_or_zero(
            [genre_affinity[genre.id] for genre in book.genres.all() if genre.id in genre_affinity]
        )
        author_match = author_affinity.get(book.author_id, 0.0)
        score = (
            GENRE_WEIGHT * genre_match
            + AUTHOR_WEIGHT * author_match
            + POPULARITY_WEIGHT * _popularity(book)
        )
        return round(score, 4)

    @classmethod
    def recommend_for_user(cls, user, limit=TOP_N):
        profile = cls.build_preference_profile(user)
        excluded_ids = profile["excluded_ids"]
        candidates = with_stats(
            Book.objects.exclude(id__in=excluded_ids)
            .select_related("author")
            .prefetch_related("genres")
        )

        if profile["cold_start"]:
            ranked = list(candidates.order_by("-rating", "id")[:limit])
            for book in ranked:
                book.preference_score = round(POPULARITY_WEIGHT * _popularity(book), 4)
            return ranked, True

        scored = []
        for book in candidates:
            book.preference_score = cls.score_book(book, profile)
            scored.append(book)

        scored.sort(
            key=lambda book: (book.preference_score, book.rating or 0, -book.id),
            reverse=True,
        )
        return scored[:limit], False
