from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from author.models import Author
from book.models import Book
from customUser.models import CustomUser

from .models import UserReview


class UserReviewAPITestCase(APITestCase):
	def setUp(self):
		self.author = Author.objects.create(name="Test Author")
		self.book = Book.objects.create(
			title="Test Book",
			author=self.author,
			rating=None,
		)
		self.user_a = CustomUser.objects.create_user(
			username="user_a",
			password="password-a",
		)
		self.user_b = CustomUser.objects.create_user(
			username="user_b",
			password="password-b",
		)

	def reviews_url(self, book_id=None):
		return reverse("book-reviews", args=[book_id or self.book.id])

	def review_url(self, review_id):
		return reverse("user-review-detail", args=[review_id])

	def create_review(self, user, rating, comment="Test comment"):
		self.client.force_authenticate(user=user)
		response = self.client.post(
			self.reviews_url(),
			{"rating": rating, "comment": comment},
			format="json",
		)
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		return UserReview.objects.get(pk=response.data["id"])

	def test_tc01_list_reviews_for_existing_book(self):
		response = self.client.get(self.reviews_url())

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIsInstance(response.data, list)

	def test_tc02_list_reviews_for_missing_book(self):
		response = self.client.get(self.reviews_url(999999))

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

	def test_tc03_authenticated_user_can_create_review_and_update_rating(self):
		self.client.force_authenticate(user=self.user_a)
		response = self.client.post(
			self.reviews_url(),
			{"rating": 5, "comment": "Sach rat hay!"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.book.refresh_from_db()
		self.assertEqual(self.book.rating, 5.0)

	def test_tc04_anonymous_user_cannot_create_review(self):
		response = self.client.post(
			self.reviews_url(),
			{"rating": 4, "comment": "Tot"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

	def test_tc05_user_cannot_review_same_book_twice(self):
		self.create_review(self.user_a, 5)

		self.client.force_authenticate(user=self.user_a)
		response = self.client.post(
			self.reviews_url(),
			{"rating": 3, "comment": "Danh gia lai"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertEqual(UserReview.objects.count(), 1)

	def test_tc06_rating_outside_range_is_rejected(self):
		self.client.force_authenticate(user=self.user_a)
		response = self.client.post(
			self.reviews_url(),
			{"rating": 6, "comment": "Qua dinh"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn("rating", response.data)

	def test_tc07_average_rating_is_recalculated_after_second_review(self):
		self.create_review(self.user_a, 5)
		self.create_review(self.user_b, 3)

		self.book.refresh_from_db()
		self.assertEqual(self.book.rating, 4.0)

	def test_tc08_owner_can_update_review_and_average_rating(self):
		review = self.create_review(self.user_a, 5)
		review_b = self.create_review(self.user_b, 3)

		self.client.force_authenticate(user=self.user_b)
		response = self.client.put(
			self.review_url(review_b.id),
			{"rating": 4, "comment": "Doc ky lai thay kha hay"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.book.refresh_from_db()
		self.assertEqual(self.book.rating, 4.5)
		review.refresh_from_db()
		review_b.refresh_from_db()
		self.assertEqual(review_b.rating, 4)

	def test_tc09_non_owner_cannot_update_review(self):
		review = self.create_review(self.user_b, 3)

		self.client.force_authenticate(user=self.user_a)
		response = self.client.put(
			self.review_url(review.id),
			{"rating": 4, "comment": "Unauthorized edit"},
			format="json",
		)

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

	def test_tc10_non_owner_cannot_delete_review(self):
		review = self.create_review(self.user_b, 3)

		self.client.force_authenticate(user=self.user_a)
		response = self.client.delete(self.review_url(review.id))

		self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
		self.assertTrue(UserReview.objects.filter(pk=review.id).exists())

	def test_tc11_owner_can_delete_review_and_average_rating_is_recalculated(self):
		self.create_review(self.user_a, 5)
		review_b = self.create_review(self.user_b, 3)

		self.client.force_authenticate(user=self.user_b)
		response = self.client.delete(self.review_url(review_b.id))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.book.refresh_from_db()
		self.assertEqual(self.book.rating, 5.0)

	def test_tc12_deleting_last_review_resets_average_rating_to_zero(self):
		review = self.create_review(self.user_a, 5)

		self.client.force_authenticate(user=self.user_a)
		response = self.client.delete(self.review_url(review.id))

		self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
		self.book.refresh_from_db()
		self.assertEqual(self.book.rating, 0.0)
