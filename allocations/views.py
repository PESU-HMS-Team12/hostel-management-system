from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import redirect, render

from accounts.decorators import role_required
from auditlog.services import create_audit_log
from hostels.models import Room

from .forms import AllocationForm
from .models import Allocation


@role_required("WARDEN", "ADMINISTRATOR")
def allocation_list(request):
    allocations = (
        Allocation.objects
        .select_related("student", "room", "room__hostel")
        .order_by("-allocation_date", "-pk")
    )

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "active").strip()

    if query:
        allocations = allocations.filter(
            Q(student__student_id__icontains=query)
            | Q(student__name__icontains=query)
            | Q(room__room_no__icontains=query)
            | Q(room__hostel__name__icontains=query)
        )

    if status == "active":
        allocations = allocations.filter(
            check_out_date__isnull=True
        )
    elif status == "completed":
        allocations = allocations.filter(
            check_out_date__isnull=False
        )
    else:
        status = "all"

    return render(
        request,
        "allocations/allocation_list.html",
        {
            "allocations": allocations,
            "query": query,
            "selected_status": status,
        },
    )


@role_required("WARDEN", "ADMINISTRATOR")
def allocation_create(request):
    if request.method == "POST":
        form = AllocationForm(request.POST)

        if form.is_valid():
            try:
                with transaction.atomic():
                    allocation = form.save()

                    create_audit_log(
                        request.user,
                        "CREATE",
                        "Allocation",
                        allocation.pk,
                    )

            except ValidationError as exc:
                for error in exc.messages:
                    form.add_error(None, error)
            else:
                messages.success(
                    request,
                    "Room allocation created successfully.",
                )
                return redirect("allocation_list")

    else:
        form = AllocationForm()

    return render(
        request,
        "allocations/allocation_form.html",
        {"form": form},
    )


@role_required("WARDEN", "ADMINISTRATOR")
def room_availability(request):
    rooms = (
        Room.objects
        .filter(hostel__status="Active")
        .select_related("hostel")
        .annotate(
            active_occupancy=Count(
                "allocations",
                filter=Q(
                    allocations__check_out_date__isnull=True
                ),
            )
        )
        .order_by("hostel__name", "room_no")
    )

    for room in rooms:
        if room.status != "Available":
            room.availability_label = "Unavailable"
        elif room.active_occupancy >= room.capacity:
            room.availability_label = "Full"
        elif room.active_occupancy == 0:
            room.availability_label = "Vacant"
        else:
            room.availability_label = "Partially occupied"

    return render(
        request,
        "allocations/availability.html",
        {"rooms": rooms},
    )