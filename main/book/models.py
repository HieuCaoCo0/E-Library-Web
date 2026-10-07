from django.db import models
from author.models import Author
from genre.models import Genre

# Create your models here.
class Book(models.Model):
    title = models.CharField(max_length=500)

    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name="book"
    )

    description = models.TextField(blank=True, null=True)

    rating = models.FloatField(blank=True, null=True)

    pages = models.IntegerField(blank=True,null=True)

    publish_date = models.DateField(blank=True, null=True)

    cover_image = models.URLField(
        max_length=1000,
        blank=True,
        null=True
    )

    source_url = models.URLField(
        max_length=255,
        unique=True,
        blank=True,
        null=True
    )

    genres = models.ManyToManyField(
        Genre,
        related_name="books"
    )

    def __str__(self):
        return self.title