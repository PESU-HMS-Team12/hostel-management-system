from django.db import transaction
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from accounts.decorators import get_user_role
from accounts.models import RoleProfile
from allocations.models import Allocation
from api.permissions import IsOwnerStudentOrStaff, IsWardenOrAdministrator
from api.serializers.allocations import (
    AllocationCreateSerializer,
    AllocationSerializer,
    AllocationTransferSerializer,
    AllocationVacateSerializer,
)
from auditlog.services import create_audit_log
from hostels.models import Room


@extend_schema(tags=["Allocations"])
class AllocationViewSet(viewsets.ModelViewSet):
    """
    Endpoints for room allocation creation, listing, history, transfers, and vacations.
    All state-changing operations are transaction-safe with row-locking to prevent over-allocation.
    """
    serializer_class = AllocationSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsOwnerStudentOrStaff()]
        return [IsWardenOrAdministrator()]

    def get_queryset(self):
        user = self.request.user
        role = get_user_role(user)

        queryset = (
            Allocation.objects
            .select_related("student", "room", "room__hostel")
            .order_by("-allocation_date", "-pk")
        )

        # Object isolation: Student accounts only see their own allocations
        if role == RoleProfile.Role.STUDENT:
            profile = getattr(user, "role_profile", None)
            student = getattr(profile, "student", None)
            if not student:
                return queryset.none()
            return queryset.filter(student=student)

        # Staff filtering: Query string and status filter
        query = self.request.query_params.get("q", "").strip()
        status_param = self.request.query_params.get("status", "all").strip().lower()

        if query:
            queryset = queryset.filter(
                Q(student__student_id__icontains=query)
                | Q(student__name__icontains=query)
                | Q(room__room_no__icontains=query)
                | Q(room__hostel__name__icontains=query)
            )

        if status_param == "active":
            queryset = queryset.filter(check_out_date__isnull=True)
        elif status_param == "completed":
            queryset = queryset.filter(check_out_date__isnull=False)

        return queryset

    @extend_schema(
        parameters=[
            OpenApiParameter(name="q", description="Search by student ID/name, room, or hostel", required=False, type=str),
            OpenApiParameter(name="status", description="Filter by status: 'active', 'completed', 'all'", required=False, type=str),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        summary="Create room allocation",
        description="Creates an active allocation for a student. Transaction-safe with room row locking.",
        request=AllocationCreateSerializer,
        responses={201: AllocationSerializer},
    )
    def create(self, request, *args, **kwargs):
        serializer = AllocationCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student = serializer.validated_data["student"]
        room = serializer.validated_data["room"]
        allocation_date = serializer.validated_data["allocation_date"]
        check_in_date = serializer.validated_data.get("check_in_date")

        with transaction.atomic():
            # Concurrency protection: lock room row and verify capacity
            locked_room = Room.objects.select_for_update().get(pk=room.pk)
            active_occupancy = Allocation.objects.filter(
                room=locked_room,
                check_out_date__isnull=True,
            ).count()

            if active_occupancy >= locked_room.capacity:
                raise ValidationError({"room": "Room capacity has been reached."})

            # Verify no concurrent active allocation was created for student
            if Allocation.objects.filter(student=student, check_out_date__isnull=True).exists():
                raise ValidationError({"student": "Student already has an active room allocation."})

            allocation = Allocation.objects.create(
                student=student,
                room=locked_room,
                allocation_date=allocation_date,
                check_in_date=check_in_date,
            )

            create_audit_log(
                request.user,
                "CREATE",
                "Allocation",
                allocation.pk,
            )

        return Response(
            AllocationSerializer(allocation).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        summary="Transfer an active allocation",
        description="Closes the current room allocation and atomically creates a new active allocation.",
        request=AllocationTransferSerializer,
        responses={200: AllocationSerializer},
    )
    @action(detail=True, methods=["post"], url_path="transfer")
    def transfer(self, request, pk=None):
        allocation = self.get_object()

        serializer = AllocationTransferSerializer(
            data=request.data,
            allocation=allocation,
        )
        serializer.is_valid(raise_exception=True)

        new_room = serializer.validated_data["new_room"]
        transfer_date = serializer.validated_data["transfer_date"]

        with transaction.atomic():
            current_allocation = (
                Allocation.objects
                .select_for_update()
                .get(pk=allocation.pk, check_out_date__isnull=True)
            )

            # Lock target room and revalidate capacity
            locked_new_room = Room.objects.select_for_update().get(pk=new_room.pk)
            target_occupancy = Allocation.objects.filter(
                room=locked_new_room,
                check_out_date__isnull=True,
            ).count()

            if target_occupancy >= locked_new_room.capacity:
                raise ValidationError({"new_room": "Destination room has reached capacity."})

            # Close existing allocation
            current_allocation.check_out_date = transfer_date
            current_allocation.save(update_fields=["check_out_date"])

            # Create replacement active allocation
            new_allocation = Allocation.objects.create(
                student=current_allocation.student,
                room=locked_new_room,
                allocation_date=transfer_date,
                check_in_date=transfer_date,
            )

            create_audit_log(
                request.user,
                "UPDATE",
                "Allocation",
                current_allocation.pk,
            )
            create_audit_log(
                request.user,
                "CREATE",
                "Allocation",
                new_allocation.pk,
            )

        return Response(
            AllocationSerializer(new_allocation).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Vacate an active allocation",
        description="Records student check-out and completes the room allocation.",
        request=AllocationVacateSerializer,
        responses={200: AllocationSerializer},
    )
    @action(detail=True, methods=["post"], url_path="vacate")
    def vacate(self, request, pk=None):
        allocation = self.get_object()

        serializer = AllocationVacateSerializer(
            data=request.data,
            allocation=allocation,
        )
        serializer.is_valid(raise_exception=True)

        checkout_date = serializer.validated_data["checkout_date"]

        with transaction.atomic():
            current_allocation = (
                Allocation.objects
                .select_for_update()
                .get(pk=allocation.pk, check_out_date__isnull=True)
            )
            current_allocation.check_out_date = checkout_date
            current_allocation.save(update_fields=["check_out_date"])

            create_audit_log(
                request.user,
                "UPDATE",
                "Allocation",
                current_allocation.pk,
            )

        return Response(
            AllocationSerializer(current_allocation).data,
            status=status.HTTP_200_OK,
        )
