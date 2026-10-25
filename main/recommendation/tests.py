from rest_framework.test import APITestCase

from author.models import Author
from book.models import Book
from customUser.models import CustomUser
from genre.models import Genre
from userBookStatus.models import UserBookStatus
from userReview.models import UserReview

from .services import RecommendationService


class RecommendationAPITests(APITestCase):
    def setUp(self):
        self.url = "/api/recommendations/"
        self.user = CustomUser.objects.create_user(username="reader", password="pass12345")
        self.other = CustomUser.objects.create_user(username="other", password="pass12345")

        self.fantasy = Genre.objects.create(name="Fantasy")
        self.mystery = Genre.objects.create(name="Mystery")
        self.romance = Genre.objects.create(name="Romance")
        self.history = Genre.objects.create(name="History")

        self.fantasy_author = Author.objects.create(name="Fantasy Author")
        self.mystery_author = Author.objects.create(name="Mystery Author")
        self.romance_author = Author.objects.create(name="Romance Author")
        self.history_author = Author.objects.create(name="History Author")

        self.liked = self._book("Liked Fantasy", self.fantasy_author, self.fantasy, rating=4.5)
        self.want = self._book("Want Fantasy", self.fantasy_author, self.fantasy, rating=4.0)
        self.read_other = self._book("Read History", self.history_author, self.history, rating=5.0)

        self.candidates = []
        for i in range(8):
            self.candidates.append(
                self._book(f"Fantasy Rec {i}", self.fantasy_author, self.fantasy, rating=4.2)
            )
        self.mystery_candidate = self._book(
            "Mystery Rec", self.mystery_author, self.mystery, rating=4.9
        )
        self.romance_books = [
            self._book(f"Romance {i}", self.romance_author, self.romance, rating=3.0 + i * 0.1)
            for i in range(12)
        ]

        UserReview.objects.create(user=self.user, book=self.liked, rating=5)
        UserBookStatus.objects.create(user=self.user, book=self.liked, status="READ")
        UserBookStatus.objects.create(user=self.user, book=self.want, status="WANT_TO_READ")
        UserBookStatus.objects.create(user=self.user, book=self.read_other, status="READ")

    def _book(self, title, author, genre, rating=None):
        book = Book.objects.create(title=title, author=author, rating=rating)
        book.genres.add(genre)
        return book

    def test_requires_login(self):
        res = self.client.get(self.url)
        self.assertIn(res.status_code, (401, 403))

    def test_returns_top_10_unread_personalized(self):
        self.client.force_authenticate(self.user)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertFalse(res.data["cold_start"])
        self.assertEqual(res.data["count"], 10)
        self.assertEqual(len(res.data["results"]), 10)

        ids = [item["id"] for item in res.data["results"]]
        self.assertNotIn(self.liked.id, ids)
        self.assertNotIn(self.want.id, ids)
        self.assertNotIn(self.read_other.id, ids)

        scores = [item["preference_score"] for item in res.data["results"]]
        self.assertEqual(scores, sorted(scores, reverse=True))

        top_ids = set(ids[:8])
        for book in self.candidates:
            self.assertIn(book.id, top_ids)
        self.assertNotIn(self.mystery_candidate.id, top_ids)

    def test_other_users_library_does_not_exclude_books(self):
        UserBookStatus.objects.create(
            user=self.other, book=self.candidates[0], status="READ"
        )
        self.client.force_authenticate(self.user)
        ids = [item["id"] for item in self.client.get(self.url).data["results"]]
        self.assertIn(self.candidates[0].id, ids)

    def test_cold_start_falls_back_to_catalog_rating(self):
        newbie = CustomUser.objects.create_user(username="newbie", password="pass12345")
        self.client.force_authenticate(newbie)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["cold_start"])
        self.assertEqual(res.data["count"], 10)
        ratings = [item["rating"] for item in res.data["results"]]
        self.assertEqual(ratings, sorted(ratings, reverse=True))

    def test_empty_when_user_has_read_entire_catalog(self):
        tiny_user = CustomUser.objects.create_user(username="tiny", password="pass12345")
        only = self._book("Only Book", self.romance_author, self.romance, rating=4.0)
        Book.objects.exclude(id=only.id).delete()
        UserBookStatus.objects.create(user=tiny_user, book=only, status="READ")

        self.client.force_authenticate(tiny_user)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 0)
        self.assertEqual(res.data["results"], [])

    def test_service_scores_matching_genre_higher(self):
        ranked, cold_start = RecommendationService.recommend_for_user(self.user)
        self.assertFalse(cold_start)
        ranked_ids = [book.id for book in ranked]
        self.assertTrue(
            ranked_ids.index(self.candidates[0].id)
            < ranked_ids.index(self.mystery_candidate.id)
        )
