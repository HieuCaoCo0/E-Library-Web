from rest_framework import serializers

from book.models import Book
from .models import Genre


class BookMiniSerializer(serializers.ModelSerializer):
    """Serializer sách rút gọn dùng trong trang chi tiết thể loại."""

    author_name = serializers.CharField(source="author.name", read_only=True)

    class Meta:
        model = Book
        fields = ["id", "title", "cover_image", "rating", "author_name"]


class GenreSerializer(serializers.ModelSerializer):
    book_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Genre
        fields = ["id", "name", "book_count"]


class GenreWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]
