from django.db import connection
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiResponse


class HealthCheckView(APIView):
    """
    Service health check endpoint for monitoring, container orchestrators,
    and deployment readiness probes.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(
        summary="Service health check",
        description="Verifies database connectivity and service availability.",
        responses={
            200: OpenApiResponse(description="Service and database are operational"),
            503: OpenApiResponse(description="Database or service is unavailable"),
        },
        tags=["System"],
    )
    def get(self, request):
        db_status = "operational"
        overall_status = "healthy"
        http_status = status.HTTP_200_OK

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
                if not row or row[0] != 1:
                    db_status = "unexpected_response"
                    overall_status = "unhealthy"
                    http_status = status.HTTP_503_SERVICE_UNAVAILABLE
        except Exception as exc:
            db_status = f"unreachable: {str(exc)}"
            overall_status = "unhealthy"
            http_status = status.HTTP_503_SERVICE_UNAVAILABLE

        payload = {
            "status": overall_status,
            "timestamp": timezone.now().isoformat(),
            "services": {
                "database": db_status,
            },
        }

        return Response(payload, status=http_status)
