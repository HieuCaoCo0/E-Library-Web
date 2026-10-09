from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAdminUser

from .serializers import (
    BookMiniSerializer,
    GenreSerializer,
    GenreWriteSerializer,
)
from .services import GenreService


class StandardPagination(PageNumberPagination):
    page_size = 20


class GenreViewSet(viewsets.ModelViewSet):
    """
    GET    /api/genres/           danh sách thể loại (?search=)
    GET    /api/genres/{id}/      chi tiết thể loại + sách (?page=, ?ordering=)
    POST/PUT/PATCH/DELETE         chỉ Admin
    """

    pagination_class = StandardPagination

    def get_queryset(self):
        return GenreService.list_genres(self.request.query_params.get("search"))

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return GenreWriteSerializer
        return GenreSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]

    def retrieve(self, request, *args, **kwargs):
        genre = get_object_or_404(self.get_queryset(), pk=kwargs["pk"])
        books = GenreService.books_of_genre(
            genre, request.query_params.get("ordering", "-rating")
        )
        paginator = StandardPagination()
        page = paginator.paginate_queryset(books, request)

        data = GenreSerializer(genre).data
        data["books"] = BookMiniSerializer(page, many=True).data
        return paginator.get_paginated_response(data)
