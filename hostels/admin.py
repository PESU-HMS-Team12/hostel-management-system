from django.contrib import admin
from .models import Hostel, Room


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = (
        "hostel_id",
        "name",
        "block_location",
        "status",
    )
    search_fields = (
        "hostel_id",
        "name",
        "block_location",
    )
    list_filter = ("status",)


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = (
        "room_id",
        "hostel",
        "room_no",
        "room_type",
        "capacity",
        "status",
    )
    search_fields = (
        "room_id",
        "room_no",
        "room_type",
    )
    list_filter = (
        "status",
        "room_type",
        "hostel",
    )