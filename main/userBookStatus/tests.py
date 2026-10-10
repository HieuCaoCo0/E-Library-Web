from django.test import TestCase

from rest_framework.test import APITestCase
from customUser.models import CustomUser
from book.models import Book
from .models import UserBookStatus
from author.models import Author

class UserLibraryAPITest(APITestCase):
    def setUp(self):
        self.user_a = CustomUser.objects.create_user(
            username="a", password="123456"
        )
        self.user_b = CustomUser.objects.create_user(
            username="b", password="123456"
        )
        author = Author.objects.create(name="Tác giả thử")
        self.book = Book.objects.create(title="Sách thử", author=author)
        self.url = "/api/user-library/"

    def test_requires_login(self):
        res = self.client.get(self.url)
        self.assertIn(res.status_code, (401, 403))

    def test_add_book_then_update_same_book(self):
        self.client.force_authenticate(self.user_a)
        r1 = self.client.post(self.url, {"book": self.book.id, "status": "want_to_read"})
        self.assertEqual(r1.status_code, 201)
        r2 = self.client.post(self.url, {"book": self.book.id, "status": "reading"})
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(UserBookStatus.objects.filter(user=self.user_a).count(), 1)
        

    def test_filter_by_status(self):
        self.client.force_authenticate(self.user_a)
        self.client.post(self.url, {"book": self.book.id, "status": "reading"})
        res = self.client.get(self.url, {"status": "read"})
        self.assertEqual(len(res.data), 0)
        res = self.client.get(self.url, {"status": "reading"})
        self.assertEqual(len(res.data), 1)

    def test_cannot_touch_other_users_library(self):
        item = UserBookStatus.objects.create(
            user=self.user_b, book=self.book, status="READ"
        )
        self.client.force_authenticate(self.user_a)
        r = self.client.patch(f"{self.url}{item.id}/", {"status": "reading"})
        self.assertEqual(r.status_code, 404)
        r = self.client.delete(f"{self.url}{item.id}/")
        self.assertEqual(r.status_code, 404)
        item.refresh_from_db()
        self.assertEqual(item.status, "READ")

    def test_invalid_status_returns_400(self):
        self.client.force_authenticate(self.user_a)
        r = self.client.post(self.url, {"book": self.book.id, "status": "abc"})
        self.assertEqual(r.status_code, 400)
        r = self.client.get(self.url, {"status": "abc"})
        self.assertEqual(r.status_code, 400)

    def test_patch_own_status_and_delete(self):
        self.client.force_authenticate(self.user_a)
        item = UserBookStatus.objects.create(
            user=self.user_a, book=self.book, status="WANT_TO_READ"
        )
        r = self.client.patch(f"{self.url}{item.id}/", {"status": "read"})
        self.assertEqual(r.status_code, 200)
        item.refresh_from_db()
        self.assertEqual(item.status, "READ")
        r = self.client.delete(f"{self.url}{item.id}/")
        self.assertEqual(r.status_code, 204)
        self.assertFalse(UserBookStatus.objects.filter(id=item.id).exists())

    def test_cannot_change_book_via_patch(self):
        self.client.force_authenticate(self.user_a)
        other = Book.objects.create(title="Sách khác", author=self.book.author)
        item = UserBookStatus.objects.create(
            user=self.user_a, book=self.book, status="READING"
        )
        r = self.client.patch(f"{self.url}{item.id}/", {"book": other.id})
        self.assertEqual(r.status_code, 400)

    def test_list_only_shows_own_books(self):
        UserBookStatus.objects.create(user=self.user_b, book=self.book, status="READ")
        self.client.force_authenticate(self.user_a)
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 0)