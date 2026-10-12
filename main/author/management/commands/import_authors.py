import gzip
import json

from django.core.management.base import BaseCommand
from authors.models import Author


class Command(BaseCommand):
    help = "Import 300 authors from Goodreads dataset"

    def handle(self, *args, **kwargs):

        file_path = "goodreads_book_authors.json.gz"

        count = 0

        with gzip.open(
            file_path,
            "rt",
            encoding="utf-8"
        ) as file:

            for line in file:

                if count >= 300:
                    break

                data = json.loads(line)

                goodreads_id = data.get("author_id")
                name = data.get("name", "").strip()

                if not goodreads_id or not name:
                    continue

                average_rating = data.get("average_rating")
                ratings_count = data.get("ratings_count")

                Author.objects.update_or_create(
                    goodreads_id=goodreads_id,
                    defaults={
                        "name": name,
                        "average_rating": (
                            float(average_rating)
                            if average_rating
                            else None
                        ),
                        "ratings_count": (
                            int(ratings_count)
                            if ratings_count
                            else None
                        ),
                    }
                )

                count += 1

                self.stdout.write(
                    f"Đã import {count}/300: {name}"
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Import thành công {count} tác giả!"
            )
        )