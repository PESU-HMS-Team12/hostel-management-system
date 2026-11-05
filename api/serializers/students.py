from rest_framework import serializers
from students.models import Student


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            "id",
            "student_id",
            "name",
            "contact",
            "course_program",
            "year",
            "status",
        ]

    def validate_year(self, value):
        if value <= 0:
            raise serializers.ValidationError("Year of study must be a positive integer.")
        return value

    def validate_status(self, value):
        if value not in ["Active", "Inactive"]:
            raise serializers.ValidationError("Status must be either 'Active' or 'Inactive'.")
        return value
