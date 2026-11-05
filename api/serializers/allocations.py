from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from allocations.models import Allocation
from hostels.models import Room
from students.models import Student


class AllocationSerializer(serializers.ModelSerializer):
    student_id = serializers.CharField(source="student.student_id", read_only=True)
    student_name = serializers.CharField(source="student.name", read_only=True)
    room_no = serializers.CharField(source="room.room_no", read_only=True)
    room_type = serializers.CharField(source="room.room_type", read_only=True)
    hostel_id = serializers.CharField(source="room.hostel.hostel_id", read_only=True)
    hostel_name = serializers.CharField(source="room.hostel.name", read_only=True)
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = Allocation
        fields = [
            "id",
            "student",
            "student_id",
            "student_name",
            "room",
            "room_no",
            "room_type",
            "hostel_id",
            "hostel_name",
            "allocation_date",
            "check_in_date",
            "check_out_date",
            "is_active",
        ]

    @extend_schema_field(serializers.BooleanField())
    def get_is_active(self, obj):
        return obj.check_out_date is None


class AllocationCreateSerializer(serializers.Serializer):
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.filter(status="Active")
    )
    room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(status="Available", hostel__status="Active")
    )
    allocation_date = serializers.DateField(required=False)
    check_in_date = serializers.DateField(required=False, allow_null=True)

    def validate(self, attrs):
        today = timezone.localdate()
        allocation_date = attrs.get("allocation_date") or today
        check_in_date = attrs.get("check_in_date")
        student = attrs["student"]
        room = attrs["room"]

        attrs["allocation_date"] = allocation_date

        if allocation_date > today:
            raise serializers.ValidationError(
                {"allocation_date": "Allocation date cannot be in the future."}
            )

        if check_in_date:
            if check_in_date > today:
                raise serializers.ValidationError(
                    {"check_in_date": "Check-in date cannot be in the future."}
                )
            if check_in_date < allocation_date:
                raise serializers.ValidationError(
                    {"check_in_date": "Check-in date cannot be before the allocation date."}
                )

        if student.status != "Active":
            raise serializers.ValidationError(
                {"student": "Only active students can receive an allocation."}
            )

        # Check existing active allocation
        if Allocation.objects.filter(student=student, check_out_date__isnull=True).exists():
            raise serializers.ValidationError(
                {"student": "This student already has an active room allocation."}
            )

        # Check room capacity
        active_occupancy = Allocation.objects.filter(room=room, check_out_date__isnull=True).count()
        if active_occupancy >= room.capacity:
            raise serializers.ValidationError(
                {"room": "The selected room has reached its capacity."}
            )

        return attrs


class AllocationTransferSerializer(serializers.Serializer):
    new_room = serializers.PrimaryKeyRelatedField(
        queryset=Room.objects.filter(status="Available", hostel__status="Active")
    )
    transfer_date = serializers.DateField(required=False)

    def __init__(self, *args, allocation=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.allocation = allocation

    def validate(self, attrs):
        today = timezone.localdate()
        transfer_date = attrs.get("transfer_date") or today
        new_room = attrs["new_room"]
        attrs["transfer_date"] = transfer_date

        if not self.allocation or self.allocation.check_out_date is not None:
            raise serializers.ValidationError("This allocation is no longer active.")

        if new_room.pk == self.allocation.room_id:
            raise serializers.ValidationError(
                {"new_room": "Destination room must be different from the current room."}
            )

        if transfer_date > today:
            raise serializers.ValidationError(
                {"transfer_date": "Transfer date cannot be in the future."}
            )

        start_date = self.allocation.check_in_date or self.allocation.allocation_date
        if transfer_date < start_date:
            raise serializers.ValidationError(
                {"transfer_date": "Transfer date cannot be before current allocation start date."}
            )

        # Check capacity
        active_occupancy = Allocation.objects.filter(room=new_room, check_out_date__isnull=True).count()
        if active_occupancy >= new_room.capacity:
            raise serializers.ValidationError(
                {"new_room": "The destination room has reached its capacity."}
            )

        return attrs


class AllocationVacateSerializer(serializers.Serializer):
    checkout_date = serializers.DateField(required=False)

    def __init__(self, *args, allocation=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.allocation = allocation

    def validate(self, attrs):
        today = timezone.localdate()
        checkout_date = attrs.get("checkout_date") or today
        attrs["checkout_date"] = checkout_date

        if not self.allocation or self.allocation.check_out_date is not None:
            raise serializers.ValidationError("This allocation has already been checked out.")

        if checkout_date > today:
            raise serializers.ValidationError(
                {"checkout_date": "Check-out date cannot be in the future."}
            )

        start_date = self.allocation.check_in_date or self.allocation.allocation_date
        if checkout_date < start_date:
            raise serializers.ValidationError(
                {"checkout_date": "Check-out date cannot be before check-in or allocation date."}
            )

        return attrs
