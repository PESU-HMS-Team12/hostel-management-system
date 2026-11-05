from django.db.models import Count, Q
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.permissions import IsWardenOrAdministrator
from api.serializers.allocations import AllocationSerializer
from api.serializers.hostels import (
    HostelSerializer,
    RoomAvailabilitySerializer,
    RoomSerializer,
)
from auditlog.services import create_audit_log
from hostels.models import Hostel, Room


@extend_schema(tags=["Hostels"])
class HostelViewSet(viewsets.ModelViewSet):
    """
    CRUD endpoints for hostel properties and blocks.
    """
    queryset = Hostel.objects.all().order_by("hostel_id")
    serializer_class = HostelSerializer
    permission_classes = [IsWardenOrAdministrator]

    def perform_create(self, serializer):
        hostel = serializer.save()
        create_audit_log(
            self.request.user,
            "CREATE",
            "Hostel",
            hostel.hostel_id,
        )

    def perform_update(self, serializer):
        hostel = serializer.save()
        create_audit_log(
            self.request.user,
            "UPDATE",
            "Hostel",
            hostel.hostel_id,
        )


@extend_schema(tags=["Rooms"])
class RoomViewSet(viewsets.ModelViewSet):
    """
    CRUD and availability endpoints for rooms across hostels.
    """
    permission_classes = [IsWardenOrAdministrator]
    serializer_class = RoomSerializer

    def get_queryset(self):
        return (
            Room.objects
            .select_related("hostel")
            .annotate(
                active_occupancy=Count(
                    "allocations",
                    filter=Q(allocations__check_out_date__isnull=True),
                )
            )
            .order_by("hostel__hostel_id", "room_no")
        )

    def perform_create(self, serializer):
        room = serializer.save()
        create_audit_log(
            self.request.user,
            "CREATE",
            "Room",
            room.room_id,
        )

    def perform_update(self, serializer):
        room = serializer.save()
        create_audit_log(
            self.request.user,
            "UPDATE",
            "Room",
            room.room_id,
        )

    @extend_schema(
        summary="List room availability and occupancy",
        description="Returns list of rooms with their real-time occupancy, available beds, and status.",
        responses={200: RoomAvailabilitySerializer(many=True)},
    )
    @action(detail=False, methods=["get"], url_path="availability")
    def availability(self, request):
        rooms = (
            Room.objects
            .filter(hostel__status="Active")
            .select_related("hostel")
            .annotate(
                active_occupancy=Count(
                    "allocations",
                    filter=Q(allocations__check_out_date__isnull=True),
                )
            )
            .order_by("hostel__name", "room_no")
        )
        serializer = RoomAvailabilitySerializer(rooms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        summary="Retrieve detailed occupancy for a specific room",
        description="Returns room metadata alongside active resident allocations.",
    )
    @action(detail=True, methods=["get"], url_path="occupancy")
    def occupancy(self, request, pk=None):
        room = self.get_object()
        allocations = (
            room.allocations
            .select_related("student")
            .filter(check_out_date__isnull=True)
            .order_by("allocation_date")
        )

        return Response(
            {
                "room": RoomSerializer(room).data,
                "active_residents": AllocationSerializer(allocations, many=True).data,
            },
            status=status.HTTP_200_OK,
        )
