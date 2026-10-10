from django.core.paginator import Paginator
from django.db.models import Avg, Count, Q
from django.shortcuts import get_object_or_404

from .models import Book

ALLOWED_ORDERING = {"id", "title", "rating", "publish_date", "avg_rating"}


def with_stats(qs):
    # điểm trung bình + số review tính từ bảng review
    return qs.annotate(
        avg_rating=Avg("reviews__rating"),
        review_count=Count("reviews", distinct=True),
    )


def search_books(params):
    qs = Book.objects.select_related("author").prefetch_related("genres")

    genre = params.get("genre")
    if genre:
        qs = qs.filter(genres__id=genre)

    author = params.get("author")
    if author:
        qs = qs.filter(author__id=author)

    search = params.get("search")
    if search:
        qs = qs.filter(Q(title__icontains=search) | Q(author__name__icontains=search))

    qs = with_stats(qs)

    ordering = params.get("ordering", "id")
    if ordering.lstrip("-") not in ALLOWED_ORDERING:
        ordering = "id"
    return qs.order_by(ordering)


def paginate(qs, params, page_size=12):
    return Paginator(qs, page_size).get_page(params.get("page"))


def get_book_detail(book_id):
    return get_object_or_404(with_stats(Book.objects.select_related("author")), id=book_id)