from django.contrib.auth import authenticate, get_user_model
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from accounts.decorators import get_user_role
from accounts.models import RoleProfile
from allocations.models import Allocation
from students.models import Student

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        identifier = attrs.get("username", "").strip()
        password = attrs.get("password", "")

        auth_username = identifier

        if "@" in identifier:
            matching_users = User.objects.filter(email__iexact=identifier)
            if matching_users.count() == 1:
                auth_username = matching_users.first().get_username()
            else:
                auth_username = None

        user = None
        if auth_username:
            user = authenticate(
                self.context.get("request"),
                username=auth_username,
                password=password,
            )

        if not user:
            raise serializers.ValidationError(
                "Invalid username/email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "This user account is disabled."
            )

        role = get_user_role(user)
        if role is None:
            raise serializers.ValidationError(
                "Your account has no assigned HMS role. Contact an administrator."
            )

        attrs["user"] = user
        return attrs


class NestedStudentSerializer(serializers.ModelSerializer):
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


class NestedCurrentAllocationSerializer(serializers.ModelSerializer):
    hostel_name = serializers.CharField(source="room.hostel.name", read_only=True)
    room_no = serializers.CharField(source="room.room_no", read_only=True)
    room_type = serializers.CharField(source="room.room_type", read_only=True)

    class Meta:
        model = Allocation
        fields = [
            "id",
            "allocation_date",
            "check_in_date",
            "check_out_date",
            "hostel_name",
            "room_no",
            "room_type",
        ]


class CurrentUserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_label = serializers.SerializerMethodField()
    student = serializers.SerializerMethodField()
    current_allocation = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_label",
            "student",
            "current_allocation",
        ]
        read_only_fields = fields

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_role(self, obj):
        return get_user_role(obj)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_role_label(self, obj):
        role = get_user_role(obj)
        if not role:
            return None
        return dict(RoleProfile.Role.choices).get(role, role)

    @extend_schema_field(NestedStudentSerializer(allow_null=True))
    def get_student(self, obj):
        profile = getattr(obj, "role_profile", None)
        if profile and profile.student:
            return NestedStudentSerializer(profile.student).data
        return None

    @extend_schema_field(NestedCurrentAllocationSerializer(allow_null=True))
    def get_current_allocation(self, obj):
        profile = getattr(obj, "role_profile", None)
        if profile and profile.student:
            active_alloc = (
                Allocation.objects
                .select_related("room", "room__hostel")
                .filter(student=profile.student, check_out_date__isnull=True)
                .order_by("-allocation_date")
                .first()
            )
            if active_alloc:
                return NestedCurrentAllocationSerializer(active_alloc).data
        return None
