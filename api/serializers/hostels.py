from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from allocations.models import Allocation
from hostels.models import Hostel, Room


class HostelSerializer(serializers.ModelSerializer):
    rooms_count = serializers.IntegerField(source="rooms.count", read_only=True)

    class Meta:
        model = Hostel
        fields = [
            "id",
            "hostel_id",
            "name",
            "block_location",
            "status",
            "rooms_count",
        ]

    def validate_status(self, value):
        if value not in ["Active", "Inactive"]:
            raise serializers.ValidationError("Status must be either 'Active' or 'Inactive'.")
        return value


class RoomSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source="hostel.name", read_only=True)
    active_occupancy = serializers.SerializerMethodField()
    available_beds = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id",
            "room_id",
            "hostel",
            "hostel_name",
            "room_no",
            "room_type",
            "capacity",
            "status",
            "active_occupancy",
            "available_beds",
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_active_occupancy(self, obj):
        return getattr(
            obj,
            "active_occupancy",
            obj.allocations.filter(check_out_date__isnull=True).count(),
        )

    @extend_schema_field(serializers.IntegerField())
    def get_available_beds(self, obj):
        occupancy = self.get_active_occupancy(obj)
        return max(0, obj.capacity - occupancy)

    def validate_capacity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Room capacity must be greater than zero.")
        return value

    def validate(self, attrs):
        hostel = attrs.get("hostel", getattr(self.instance, "hostel", None))
        room_no = attrs.get("room_no", getattr(self.instance, "room_no", None))
        capacity = attrs.get("capacity", getattr(self.instance, "capacity", None))

        query = Room.objects.filter(hostel=hostel, room_no=room_no)
        if self.instance:
            query = query.exclude(pk=self.instance.pk)
        if query.exists():
            raise serializers.ValidationError(
                {"room_no": "This room number already exists in the selected hostel."}
            )

        if self.instance and capacity is not None:
            active_occupancy = self.instance.allocations.filter(check_out_date__isnull=True).count()
            if capacity < active_occupancy:
                raise serializers.ValidationError(
                    {"capacity": f"Capacity cannot be less than current occupancy ({active_occupancy})."}
                )

        return attrs


class RoomAvailabilitySerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source="hostel.name", read_only=True)
    hostel_id = serializers.CharField(source="hostel.hostel_id", read_only=True)
    active_occupancy = serializers.SerializerMethodField()
    available_beds = serializers.SerializerMethodField()
    availability_label = serializers.SerializerMethodField()

    class Meta:
        model = Room
        fields = [
            "id",
            "room_id",
            "hostel_id",
            "hostel_name",
            "room_no",
            "room_type",
            "capacity",
            "status",
            "active_occupancy",
            "available_beds",
            "availability_label",
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_active_occupancy(self, obj):
        return getattr(
            obj,
            "active_occupancy",
            obj.allocations.filter(check_out_date__isnull=True).count(),
        )

    @extend_schema_field(serializers.IntegerField())
    def get_available_beds(self, obj):
        occupancy = self.get_active_occupancy(obj)
        return max(0, obj.capacity - occupancy)

    @extend_schema_field(serializers.CharField())
    def get_availability_label(self, obj):
        if obj.status != "Available":
            return "Unavailable"
        occupancy = self.get_active_occupancy(obj)
        if occupancy >= obj.capacity:
            return "Full"
        if occupancy == 0:
            return "Vacant"
        return "Partially occupied"
