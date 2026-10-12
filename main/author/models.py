from django.db import models


class Author(models.Model):
    goodreads_id = models.CharField(
        max_length=50,
        unique=True,
        null=True,
        blank=True
    )

    name = models.CharField(max_length=255)

    bio = models.TextField(blank=True)

    avatar_url = models.URLField(blank=True)

    birth_date = models.DateField(
        null=True,
        blank=True
    )

    average_rating = models.FloatField(
        null=True,
        blank=True
    )

    ratings_count = models.IntegerField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name