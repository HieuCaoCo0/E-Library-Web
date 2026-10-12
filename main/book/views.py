from rest_framework import generics, permissions, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from .models import Book
from .serializers import BookReadSerializer, BookWriteSerializer
from .services import with_stats
from .permissions import IsAdminOrReadOnly


class BookPagination(PageNumberPagination):
    page_size = 12

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'results': data,
        })


def book_queryset():
    qs = Book.objects.select_related('author').prefetch_related('genres')
    return with_stats(qs)


class BookList(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = BookPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'author__name']
    ordering_fields = ['id', 'title', 'rating', 'publish_date', 'avg_rating']
    ordering = ['id']

    def get_queryset(self):
        qs = Book.objects.select_related('author').prefetch_related('genres')
        for param, lookup in (('genre', 'genres__id'), ('author', 'author__id')):
            value = self.request.query_params.get(param)
            if value:
                if not value.isdecimal():
                    raise ValidationError({param: 'Phải là số nguyên.'})
                qs = qs.filter(**{lookup: value})
        return with_stats(qs)

    def get_serializer_class(self):
        return BookWriteSerializer if self.request.method == 'POST' else BookReadSerializer


class BookDetail(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return book_queryset()

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return BookWriteSerializer
        return BookReadSerializer