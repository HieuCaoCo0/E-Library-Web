from rest_framework import serializers
from .models import Book


class BookReadSerializer(serializers.ModelSerializer):
    """Dùng khi xem (GET). Giữ đúng hình dạng JSON mà trang /books/ đang đọc."""
    author = serializers.StringRelatedField()
    author_id = serializers.IntegerField(read_only=True)
    genres = serializers.StringRelatedField(many=True)
    genre_ids = serializers.PrimaryKeyRelatedField(source='genres', many=True, read_only=True)
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'author_id', 'genres', 'genre_ids',
                  'description', 'rating', 'pages', 'publish_date',
                  'cover_image', 'source_url', 'avg_rating', 'review_count']

    def get_avg_rating(self, obj):
        return round(obj.avg_rating, 2) if obj.avg_rating is not None else None


class BookWriteSerializer(serializers.ModelSerializer):
    """Dùng khi thêm/sửa (POST/PUT/PATCH): nhận id tác giả và danh sách id thể loại."""
    class Meta:
        model = Book
        fields = ['title', 'author', 'genres', 'description', 'rating',
                  'pages', 'publish_date', 'cover_image', 'source_url']
        extra_kwargs = {'genres': {'required': False, 'allow_empty': True}}