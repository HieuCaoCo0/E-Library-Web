from rest_framework import serializers
from .models import Author


class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Author

        fields = [
            "id",
            "goodreads_id",
            "name",
            "bio",
            "avatar_url",
            "birth_date",
            "average_rating",
            "ratings_count"
        ]