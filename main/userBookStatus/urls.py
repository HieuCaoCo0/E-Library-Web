from rest_framework.routers import DefaultRouter
from .views import UserLibraryViewSet

router = DefaultRouter()
router.register("user-library", UserLibraryViewSet, basename="user-library")

urlpatterns = router.urls