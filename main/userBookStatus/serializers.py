from rest_framework import serializers
from .models import UserBookStatus, ReadingStatus


class UserBookStatusSerializer(serializers.ModelSerializer):
    # Cho phép gửi "reading" viết thường, tự chuyển thành "READING"
    status = serializers.CharField()

    class Meta:
        model = UserBookStatus
        fields = ["id", "book", "status"]
        read_only_fields = ["id"]
        validators = []  # tắt validator unique tự sinh, vì service dùng update_or_create

    def validate_status(self, value):
        value = value.upper()
        if value not in ReadingStatus.values:
            raise serializers.ValidationError(
                f"Trạng thái hợp lệ: {', '.join(ReadingStatus.values)}"
            )
        return value

    def update(self, instance, validated_data):
        new_book = validated_data.get("book")
        if new_book is not None and new_book.pk != instance.book_id:
            raise serializers.ValidationError(
                {"book": "Không thể đổi sách của bản ghi. Hãy xóa rồi thêm lại."}
            )
        instance.status = validated_data.get("status", instance.status)
        instance.save(update_fields=["status"])
        return instance