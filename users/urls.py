from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('dashboard/', views.custom_admin_view, name='custom_admin'),
    path('delete-book/<int:id>/', views.delete_book, name='delete_book'),
    path('edit-book/<int:id>/', views.edit_book, name='edit_book'),
]