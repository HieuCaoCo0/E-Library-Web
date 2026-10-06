from rest_framework import serializers

from .models import UserReview


class UserReviewSerializer(serializers.ModelSerializer):
	username = serializers.CharField(source="user.username", read_only=True)
	avatar = serializers.SerializerMethodField()

	class Meta:
		model = UserReview
		fields = [
			"id",
			"user",
			"username",
			"avatar",
			"book",
			"rating",
			"comment",
			"created_at",
			"updated_at",
		]
		read_only_fields = [
			"id",
			"user",
			"username",
			"avatar",
			"book",
			"created_at",
			"updated_at",
		]

	def get_avatar(self, obj):
		return getattr(obj.user, "avatar", None)

	def validate_rating(self, value):
		if not 1 <= value <= 5:
			raise serializers.ValidationError(
				"Điểm đánh giá (rating) phải nằm trong khoảng từ 1 đến 5 sao."
			)
		return value
