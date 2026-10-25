from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RecommendedBookSerializer
from .services import TOP_N, RecommendationService


class RecommendationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        books, cold_start = RecommendationService.recommend_for_user(
            request.user,
            limit=TOP_N,
        )
        return Response(
            {
                "count": len(books),
                "cold_start": cold_start,
                "results": RecommendedBookSerializer(books, many=True).data,
            }
        )
