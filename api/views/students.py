from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.permissions import IsOwnerStudentOrStaff, IsWardenOrAdministrator
from api.serializers.students import StudentSerializer
from auditlog.services import create_audit_log
from students.models import Student


@extend_schema(tags=["Students"])
class StudentViewSet(viewsets.ModelViewSet):
    """
    Endpoints for creating, listing, retrieving, updating, searching, and deactivating students.
    """
    queryset = Student.objects.all().order_by("student_id")
    serializer_class = StudentSerializer

    def get_permissions(self):
        if self.action in ["retrieve"]:
            return [IsOwnerStudentOrStaff()]
        return [IsWardenOrAdministrator()]

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get("q", "").strip()
        status_param = self.request.query_params.get("status", "").strip()

        if query:
            queryset = queryset.filter(
                Q(student_id__icontains=query)
                | Q(name__icontains=query)
                | Q(course_program__icontains=query)
            )

        if status_param:
            queryset = queryset.filter(status=status_param)

        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter(name="q", description="Search by student ID, name, or course program", required=False, type=str),
            OpenApiParameter(name="status", description="Filter by status (Active/Inactive)", required=False, type=str),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def perform_create(self, serializer):
        student = serializer.save()
        create_audit_log(
            self.request.user,
            "CREATE",
            "Student",
            student.student_id,
        )

    def perform_update(self, serializer):
        student = serializer.save()
        create_audit_log(
            self.request.user,
            "UPDATE",
            "Student",
            student.student_id,
        )

    @extend_schema(
        summary="Deactivate a student",
        description="Sets the student status to Inactive.",
        request=None,
        responses={200: StudentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        student = self.get_object()
        student.status = "Inactive"
        student.save(update_fields=["status"])

        create_audit_log(
            request.user,
            "UPDATE",
            "Student",
            student.student_id,
        )

        return Response(
            StudentSerializer(student).data,
            status=status.HTTP_200_OK,
        )
