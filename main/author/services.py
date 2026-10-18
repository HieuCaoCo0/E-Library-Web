from .models import Author


def get_authors(search=None):
    authors = Author.objects.all()

    if search:
        authors = authors.filter(
            name__icontains=search
        )

    return authors.order_by("name")


def get_author_detail(author_id):
    return (
        Author.objects
        .prefetch_related("book")
        .get(id=author_id)
    )