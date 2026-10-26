from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from .models import Hostel, Room
from auditlog.services import create_audit_log
from accounts.decorators import role_required
from allocations.models import Allocation

@role_required("WARDEN", "ADMINISTRATOR")
def hostel_list(request):
    hostels = Hostel.objects.all().order_by("hostel_id")
    return render(
        request,
        "hostels/hostel_list.html",
        {"hostels": hostels},
    )

@role_required("WARDEN", "ADMINISTRATOR")
def hostel_create(request):
    if request.method == "POST":
        hostel_id = request.POST.get("hostel_id", "").strip()
        name = request.POST.get("name", "").strip()
        block_location = request.POST.get("block_location", "").strip()
        status = request.POST.get("status", "Active").strip()

        if not hostel_id or not name or not block_location:
            messages.error(request, "All required hostel fields must be provided.")
            return render(request, "hostels/hostel_form.html")

        if Hostel.objects.filter(hostel_id=hostel_id).exists():
            messages.error(request, "Hostel ID already exists.")
            return render(request, "hostels/hostel_form.html")

        hostel = Hostel.objects.create(
            hostel_id=hostel_id,
            name=name,
            block_location=block_location,
            status=status,
        )

        messages.success(request, "Hostel created successfully.")
        return redirect("hostel_detail", hostel_id=hostel.id)

    return render(request, "hostels/hostel_form.html")

@role_required("WARDEN", "ADMINISTRATOR")
def hostel_detail(request, hostel_id):
    hostel = get_object_or_404(
        Hostel.objects.prefetch_related("rooms"),
        id=hostel_id,
    )

    return render(
        request,
        "hostels/hostel_detail.html",
        {"hostel": hostel},
    )

@role_required("WARDEN", "ADMINISTRATOR")
def hostel_update(request, hostel_id):
    hostel = get_object_or_404(Hostel, id=hostel_id)

    if request.method == "POST":
        hostel.name = request.POST.get("name", "").strip()
        hostel.block_location = request.POST.get("block_location", "").strip()
        hostel.status = request.POST.get("status", "Active").strip()

        if not hostel.name or not hostel.block_location:
            messages.error(
                request,
                "Hostel name and block/location are required.",
            )
        else:
            hostel.save()
            messages.success(request, "Hostel updated successfully.")
            return redirect("hostel_detail", hostel_id=hostel.id)

    return render(
        request,
        "hostels/hostel_form.html",
        {"hostel": hostel},
    )

@role_required("WARDEN", "ADMINISTRATOR")
def room_list(request):
    rooms = Room.objects.select_related("hostel").all().order_by(
        "hostel__hostel_id",
        "room_no",
    )

    return render(
        request,
        "hostels/room_list.html",
        {"rooms": rooms},
    )

@role_required("WARDEN", "ADMINISTRATOR")
def room_create(request):
    hostels = Hostel.objects.filter(status="Active").order_by("hostel_id")

    if request.method == "POST":
        room_id = request.POST.get("room_id", "").strip()
        room_no = request.POST.get("room_no", "").strip()
        room_type = request.POST.get("room_type", "").strip()
        status = request.POST.get("status", "Available").strip()
        hostel_id = request.POST.get("hostel_id", "").strip()

        try:
            capacity = int(request.POST.get("capacity", "0"))
        except ValueError:
            capacity = 0

        if not room_id or not room_no or not room_type or not hostel_id:
            messages.error(request, "All required room fields must be provided.")
            return render(
                request,
                "hostels/room_form.html",
                {"hostels": hostels},
            )

        if capacity <= 0:
            messages.error(request, "Room capacity must be greater than zero.")
            return render(
                request,
                "hostels/room_form.html",
                {"hostels": hostels},
            )

        if Room.objects.filter(room_id=room_id).exists():
            messages.error(request, "Room ID already exists.")
            return render(
                request,
                "hostels/room_form.html",
                {"hostels": hostels},
            )

        hostel = get_object_or_404(
            Hostel,
            id=hostel_id,
            status="Active",
        )

        room = Room.objects.create(
    room_id=room_id,
    hostel=hostel,
    room_no=room_no,
    room_type=room_type,
    capacity=capacity,
    status=status,
)

        create_audit_log(
    request.user,
    "CREATE",
    "Room",
    room.room_id,
)

        messages.success(request, "Room created successfully.")
        return redirect("room_list")

    return render(
        request,
        "hostels/room_form.html",
        {"hostels": hostels},
    )

@role_required("WARDEN", "ADMINISTRATOR")
def room_update(request, room_id):
    room = get_object_or_404(
        Room.objects.select_related("hostel"),
        id=room_id,
    )
    hostels = Hostel.objects.filter(status="Active").order_by("hostel_id")

    if request.method == "POST":
        room_id_value = request.POST.get("room_id", "").strip()
        room_no = request.POST.get("room_no", "").strip()
        room_type = request.POST.get("room_type", "").strip()
        status = request.POST.get("status", "").strip()
        hostel_id = request.POST.get("hostel_id", "").strip()

        try:
            capacity = int(request.POST.get("capacity", "0"))
        except (TypeError, ValueError):
            capacity = 0

        if not all([room_id_value, room_no, room_type, status, hostel_id]):
            messages.error(request, "All room fields must be provided.")
        elif capacity <= 0:
            messages.error(request, "Room capacity must be greater than zero.")
        elif Room.objects.filter(room_id=room_id_value).exclude(pk=room.pk).exists():
            messages.error(request, "Room ID already exists.")
        elif Room.objects.filter(
            hostel_id=hostel_id,
            room_no=room_no,
        ).exclude(pk=room.pk).exists():
            messages.error(
                request,
                "This room number already exists in the selected hostel.",
            )
        else:
            hostel = get_object_or_404(
                Hostel,
                id=hostel_id,
                status="Active",
            )

            active_occupancy = Allocation.objects.filter(
                room=room,
                check_out_date__isnull=True,
            ).count()

            if capacity < active_occupancy:
                messages.error(
                    request,
                    f"Capacity cannot be less than current occupancy ({active_occupancy}).",
                )
            else:
                room.room_id = room_id_value
                room.hostel = hostel
                room.room_no = room_no
                room.room_type = room_type
                room.capacity = capacity
                room.status = status
                room.save()

                create_audit_log(
                    request.user,
                    "UPDATE",
                    "Room",
                    room.room_id,
                )

                messages.success(request, "Room updated successfully.")
                return redirect("room_list")

    return render(
        request,
        "hostels/room_form.html",
        {
            "room": room,
            "hostels": hostels,
        },
    )
