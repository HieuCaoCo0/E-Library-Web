from django.db import models
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

    rating = models.IntegerField()

    comment = models.TextField(blank=True, null=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book"],
                name="unique_user_book_review"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.book} - {self.rating}"