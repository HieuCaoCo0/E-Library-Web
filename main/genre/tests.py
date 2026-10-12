from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from author.models import Author
from book.models import Book
from .models import Genre


class GenreAPITests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="admin", email="admin@test.com", password="pass12345"
        )
        self.admin.is_staff = True
        self.admin.save()
        self.user = User.objects.create_user(
            username="user", email="user@test.com", password="pass12345"
        )

        self.fantasy = Genre.objects.create(name="Fantasy")
        self.horror = Genre.objects.create(name="Horror")
        author = Author.objects.create(name="Author A")

        for i in range(25):
            b = Book.objects.create(title=f"Book {i}", author=author, rating=i / 5)
            b.genres.add(self.fantasy)

    def test_list_is_public_and_has_book_count(self):
        res = self.client.get("/api/genres/")
        self.assertEqual(res.status_code, 200)
        by_name = {g["name"]: g["book_count"] for g in res.data["results"]}
        self.assertEqual(by_name["Fantasy"], 25)
        self.assertEqual(by_name["Horror"], 0)

    def test_search_by_name(self):
        res = self.client.get("/api/genres/?search=horr")
        self.assertEqual(res.data["count"], 1)

    def test_detail_paginates_books_20_per_page(self):
        res = self.client.get(f"/api/genres/{self.fantasy.id}/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["count"], 25)
        self.assertEqual(len(res.data["results"]["books"]), 20)
        res2 = self.client.get(f"/api/genres/{self.fantasy.id}/?page=2")
        self.assertEqual(len(res2.data["results"]["books"]), 5)

    def test_detail_ordering(self):
        res = self.client.get(f"/api/genres/{self.fantasy.id}/?ordering=title")
        titles = [b["title"] for b in res.data["results"]["books"]]
        self.assertEqual(titles, sorted(titles))

    def test_detail_404(self):
        self.assertEqual(self.client.get("/api/genres/9999/").status_code, 404)

    def test_anonymous_cannot_create(self):
        res = self.client.post("/api/genres/", {"name": "Sci-Fi"})
        self.assertIn(res.status_code, (401, 403))

    def test_normal_user_cannot_create(self):
        self.client.force_authenticate(self.user)
        res = self.client.post("/api/genres/", {"name": "Sci-Fi"})
        self.assertEqual(res.status_code, 403)

    def test_admin_can_create_update_delete(self):
        self.client.force_authenticate(self.admin)
        res = self.client.post("/api/genres/", {"name": "Sci-Fi"})
        self.assertEqual(res.status_code, 201)
        gid = res.data["id"]

        res = self.client.put(f"/api/genres/{gid}/", {"name": "Science Fiction"})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Genre.objects.get(pk=gid).name, "Science Fiction")

        res = self.client.delete(f"/api/genres/{gid}/")
        self.assertEqual(res.status_code, 204)
