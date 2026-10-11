from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import role_required
from auditlog.services import create_audit_log
from hostels.models import Room

from .forms import (
    AllocationForm,
    TransferAllocationForm,
    VacationAllocationForm,
)
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

@role_required("WARDEN", "ADMINISTRATOR")
def allocation_transfer(request, allocation_id):
    allocation = get_object_or_404(
        Allocation.objects.select_related(
            "student",
            "room",
            "room__hostel",
        ),
        pk=allocation_id,
        check_out_date__isnull=True,
    )

    if request.method == "POST":
        form = TransferAllocationForm(
            request.POST,
            allocation=allocation,
        )

        if form.is_valid():
            transfer_date = form.cleaned_data["transfer_date"]
            new_room = form.cleaned_data["new_room"]

            try:
                with transaction.atomic():
                    # Recheck that the allocation is still active.
                    current_allocation = (
                        Allocation.objects
                        .select_for_update()
                        .get(
                            pk=allocation.pk,
                            check_out_date__isnull=True,
                        )
                    )

                    # Close the old allocation first.
                    current_allocation.check_out_date = transfer_date
                    current_allocation.save(
                        update_fields=["check_out_date"]
                    )

                    # Create the replacement active allocation.
                    new_allocation = Allocation.objects.create(
                        student=current_allocation.student,
                        room=new_room,
                        allocation_date=transfer_date,
                        check_in_date=transfer_date,
                    )

                    # Record both sides of the transfer.
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

            except Allocation.DoesNotExist:
                messages.error(
                    request,
                    "This allocation is no longer active. "
                    "Refresh the allocation list and try again.",
                )
                return redirect("allocation_list")

            except ValidationError as exc:
                for error in exc.messages:
                    form.add_error(None, error)

            else:
                messages.success(
                    request,
                    "Room transfer completed successfully.",
                )
                return redirect("allocation_list")

    else:
        form = TransferAllocationForm(allocation=allocation)

    return render(
        request,
        "allocations/transfer_form.html",
        {
            "form": form,
            "allocation": allocation,
        },
    )

@role_required("WARDEN", "ADMINISTRATOR")
def allocation_vacate(request, allocation_id):
    allocation = get_object_or_404(
        Allocation.objects.select_related(
            "student",
            "room",
            "room__hostel",
        ),
        pk=allocation_id,
        check_out_date__isnull=True,
    )

    if request.method == "POST":
        form = VacationAllocationForm(
            request.POST,
            allocation=allocation,
        )

        if form.is_valid():
            checkout_date = form.cleaned_data["checkout_date"]

            try:
                with transaction.atomic():
                    # Recheck that the allocation is still active.
                    current_allocation = (
                        Allocation.objects
                        .select_for_update()
                        .get(
                            pk=allocation.pk,
                            check_out_date__isnull=True,
                        )
                    )

                    # A non-null checkout date makes it inactive.
                    current_allocation.check_out_date = checkout_date
                    current_allocation.save(
                        update_fields=["check_out_date"]
                    )

                    create_audit_log(
                        request.user,
                        "UPDATE",
                        "Allocation",
                        current_allocation.pk,
                    )

            except Allocation.DoesNotExist:
                messages.error(
                    request,
                    "This allocation is no longer active. "
                    "Refresh the allocation list and try again.",
                )
                return redirect("allocation_list")

            except ValidationError as exc:
                for error in exc.messages:
                    form.add_error(None, error)

            else:
                messages.success(
                    request,
                    "Student vacation recorded successfully.",
                )
                return redirect("allocation_list")

    else:
        form = VacationAllocationForm(allocation=allocation)

    return render(
        request,
        "allocations/vacation_form.html",
        {
            "form": form,
            "allocation": allocation,
        },
    )