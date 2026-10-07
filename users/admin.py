# admin.py
from django.contrib import admin
from .models import Book # Import bảng Sách vào đây

# Đăng ký bảng Sách để hiển thị trên web Admin
admin.site.register(Book)