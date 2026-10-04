from django.db import models
from customUser.models import CustomUser
from book.models import Book
# Create your models here.

class ReadingStatus(models.TextChoices):
    WANT_TO_READ = "WANT_TO_READ", "Want to read"
    READING = "READING", "Reading"
    READ = "READ", "Read"

class UserBookStatus(models.Model):
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name="book_statuses"
    )

    book = models.ForeignKey(
        Book,
        on_delete=models.CASCADE,
        related_name="user_statuses"
    )
    status = models.CharField(
        max_length=20,
        choices=ReadingStatus.choices
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "book"],
                name="unique_user_book_status"
            )
        ]

    def __str__(self):
        return f"{self.user} - {self.book} - {self.status}"