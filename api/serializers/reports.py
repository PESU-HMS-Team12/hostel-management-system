from rest_framework import serializers


class HostelOccupancySummarySerializer(serializers.Serializer):
    hostel_id = serializers.CharField()
    hostel_name = serializers.CharField()
    status = serializers.CharField()
    total_rooms = serializers.IntegerField()
    total_capacity = serializers.IntegerField()
    occupied_beds = serializers.IntegerField()
    available_beds = serializers.IntegerField()
    occupancy_rate = serializers.FloatField()


class OccupancyReportSerializer(serializers.Serializer):
    generated_at = serializers.DateTimeField()
    total_hostels = serializers.IntegerField()
    total_rooms = serializers.IntegerField()
    total_capacity = serializers.IntegerField()
    total_occupied_beds = serializers.IntegerField()
    total_available_beds = serializers.IntegerField()
    overall_occupancy_rate = serializers.FloatField()
    hostels = HostelOccupancySummarySerializer(many=True)


class AllocationReportSerializer(serializers.Serializer):
    generated_at = serializers.DateTimeField()
    total_allocations = serializers.IntegerField()
    active_allocations = serializers.IntegerField()
    completed_allocations = serializers.IntegerField()
    allocations_by_program = serializers.DictField(child=serializers.IntegerField())
