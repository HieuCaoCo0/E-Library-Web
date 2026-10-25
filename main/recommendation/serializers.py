from rest_framework import serializers

from book.serializers import BookReadSerializer


class RecommendedBookSerializer(BookReadSerializer):
    preference_score = serializers.FloatField(read_only=True)

    class Meta(BookReadSerializer.Meta):
        fields = BookReadSerializer.Meta.fields + ["preference_score"]
