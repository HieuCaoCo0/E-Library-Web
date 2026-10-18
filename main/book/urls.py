from django.urls import path

from .views import BookList, BookDetail

urlpatterns = [
    # Book endpoints: localhost:8080/api/books/...
    path("books/", BookList.as_view(), name="book-list"),
    path("books/<int:pk>/", BookDetail.as_view(), name="book-detail"),
]