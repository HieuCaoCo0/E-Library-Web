from django.urls import path

from .views import BookReviewListCreateAPIView, UserReviewDetailAPIView


urlpatterns = [
    path(
        "api/books/<int:book_id>/reviews/",
        BookReviewListCreateAPIView.as_view(),
        name="book-reviews",
    ),
    path(
        "api/user-reviews/<int:pk>/",
        UserReviewDetailAPIView.as_view(),
        name="user-review-detail",
    ),
]