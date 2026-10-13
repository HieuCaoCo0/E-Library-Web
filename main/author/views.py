from rest_framework import generics

from .models import Author
from .serializers import (
    AuthorListSerializer,
    AuthorDetailSerializer
)
from .services import get_authors
from .permissions import IsAdminOrReadOnly


class AuthorListAPIView(generics.ListCreateAPIView):

    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        search = self.request.query_params.get("search")
        return get_authors(search)

    def get_serializer_class(self):
        return AuthorListSerializer


class AuthorDetailAPIView(generics.RetrieveUpdateDestroyAPIView):

    queryset = Author.objects.all()

    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_class(self):

        if self.request.method == "GET":
            return AuthorDetailSerializer

        return AuthorListSerializer