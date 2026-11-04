from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from accounts.decorators import get_user_role
from accounts.models import RoleProfile
from students.models import Student

User = get_user_model()


class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_label = serializers.SerializerMethodField()
    student_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "role",
            "role_label",
            "student_id",
        ]
        read_only_fields = ["id", "username", "role", "role_label", "student_id"]

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_role(self, obj):
        return get_user_role(obj)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_role_label(self, obj):
        role = get_user_role(obj)
        if not role:
            return None
        return dict(RoleProfile.Role.choices).get(role, role)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_student_id(self, obj):
        profile = getattr(obj, "role_profile", None)
        if profile and profile.student:
            return profile.student.student_id
        return None


class RoleAssignmentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(required=True)
    role = serializers.ChoiceField(choices=RoleProfile.Role.choices, required=True)
    student_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        user_id = attrs["user_id"]
        role = attrs["role"]
        student_id = attrs.get("student_id")

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise serializers.ValidationError({"user_id": "User not found."})

        attrs["user"] = user

        student = None
        if role == RoleProfile.Role.STUDENT:
            if not student_id:
                raise serializers.ValidationError(
                    {"student_id": "A student account must be linked to a valid student record."}
                )
            try:
                student = Student.objects.get(student_id=student_id)
            except Student.DoesNotExist:
                raise serializers.ValidationError(
                    {"student_id": f"Student record '{student_id}' does not exist."}
                )

            existing = RoleProfile.objects.filter(student=student).exclude(user=user)
            if existing.exists():
                raise serializers.ValidationError(
                    {"student_id": "This student record is already linked to another user account."}
                )
        else:
            if student_id:
                raise serializers.ValidationError(
                    {"student_id": "Only Student role profiles can be linked to a student record."}
                )

        attrs["student"] = student
        return attrs
