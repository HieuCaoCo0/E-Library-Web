from django.db.models import Count

from book.models import Book
from .models import Genre

# Chỉ cho phép sắp xếp theo các field này (tránh lỗi/lộ field qua query string)
ALLOWED_BOOK_ORDERING = {
    "title": "title",
    "-title": "-title",
    "rating": "rating",
    "-rating": "-rating",
    "publish_date": "publish_date",
    "-publish_date": "-publish_date",
}


class GenreService:
    """Xử lý truy vấn, lọc và gom nhóm sách theo thể loại."""

    @staticmethod
    def list_genres(search=None):
        qs = Genre.objects.annotate(book_count=Count("books")).order_by("name")
        if search:
            qs = qs.filter(name__icontains=search)
        return qs

    @staticmethod
    def books_of_genre(genre, ordering="-rating"):
        order = ALLOWED_BOOK_ORDERING.get(ordering, "-rating")
        return (
            Book.objects.filter(genres=genre)
            .select_related("author")  # author là ForeignKey -> select_related
            .order_by(order, "id")
        )
