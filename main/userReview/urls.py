from django.urls import path

from .views import BookReviewListCreateAPIView, UserReviewDetailAPIView


urlpatterns = [
    path(
        "books/<int:book_id>/reviews/",
        BookReviewListCreateAPIView.as_view(),
        name="book-reviews",
    ),
    path(
        "user-reviews/<int:pk>/",
        UserReviewDetailAPIView.as_view(),
        name="user-review-detail",
    ),
]