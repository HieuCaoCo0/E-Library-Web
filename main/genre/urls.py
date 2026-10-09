from rest_framework.routers import DefaultRouter

from .views import GenreViewSet

router = DefaultRouter()
router.register("genres", GenreViewSet, basename="genre")

urlpatterns = router.urls
