import json
import re
import sys
from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from author.models import Author
from book.models import Book
from genre.models import Genre


class Command(BaseCommand):
    help = "Import books from books.json into MySQL"

    DATE_FORMATS = (
        "%B %d, %Y",
        "%b %d, %Y",
        "%B %Y",
        "%b %Y",
        "%Y",
    )

    def handle(self, *args, **options):
        for stream in (sys.stdout, sys.stderr):
            try:
                stream.reconfigure(encoding="utf-8", errors="replace")
            except Exception:
                pass

        json_path = Path(__file__).resolve().parents[2] / "data" / "books.json"

        if not json_path.exists():
            self.stdout.write(self.style.ERROR(f"Không tìm thấy file: {json_path}"))
            return

        with json_path.open("r", encoding="utf-8") as file:
            books_data = json.load(file)

        if not isinstance(books_data, list):
            self.stdout.write(self.style.ERROR("books.json phải là một danh sách các object."))
            return

        created_count = 0
        updated_count = 0
        skipped_count = 0

        for data in books_data:
            title = self._clean(data.get("title"))
            author_name = self._clean(data.get("author"))
            source_url = self._clean(data.get("source_url"))

            if not title or not author_name or not source_url:
                skipped_count += 1
                continue

            try:
                author, _ = Author.objects.get_or_create(name=author_name)

                book, created = Book.objects.update_or_create(
                    source_url=source_url,
                    defaults={
                        "title": title,
                        "author": author,
                        "description": self._clean(data.get("description")),
                        "rating": self._parse_float(data.get("rating")),
                        "pages": self._parse_pages(data.get("pages")),
                        "publish_date": self._parse_publish_date(data.get("publish_date")),
                        "cover_image": self._clean(data.get("cover_image")),
                    },
                )

                book.genres.clear()
                for genre_name in data.get("genres") or []:
                    genre_name = self._clean(genre_name)
                    if not genre_name:
                        continue
                    genre, _ = Genre.objects.get_or_create(name=genre_name)
                    book.genres.add(genre)

                if created:
                    created_count += 1
                    self.stdout.write(self.style.SUCCESS(f"Created: {book.title}"))
                else:
                    updated_count += 1
                    self.stdout.write(self.style.WARNING(f"Updated: {book.title}"))
            except Exception as exc:
                skipped_count += 1
                self.stdout.write(
                    self.style.ERROR(f"Lỗi khi import '{title}': {exc}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Import hoàn tất: {created_count} created, "
                f"{updated_count} updated, {skipped_count} skipped"
            )
        )

    def _clean(self, value):
        if value is None:
            return None
        text = str(value).strip()
        if not text or text.upper() == "N/A":
            return None
        return text

    def _parse_float(self, value):
        text = self._clean(value)
        if text is None:
            return None
        try:
            return float(text.replace(",", ""))
        except ValueError:
            return None

    def _parse_pages(self, value):
        text = self._clean(value)
        if text is None:
            return None
        match = re.search(r"\d+", text.replace(",", ""))
        if not match:
            return None
        return int(match.group())

    def _parse_publish_date(self, value):
        text = self._clean(value)
        if text is None:
            return None

        text = re.sub(
            r"^(First published|Published|Expected publication)\s+",
            "",
            text,
            flags=re.IGNORECASE,
        ).strip()

        for date_format in self.DATE_FORMATS:
            try:
                return datetime.strptime(text, date_format).date()
            except ValueError:
                continue
        return None
