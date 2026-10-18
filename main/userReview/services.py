from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Avg, Count

from .models import UserReview


_UNSET = object()


class ReviewService:
    @staticmethod
    def get_user_ratings():
        """Return the compact rating dataset used by Recommendation."""
        return UserReview.objects.values("user_id", "book_id", "rating")

    @staticmethod
    def recalculate_book_rating(book):
        stats = UserReview.objects.filter(book=book).aggregate(
            average_rating=Avg("rating"),
            reviews_count=Count("id"),
        )
        average_rating = (
            round(stats["average_rating"], 2)
            if stats["average_rating"] is not None
            else 0.0
        )
        reviews_count = stats["reviews_count"] or 0

        update_fields = []
        book_fields = {field.name for field in book._meta.concrete_fields}
        if "average_rating" in book_fields:
            book.average_rating = average_rating
            update_fields.append("average_rating")
        elif "rating" in book_fields:
            book.rating = average_rating
            update_fields.append("rating")
        if "reviews_count" in book_fields:
            book.reviews_count = reviews_count
            update_fields.append("reviews_count")

        if update_fields:
            book.save(update_fields=update_fields)
        return average_rating, reviews_count

    @classmethod
    @transaction.atomic
    def create_review(cls, user, book, rating, comment=None):
        if UserReview.objects.filter(user=user, book=book).exists():
            raise ValidationError(
                "Bạn đã đánh giá cuốn sách này rồi. Vui lòng sửa đánh giá cũ."
            )

        review = UserReview.objects.create(
            user=user,
            book=book,
            rating=rating,
            comment=comment,
        )
        cls.recalculate_book_rating(book)
        return review

    @classmethod
    @transaction.atomic
    def update_review(cls, review, rating=_UNSET, comment=_UNSET):
        if rating is not _UNSET:
            review.rating = rating
        if comment is not _UNSET:
            review.comment = comment
        review.save()
        cls.recalculate_book_rating(review.book)
        return review

    @classmethod
    @transaction.atomic
    def delete_review(cls, review):
        book = review.book
        review.delete()
        cls.recalculate_book_rating(book)