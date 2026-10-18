from django.contrib import admin
from .models import UserReview


@admin.register(UserReview)
class UserReviewAdmin(admin.ModelAdmin):
	list_display = ("user", "book", "rating", "created_at", "updated_at")
	list_filter = ("rating", "created_at", "updated_at")
	search_fields = ("user__username", "book__title", "comment")
