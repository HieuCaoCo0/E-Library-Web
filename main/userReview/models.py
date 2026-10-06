from django.db import models
from django.core.validators import MaxValueValidator, MinValueValidator
from customUser.models import CustomUser
from book.models import Book

# Create your models here.
class UserReview(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="reviews"
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book"],
                name="unique_user_book_review"
            )
        ]

        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user} - {self.book} - {self.rating}"