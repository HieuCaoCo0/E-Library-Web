from django.urls import path
from .views import AuthorListAPIView, AuthorDetailAPIView


urlpatterns = [
    path("authors/", AuthorListAPIView.as_view()),
    path("authors/<int:pk>/", AuthorDetailAPIView.as_view()),
]