from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from accounts.decorators import get_user_role
from accounts.models import RoleProfile
from allocations.models import Allocation
from auditlog.services import create_audit_log
from students.models import Student

User = get_user_model()


def _normalize_contact(value: str) -> str:
    return "".join(ch for ch in str(value or "").strip() if ch.isdigit() or ch == "+")


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
            if auth_username:
                candidate = User.objects.filter(username__iexact=auth_username).first()
                if candidate and not candidate.is_active and candidate.check_password(password):
                    raise serializers.ValidationError(
                        "Your account is awaiting administrator approval or has been deactivated."
                    )
            raise serializers.ValidationError(
                "Invalid username/email or password."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "Your account is awaiting administrator approval or has been deactivated."
            )

        role = get_user_role(user)
        if role is None:
            raise serializers.ValidationError(
                "Your account has no assigned HMS role. Contact an administrator."
            )

        attrs["user"] = user
        return attrs


class StudentSignupSerializer(serializers.Serializer):
    student_id = serializers.CharField(required=True, max_length=20)
    contact = serializers.CharField(required=True, max_length=20)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True, max_length=150)
    password = serializers.CharField(required=True, write_only=True, min_length=8)
    confirm_password = serializers.CharField(required=True, write_only=True, min_length=8)

    def validate(self, attrs):
        raw_data = getattr(self, "initial_data", {}) or {}
        if "role" in raw_data and str(raw_data.get("role")).strip().upper() not in ("", "STUDENT"):
            raise serializers.ValidationError(
                {"non_field_errors": ["Public self-registration is restricted to student accounts only."]}
            )

        student_id = attrs.get("student_id", "").strip()
        contact = attrs.get("contact", "").strip()
        email = attrs.get("email", "").strip().lower()
        username = attrs.get("username", "").strip()
        password = attrs.get("password", "")
        confirm_password = attrs.get("confirm_password", "")

        if password != confirm_password:
            raise serializers.ValidationError(
                {"confirm_password": ["Password and confirmation password do not match."]}
            )

        student = Student.objects.filter(student_id__iexact=student_id).first()
        if (
            not student
            or student.status != "Active"
            or _normalize_contact(student.contact) != _normalize_contact(contact)
            or not _normalize_contact(contact)
        ):
            raise serializers.ValidationError(
                {
                    "student_id": [
                        "No active student record matches the provided Student ID and registered contact number."
                    ]
                }
            )

        if RoleProfile.objects.filter(student=student).exists():
            raise serializers.ValidationError(
                {"student_id": ["An account has already been registered for this student record."]}
            )

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError(
                {"username": ["A user with that username already exists."]}
            )

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"email": ["A user with that email address already exists."]}
            )

        name_parts = student.name.strip().split(None, 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""

        candidate_user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        try:
            validate_password(password, user=candidate_user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({"password": list(exc.messages)})

        attrs["student"] = student
        attrs["email"] = email
        attrs["username"] = username
        attrs["first_name"] = first_name
        attrs["last_name"] = last_name
        return attrs

    def create(self, validated_data):
        student = validated_data["student"]
        with transaction.atomic():
            locked_student = Student.objects.select_for_update().get(pk=student.pk)
            if RoleProfile.objects.filter(student=locked_student).exists():
                raise serializers.ValidationError(
                    {"student_id": ["An account has already been registered for this student record."]}
                )

            user = User.objects.create_user(
                username=validated_data["username"],
                email=validated_data["email"],
                password=validated_data["password"],
                first_name=validated_data["first_name"],
                last_name=validated_data["last_name"],
                is_active=False,
            )
            profile = RoleProfile.objects.create(
                user=user,
                role=RoleProfile.Role.STUDENT,
                student=locked_student,
            )
            create_audit_log(None, "CREATE", "RoleProfile", profile.pk)
        return user


class StudentSignupResponseSerializer(serializers.Serializer):
    message = serializers.CharField(read_only=True)
    username = serializers.CharField(read_only=True)
    student_id = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)


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
