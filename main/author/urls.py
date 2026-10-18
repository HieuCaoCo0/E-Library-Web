from django.urls import path

from .views import (
    AuthorListAPIView,
    AuthorDetailAPIView,
)

urlpatterns = [
    # Author endpoints: localhost:8080/api/authors/...
    path("authors/", AuthorListAPIView.as_view(), name="author-list"),
    path("authors/<int:pk>/", AuthorDetailAPIView.as_view(), name="author-detail"),
]