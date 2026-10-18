

from rest_framework import mixins, viewsets, serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services
from .models import ReadingStatus
from .serializers import UserBookStatusSerializer


class UserLibraryViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = UserBookStatusSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        status = None
        if self.action == "list":
            raw = self.request.query_params.get("status")
            if raw:
                status = raw.strip().upper()
                if status not in ReadingStatus.values:
                    raise serializers.ValidationError(
                        {"status": f"Trạng thái hợp lệ: {', '.join(ReadingStatus.values)}"}
                    )
        return services.get_user_library(self.request.user, status)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, created = services.add_or_update_book(
            user=request.user,
            book=serializer.validated_data["book"],
            status=serializer.validated_data["status"],
        )
        data = self.get_serializer(obj).data
        return Response(data, status=201 if created else 200)