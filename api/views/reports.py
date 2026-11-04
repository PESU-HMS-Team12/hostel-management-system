from django.db.models import Count, Q, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from allocations.models import Allocation
from api.permissions import IsWardenOrAdministrator
from api.serializers.reports import AllocationReportSerializer, OccupancyReportSerializer
from hostels.models import Hostel, Room
from students.models import Student


@extend_schema(tags=["Reports"])
class OccupancyReportView(APIView):
    """
    Real-time occupancy report aggregating beds, capacity, and utilization rates across all hostels.
    """
    permission_classes = [IsWardenOrAdministrator]

    @extend_schema(
        summary="Hostel occupancy report",
        responses={200: OccupancyReportSerializer},
    )
    def get(self, request):
        hostels = Hostel.objects.all().order_by("hostel_id")

        total_rooms = 0
        total_capacity = 0
        total_occupied_beds = 0
        hostel_summaries = []

        for hostel in hostels:
            rooms = (
                Room.objects
                .filter(hostel=hostel)
                .annotate(
                    occupied=Count(
                        "allocations",
                        filter=Q(allocations__check_out_date__isnull=True),
                    )
                )
            )

            h_rooms = rooms.count()
            h_capacity = sum(r.capacity for r in rooms)
            h_occupied = sum(r.occupied for r in rooms)
            h_available = max(0, h_capacity - h_occupied)
            h_rate = round((h_occupied / h_capacity * 100), 2) if h_capacity > 0 else 0.0

            total_rooms += h_rooms
            total_capacity += h_capacity
            total_occupied_beds += h_occupied

            hostel_summaries.append(
                {
                    "hostel_id": hostel.hostel_id,
                    "hostel_name": hostel.name,
                    "status": hostel.status,
                    "total_rooms": h_rooms,
                    "total_capacity": h_capacity,
                    "occupied_beds": h_occupied,
                    "available_beds": h_available,
                    "occupancy_rate": h_rate,
                }
            )

        total_available = max(0, total_capacity - total_occupied_beds)
        overall_rate = (
            round((total_occupied_beds / total_capacity * 100), 2)
            if total_capacity > 0
            else 0.0
        )

        data = {
            "generated_at": timezone.now(),
            "total_hostels": hostels.count(),
            "total_rooms": total_rooms,
            "total_capacity": total_capacity,
            "total_occupied_beds": total_occupied_beds,
            "total_available_beds": total_available,
            "overall_occupancy_rate": overall_rate,
            "hostels": hostel_summaries,
        }

        return Response(data, status=status.HTTP_200_OK)


@extend_schema(tags=["Reports"])
class AllocationReportView(APIView):
    """
    Allocation statistics and summary report.
    """
    permission_classes = [IsWardenOrAdministrator]

    @extend_schema(
        summary="Allocation summary report",
        responses={200: AllocationReportSerializer},
    )
    def get(self, request):
        total_allocations = Allocation.objects.count()
        active_allocations = Allocation.objects.filter(check_out_date__isnull=True).count()
        completed_allocations = Allocation.objects.filter(check_out_date__isnull=False).count()

        # Distribution of active allocations by course program
        programs = (
            Allocation.objects
            .filter(check_out_date__isnull=True)
            .values("student__course_program")
            .annotate(count=Count("id"))
        )

        program_breakdown = {
            p["student__course_program"] or "Unknown": p["count"]
            for p in programs
        }

        data = {
            "generated_at": timezone.now(),
            "total_allocations": total_allocations,
            "active_allocations": active_allocations,
            "completed_allocations": completed_allocations,
            "allocations_by_program": program_breakdown,
        }

        return Response(data, status=status.HTTP_200_OK)
