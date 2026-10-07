import django_filters
from rest_framework import generics, permissions, filters
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Book
from .serializers import BookReadSerializer, BookWriteSerializer
from .services import with_stats
from .permissions import IsAdminOrReadOnly


class BookFilter(django_filters.FilterSet):
    genre = django_filters.NumberFilter(field_name='genres__id')
    author = django_filters.NumberFilter(field_name='author__id')

    class Meta:
        model = Book
        fields = ['genre', 'author']


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
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = BookFilter
    search_fields = ['title', 'author__name']
    ordering_fields = ['id', 'title', 'rating', 'publish_date', 'avg_rating']
    ordering = ['id']

    def get_queryset(self):
        return book_queryset()

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