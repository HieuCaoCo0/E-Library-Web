from rest_framework import serializers
from .models import Author


class AuthorListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author
        fields = ["id", "name"]


class AuthorDetailSerializer(serializers.ModelSerializer):
    book = serializers.SerializerMethodField()

    class Meta:
        model = Author
        fields = ["id", "name", "book"]

    def get_book(self, obj):
        return [
            {
                "id": book.id,
                "title": book.title,
                "rating": book.rating,
                "pages": book.pages,
                "publish_date": book.publish_date,
                "cover_image": book.cover_image,
                "source_url": book.source_url,
            }
            for book in obj.book.all()
        ]