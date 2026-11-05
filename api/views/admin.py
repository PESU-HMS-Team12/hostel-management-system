from django.contrib.auth import get_user_model
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import RoleProfile
from api.permissions import IsAdministrator
from api.serializers.admin import AdminUserSerializer, RoleAssignmentSerializer
from auditlog.services import create_audit_log

User = get_user_model()


@extend_schema(tags=["Administration"])
class AdminUserListView(APIView):
    """
    List user accounts and their assigned HMS roles.
    Restricted to system administrators.
    """
    permission_classes = [IsAdministrator]

    @extend_schema(
        summary="List all users and roles",
        responses={200: AdminUserSerializer(many=True)},
    )
    def get(self, request):
        users = (
            User.objects
            .select_related("role_profile", "role_profile__student")
            .all()
            .order_by("username")
        )
        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["Administration"])
class AdminRoleAssignView(APIView):
    """
    Assign or update a user's HMS role.
    Logs role changes in the audit log for compliance (TC-SEC-05).
    """
    permission_classes = [IsAdministrator]

    @extend_schema(
        summary="Assign or update user role",
        request=RoleAssignmentSerializer,
        responses={
            200: AdminUserSerializer,
            400: OpenApiResponse(description="Validation error"),
        },
    )
    def post(self, request):
        serializer = RoleAssignmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        role = serializer.validated_data["role"]
        student = serializer.validated_data.get("student")

        profile = RoleProfile.objects.filter(user=user).first()
        is_new = profile is None

        if is_new:
            profile = RoleProfile(user=user)

        profile.role = role
        profile.student = student
        profile.save()

        # Audit log role change without exposing passwords or credentials
        create_audit_log(
            request.user,
            "CREATE" if is_new else "UPDATE",
            "RoleProfile",
            profile.pk,
        )

        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Administration"])
class AdminUserApproveView(APIView):
    """
    Approves a pending (inactive) user registration and activates the account.
    Restricted to system administrators and recorded in the audit log.
    """
    permission_classes = [IsAdministrator]

    @extend_schema(
        summary="Approve pending user registration",
        request=None,
        responses={
            200: AdminUserSerializer,
            400: OpenApiResponse(description="Account already active or missing role profile"),
            404: OpenApiResponse(description="User account not found"),
        },
    )
    def post(self, request, user_id: int):
        with transaction.atomic():
            user = (
                User.objects
                .select_for_update()
                .filter(pk=user_id)
                .first()
            )
            if not user:
                return Response(
                    {"detail": "User account not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            if user.is_active:
                return Response(
                    {"detail": "User account is already active."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            profile = (
                RoleProfile.objects
                .select_related("student")
                .filter(user=user)
                .first()
            )
            if (
                not profile
                or profile.role != RoleProfile.Role.STUDENT
                or not profile.student
                or profile.student.status != "Active"
            ):
                return Response(
                    {
                        "detail": (
                            "Only pending STUDENT accounts linked to an active "
                            "student record can be approved."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.is_active = True
            user.save(update_fields=["is_active"])

            create_audit_log(
                request.user,
                "UPDATE",
                "User",
                user.pk,
            )

        return Response(
            AdminUserSerializer(user).data,
            status=status.HTTP_200_OK,
        )
