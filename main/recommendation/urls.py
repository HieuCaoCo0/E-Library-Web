from django.urls import path

from .views import RecommendationListView

urlpatterns = [
    path("recommendations/", RecommendationListView.as_view(), name="recommendations"),
]
