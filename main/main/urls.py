"""
URL configuration for main project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints (localhost:8080/api/...)
    path('api/', include('customUser.urls')),
    path('api/', include('book.urls')),
    path('api/', include('author.urls')),
    path('api/', include('genre.urls')),
    path('api/', include('userBookStatus.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
