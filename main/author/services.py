from django.db.models import Q
from .models import Author


def get_authors(search=None):
    authors = Author.objects.all()

    if search:
        authors = authors.filter(
            Q(name__icontains=search)
        )

    return authors


def get_author_detail(author_id):
    return (
        Author.objects
        .prefetch_related("books")
        .get(id=author_id)
    )