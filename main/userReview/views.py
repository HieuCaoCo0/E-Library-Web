from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.response import Response

from book.models import Book

from .models import UserReview
from .permissions import IsReviewOwnerOrReadOnly
from .serializers import UserReviewSerializer
from .services import ReviewService


class BookReviewListCreateAPIView(generics.ListCreateAPIView):
	serializer_class = UserReviewSerializer
	authentication_classes = [BasicAuthentication]

	def get_permissions(self):
		if self.request.method == "POST":
			return [permissions.IsAuthenticated()]
		return [permissions.AllowAny()]

	def get_queryset(self):
		get_object_or_404(Book, pk=self.kwargs["book_id"])
		return UserReview.objects.filter(book_id=self.kwargs["book_id"]).select_related("user")

	def create(self, request, *args, **kwargs):
		book = get_object_or_404(Book, pk=kwargs["book_id"])
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		try:
			review = ReviewService.create_review(
				user=request.user,
				book=book,
				rating=serializer.validated_data["rating"],
				comment=serializer.validated_data.get("comment"),
			)
		except DjangoValidationError as error:
			raise serializers.ValidationError({"detail": error.messages})
		return Response(
			self.get_serializer(review).data,
			status=status.HTTP_201_CREATED,
		)


class UserReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
	queryset = UserReview.objects.select_related("user", "book")
	serializer_class = UserReviewSerializer
	authentication_classes = [BasicAuthentication]
	permission_classes = [IsReviewOwnerOrReadOnly]

	def update(self, request, *args, **kwargs):
		partial = kwargs.pop("partial", False)
		instance = self.get_object()
		serializer = self.get_serializer(instance, data=request.data, partial=partial)
		serializer.is_valid(raise_exception=True)
		update_data = {}
		if "rating" in serializer.validated_data:
			update_data["rating"] = serializer.validated_data["rating"]
		if "comment" in serializer.validated_data:
			update_data["comment"] = serializer.validated_data["comment"]
		review = ReviewService.update_review(instance, **update_data)
		return Response(self.get_serializer(review).data)

	def perform_destroy(self, instance):
		ReviewService.delete_review(instance)
