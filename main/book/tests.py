from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from author.models import Author
from genre.models import Genre
from userReview.models import UserReview

from .models import Book
from .services import with_stats

API = "/api/books/"


def make_user(username, **extra):
    """Tạo người dùng thử. Nếu CustomUser bắt buộc thêm trường khác (ví dụ email)
    thì chỉ cần sửa ở MỘT chỗ này."""
    return get_user_model().objects.create_user(username=username, password="x", **extra)


def add_review(user, book, rating):
    return UserReview.objects.create(user=user, book=book, rating=rating)


class BookTestBase(APITestCase):
    """Tạo sẵn dữ liệu mẫu. Chúng nằm trong database TEST (tự tạo rồi tự xoá),
    không đụng tới 300 sách thật trong eLibDB."""

    @classmethod
    def setUpTestData(cls):
        cls.tolkien = Author.objects.create(name="J.R.R. Tolkien")
        cls.orwell = Author.objects.create(name="George Orwell")

        # Giả định model Genre có trường `name`. Nếu khác thì đổi ở đây.
        cls.fantasy = Genre.objects.create(name="Fantasy")
        cls.classics = Genre.objects.create(name="Classics")

        cls.hobbit = Book.objects.create(title="The Hobbit", author=cls.tolkien, rating=4.3, pages=310)
        cls.hobbit.genres.add(cls.fantasy)

        cls.farm = Book.objects.create(title="Animal Farm", author=cls.orwell, rating=4.0, pages=112)
        cls.farm.genres.add(cls.classics)

        cls.nineteen = Book.objects.create(title="1984", author=cls.orwell, rating=4.2)
        cls.nineteen.genres.add(cls.classics)

        cls.admin = make_user("admin_test", is_staff=True)
        cls.member = make_user("member_test")

    def detail_url(self, book):
        return "%s%d/" % (API, book.id)


# ---------------------------------------------------------------- danh sách
class BookListTests(BookTestBase):
    def test_list_is_public_and_has_pagination_fields(self):
        res = self.client.get(API)  # chưa đăng nhập vẫn xem được
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for key in ("count", "page", "total_pages", "results"):
            self.assertIn(key, data)
        self.assertEqual(data["count"], 3)

    def test_list_item_has_expected_fields(self):
        item = self.client.get(API).json()["results"][0]
        for key in ("id", "title", "author", "author_id", "genres", "genre_ids",
                    "rating", "cover_image"):
            self.assertIn(key, item)

    def test_author_is_name_and_author_id_is_number(self):
        item = self.client.get(API + "?search=hobbit").json()["results"][0]
        self.assertEqual(item["author"], "J.R.R. Tolkien")
        self.assertEqual(item["author_id"], self.tolkien.id)
        self.assertEqual(item["genres"], ["Fantasy"])
        self.assertEqual(item["genre_ids"], [self.fantasy.id])

    def test_pagination_splits_pages(self):
        Book.objects.bulk_create(
            [Book(title="Sach %d" % i, author=self.tolkien) for i in range(15)]
        )  # tổng 18 sách, 12 sách/trang => 2 trang
        page1 = self.client.get(API + "?page=1").json()
        page2 = self.client.get(API + "?page=2").json()
        self.assertEqual(page1["total_pages"], 2)
        self.assertEqual(len(page1["results"]), 12)
        self.assertEqual(len(page2["results"]), 6)
        self.assertEqual(page2["page"], 2)

    def test_page_out_of_range_returns_404(self):
        self.assertEqual(self.client.get(API + "?page=999").status_code, 404)

    def test_search_by_title(self):
        data = self.client.get(API + "?search=hobbit").json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["title"], "The Hobbit")

    def test_search_by_author_name_ignores_case(self):
        data = self.client.get(API + "?search=ORWELL").json()
        self.assertEqual(data["count"], 2)

    def test_search_without_match_returns_empty(self):
        data = self.client.get(API + "?search=zzzkhongco").json()
        self.assertEqual(data["count"], 0)
        self.assertEqual(data["results"], [])

    def test_filter_by_author(self):
        data = self.client.get(API + "?author=%d" % self.orwell.id).json()
        self.assertEqual(data["count"], 2)

    def test_filter_by_genre(self):
        data = self.client.get(API + "?genre=%d" % self.fantasy.id).json()
        self.assertEqual(data["count"], 1)
        self.assertEqual(data["results"][0]["title"], "The Hobbit")

    def test_filter_genre_and_author_together(self):
        url = API + "?genre=%d&author=%d" % (self.classics.id, self.orwell.id)
        self.assertEqual(self.client.get(url).json()["count"], 2)

    def test_filter_search_and_genre_together(self):
        url = API + "?search=orwell&genre=%d" % self.fantasy.id
        self.assertEqual(self.client.get(url).json()["count"], 0)

    def test_non_numeric_filter_returns_400(self):
        self.assertEqual(self.client.get(API + "?genre=abc").status_code, 400)
        self.assertEqual(self.client.get(API + "?author=abc").status_code, 400)

    def test_ordering_by_rating_desc(self):
        data = self.client.get(API + "?ordering=-rating").json()
        self.assertEqual(data["results"][0]["title"], "The Hobbit")  # 4.3 cao nhất

    def test_ordering_by_title(self):
        data = self.client.get(API + "?ordering=title").json()
        self.assertEqual(data["results"][0]["title"], "1984")

    def test_ordering_by_avg_rating_uses_reviews(self):
        add_review(make_user("o1"), self.nineteen, 5)
        add_review(make_user("o2"), self.hobbit, 3)
        data = self.client.get(API + "?ordering=-avg_rating").json()
        self.assertEqual(data["results"][0]["title"], "1984")  # trung bình 5

    def test_unknown_ordering_is_ignored(self):
        res = self.client.get(API + "?ordering=khong_co_truong_nay")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["count"], 3)


# ---------------------------------------------------------------- chi tiết
class BookDetailTests(BookTestBase):
    def test_detail_ok_without_reviews(self):
        res = self.client.get(self.detail_url(self.hobbit))
        self.assertEqual(res.status_code, 200)
        data = res.json()
        for key in ("id", "title", "author", "author_id", "genres", "genre_ids",
                    "description", "pages", "publish_date", "source_url",
                    "avg_rating", "review_count"):
            self.assertIn(key, data)
        self.assertEqual(data["title"], "The Hobbit")
        self.assertEqual(data["review_count"], 0)
        self.assertIsNone(data["avg_rating"])

    def test_detail_not_found(self):
        self.assertEqual(self.client.get(API + "999999/").status_code, 404)

    def test_average_and_count_with_reviews(self):
        add_review(make_user("r1"), self.hobbit, 5)
        add_review(make_user("r2"), self.hobbit, 4)
        data = self.client.get(self.detail_url(self.hobbit)).json()
        self.assertEqual(data["review_count"], 2)
        self.assertEqual(data["avg_rating"], 4.5)

    def test_average_is_rounded_to_two_decimals(self):
        for i, score in enumerate([5, 4, 4]):
            add_review(make_user("r%d" % i), self.hobbit, score)
        data = self.client.get(self.detail_url(self.hobbit)).json()
        self.assertEqual(data["avg_rating"], 4.33)  # 13/3 = 4.3333...

    def test_stats_are_per_book(self):
        add_review(make_user("r1"), self.farm, 1)
        data = self.client.get(self.detail_url(self.hobbit)).json()
        self.assertEqual(data["review_count"], 0)
        self.assertIsNone(data["avg_rating"])

    def test_stats_not_inflated_by_multiple_genres(self):
        # sách có 2 thể loại + 2 review: số review phải vẫn là 2, không bị nhân đôi
        self.hobbit.genres.add(self.classics)
        add_review(make_user("r1"), self.hobbit, 5)
        add_review(make_user("r2"), self.hobbit, 4)
        data = self.client.get(self.detail_url(self.hobbit)).json()
        self.assertEqual(data["review_count"], 2)
        self.assertEqual(data["avg_rating"], 4.5)

    def test_stats_still_correct_when_filtering_by_genre(self):
        self.hobbit.genres.add(self.classics)
        add_review(make_user("r1"), self.hobbit, 5)
        add_review(make_user("r2"), self.hobbit, 4)
        url = API + "?genre=%d&search=hobbit" % self.classics.id
        item = self.client.get(url).json()["results"][0]
        self.assertEqual(item["review_count"], 2)
        self.assertEqual(item["avg_rating"], 4.5)


# ---------------------------------------------------------------- quyền ghi
class BookWritePermissionTests(BookTestBase):
    def test_create_requires_admin(self):
        payload = {"title": "Sach moi", "author": self.tolkien.id}

        # chưa đăng nhập
        self.assertEqual(self.client.post(API, payload, format="json").status_code, 403)

        # đăng nhập nhưng không phải admin
        self.client.force_authenticate(user=self.member)
        self.assertEqual(self.client.post(API, payload, format="json").status_code, 403)
        self.assertFalse(Book.objects.filter(title="Sach moi").exists())

    def test_update_requires_admin(self):
        url = self.detail_url(self.hobbit)
        payload = {"title": "Doi ten", "author": self.tolkien.id}
        self.assertEqual(self.client.put(url, payload, format="json").status_code, 403)
        self.assertEqual(self.client.patch(url, {"title": "Doi ten"}, format="json").status_code, 403)

        self.client.force_authenticate(user=self.member)
        self.assertEqual(self.client.put(url, payload, format="json").status_code, 403)

        self.hobbit.refresh_from_db()
        self.assertEqual(self.hobbit.title, "The Hobbit")

    def test_delete_requires_admin(self):
        url = self.detail_url(self.hobbit)
        self.assertEqual(self.client.delete(url).status_code, 403)

        self.client.force_authenticate(user=self.member)
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.assertTrue(Book.objects.filter(id=self.hobbit.id).exists())


# ---------------------------------------------------------------- admin CRUD
class BookAdminCrudTests(BookTestBase):
    def setUp(self):
        self.client.force_authenticate(user=self.admin)

    def test_create_ok_with_genres(self):
        payload = {
            "title": "Sach moi",
            "author": self.tolkien.id,
            "rating": 3.5,
            "pages": 200,
            "genres": [self.fantasy.id],
        }
        res = self.client.post(API, payload, format="json")
        self.assertEqual(res.status_code, 201)
        book = Book.objects.get(title="Sach moi")
        self.assertEqual(book.pages, 200)
        self.assertEqual(list(book.genres.all()), [self.fantasy])

    def test_create_without_genres_is_allowed(self):
        res = self.client.post(API, {"title": "Khong the loai", "author": self.tolkien.id}, format="json")
        self.assertEqual(res.status_code, 201)

    def test_create_two_books_with_empty_source_url(self):
        # source_url có unique, nhưng để trống (null) thì không được coi là trùng
        for title in ("A", "B"):
            res = self.client.post(
                API, {"title": title, "author": self.tolkien.id, "source_url": None}, format="json"
            )
            self.assertEqual(res.status_code, 201)

    def test_create_duplicate_source_url_returns_400(self):
        payload = {"title": "X", "author": self.tolkien.id, "source_url": "https://example.com/a"}
        self.assertEqual(self.client.post(API, payload, format="json").status_code, 201)
        payload["title"] = "Y"
        self.assertEqual(self.client.post(API, payload, format="json").status_code, 400)

    def test_create_missing_title_returns_400(self):
        res = self.client.post(API, {"author": self.tolkien.id}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_create_with_invalid_json_returns_400(self):
        res = self.client.post(API, data="khong phai json", content_type="application/json")
        self.assertEqual(res.status_code, 400)

    def test_create_with_unknown_author_returns_400(self):
        res = self.client.post(API, {"title": "X", "author": 999999}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_put_replaces_main_fields(self):
        url = self.detail_url(self.hobbit)
        res = self.client.put(url, {"title": "The Hobbit (ban moi)", "author": self.tolkien.id}, format="json")
        self.assertEqual(res.status_code, 200)
        self.hobbit.refresh_from_db()
        self.assertEqual(self.hobbit.title, "The Hobbit (ban moi)")

    def test_put_missing_required_field_returns_400(self):
        res = self.client.put(self.detail_url(self.hobbit), {"title": "Chi co ten"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_patch_changes_only_sent_fields(self):
        res = self.client.patch(self.detail_url(self.hobbit), {"title": "Doi ten"}, format="json")
        self.assertEqual(res.status_code, 200)
        self.hobbit.refresh_from_db()
        self.assertEqual(self.hobbit.title, "Doi ten")
        self.assertEqual(self.hobbit.pages, 310)  # trường không gửi thì giữ nguyên

    def test_patch_replaces_genres(self):
        res = self.client.patch(self.detail_url(self.hobbit), {"genres": [self.classics.id]}, format="json")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(list(self.hobbit.genres.all()), [self.classics])

    def test_update_not_found(self):
        res = self.client.patch(API + "999999/", {"title": "X"}, format="json")
        self.assertEqual(res.status_code, 404)

    def test_delete_ok(self):
        res = self.client.delete(self.detail_url(self.farm))
        self.assertEqual(res.status_code, 204)
        self.assertFalse(Book.objects.filter(id=self.farm.id).exists())

    def test_delete_not_found(self):
        self.assertEqual(self.client.delete(API + "999999/").status_code, 404)

    def test_unsupported_method_returns_405(self):
        self.assertEqual(self.client.patch(API, {}, format="json").status_code, 405)


# ---------------------------------------------------------------- services
class BookServiceTests(BookTestBase):
    """Test thẳng hàm with_stats trong services.py, không đi qua HTTP."""

    def test_with_stats_without_reviews(self):
        book = with_stats(Book.objects.all()).get(id=self.hobbit.id)
        self.assertEqual(book.review_count, 0)
        self.assertIsNone(book.avg_rating)

    def test_with_stats_with_reviews(self):
        add_review(make_user("r1"), self.hobbit, 5)
        add_review(make_user("r2"), self.hobbit, 3)
        book = with_stats(Book.objects.all()).get(id=self.hobbit.id)
        self.assertEqual(book.review_count, 2)
        self.assertEqual(book.avg_rating, 4.0)

    def test_with_stats_keeps_all_books(self):
        add_review(make_user("r1"), self.hobbit, 5)
        self.assertEqual(with_stats(Book.objects.all()).count(), 3)