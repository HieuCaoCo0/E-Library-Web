# models.py (Ví dụ cấu trúc bảng Sách)
from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=200, verbose_name="Tên sách")
    author = models.CharField(max_length=100, verbose_name="Tác giả")
    rating = models.FloatField(default=0, verbose_name="Đánh giá")

    class Meta:
        verbose_name = "Sách"
        verbose_name_plural = "Quản lý Sách"

    def __str__(self):
        return self.title