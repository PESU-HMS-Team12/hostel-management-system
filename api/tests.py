from datetime import date, timedelta
from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection, connections
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import exceptions, status
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

from accounts.models import RoleProfile
from allocations.models import Allocation
from api.exceptions import custom_exception_handler
from api.permissions import (
    HasHMSRole,
    IsAdministrator,
    IsOwnerStudentOrStaff,
    IsStudentUser,
    IsWardenOrAdministrator,
)
from auditlog.models import AuditLog
from hostels.models import Hostel, Room
from students.models import Student

User = get_user_model()


class HealthCheckAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_health_check_returns_200(self):
        url = reverse("api_v1:health")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertIn("timestamp", response.data)
        self.assertEqual(response.data["services"]["database"], "operational")

    def test_health_check_reports_unexpected_database_response(self):
        with patch("api.views.health.connection.cursor") as cursor_factory:
            cursor = cursor_factory.return_value.__enter__.return_value
            cursor.fetchone.return_value = (0,)

            response = self.client.get(reverse("api_v1:health"))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "unhealthy")
        self.assertEqual(
            response.data["services"]["database"],
            "unexpected_response",
        )


class CustomExceptionHandlerTests(TestCase):

    def test_django_validation_error_is_structured(self):
        exc = DjangoValidationError({"field_name": ["This field is required."]})
        response = custom_exception_handler(exc, {})

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Validation error.")
        self.assertIn("field_name", response.data["details"])
        self.assertEqual(response.data["status_code"], 400)

    def test_django_non_field_validation_error_is_structured(self):
        response = custom_exception_handler(
            DjangoValidationError(["A general validation error."]),
            {},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data["details"],
            {"non_field_errors": ["A general validation error."]},
        )

    def test_rest_framework_detail_and_field_errors_are_structured(self):
        request = Request(APIRequestFactory().post("/api/v1/students/"))

        detail_response = custom_exception_handler(
            exceptions.APIException("Request could not be processed."),
            {"request": request},
        )
        self.assertEqual(
            detail_response.data["error"],
            "Request could not be processed.",
        )
        self.assertEqual(detail_response.data["status_code"], 500)

        field_response = custom_exception_handler(
            exceptions.ValidationError({"name": ["This field is required."]}),
            {"request": request},
        )
        self.assertEqual(field_response.data["error"], "Validation failed.")
        self.assertIn("name", field_response.data["details"])

    def test_rest_framework_list_errors_and_authentication_status_are_structured(self):
        request = Request(APIRequestFactory().get("/api/v1/auth/me/"))
        list_response = custom_exception_handler(
            exceptions.ValidationError(["A request-level error."]),
            {"request": request},
        )
        self.assertEqual(
            list_response.data["details"],
            {"non_field_errors": ["A request-level error."]},
        )

        auth_response = custom_exception_handler(
            exceptions.NotAuthenticated("Sign in is required."),
            {"request": request},
        )
        self.assertEqual(auth_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(auth_response.data["status_code"], 401)

    def test_unhandled_exception_returns_no_rest_framework_response(self):
        self.assertIsNone(custom_exception_handler(ValueError("bad data"), {}))


class APIAuthenticationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # Create Warden User
        self.warden_user = User.objects.create_user(
            username="api_warden",
            email="api_warden@example.com",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden_user,
            role=RoleProfile.Role.WARDEN,
        )

        # Create Student User & Record
        self.student_record = Student.objects.create(
            student_id="API-S001",
            name="API Student",
            contact="9999999999",
            course_program="Computer Science",
            year=2,
            status="Active",
        )
        self.student_user = User.objects.create_user(
            username="api_student",
            email="api_student@example.com",
            password="StudentPassword!482",
        )
        RoleProfile.objects.create(
            user=self.student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student_record,
        )

        # Create Unconfigured User
        self.unconfigured_user = User.objects.create_user(
            username="api_norole",
            email="api_norole@example.com",
            password="NoRolePassword!482",
        )

    def test_csrf_token_endpoint(self):
        url = reverse("api_v1:auth-csrf")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", response.data)
        self.assertTrue(len(response.data["csrfToken"]) > 0)
        self.assertIn("csrftoken", response.cookies)

    def test_login_with_username_success(self):
        url = reverse("api_v1:auth-login")
        response = self.client.post(
            url,
            {"username": "api_warden", "password": "WardenPassword!482"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "api_warden")
        self.assertEqual(response.data["role"], "WARDEN")
        self.assertEqual(response.data["role_label"], "Warden")
        self.assertIn("sessionid", self.client.cookies)

    def test_login_with_email_success(self):
        url = reverse("api_v1:auth-login")
        response = self.client.post(
            url,
            {"username": "api_warden@example.com", "password": "WardenPassword!482"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "api_warden")

    def test_login_invalid_password(self):
        url = reverse("api_v1:auth-login")
        response = self.client.post(
            url,
            {"username": "api_warden", "password": "WrongPassword!999"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status_code"], 400)

    def test_login_user_without_role_rejected(self):
        url = reverse("api_v1:auth-login")
        response = self.client.post(
            url,
            {"username": "api_norole", "password": "NoRolePassword!482"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_missing_csrf_token_rejected(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        url = reverse("api_v1:auth-login")
        response = csrf_client.post(
            url,
            {"username": "api_warden", "password": "WardenPassword!482"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["status_code"], 403)
        self.assertIn("CSRF", response.data["error"])

    def test_login_with_valid_csrf_token_success(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_res = csrf_client.get(reverse("api_v1:auth-csrf"))
        token = csrf_res.data["csrfToken"]

        url = reverse("api_v1:auth-login")
        response = csrf_client.post(
            url,
            {"username": "api_warden", "password": "WardenPassword!482"},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], "api_warden")
        self.assertEqual(response.data["role"], "WARDEN")
        self.assertIn("sessionid", csrf_client.cookies)

    def test_login_with_valid_csrf_token_invalid_credentials(self):
        csrf_client = APIClient(enforce_csrf_checks=True)
        csrf_res = csrf_client.get(reverse("api_v1:auth-csrf"))
        token = csrf_res.data["csrfToken"]

        url = reverse("api_v1:auth-login")
        response = csrf_client.post(
            url,
            {"username": "api_warden", "password": "WrongPassword!999"},
            format="json",
            HTTP_X_CSRFTOKEN=token,
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["status_code"], 400)

    def test_current_user_unauthenticated(self):
        url = reverse("api_v1:auth-me")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_current_user_warden(self):
        self.client.force_login(self.warden_user)
        url = reverse("api_v1:auth-me")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "WARDEN")
        self.assertIsNone(response.data["student"])
        self.assertIsNone(response.data["current_allocation"])

    def test_current_user_student_with_active_allocation(self):
        hostel = Hostel.objects.create(
            hostel_id="API-H001",
            name="API Test Hostel",
            block_location="API Block A",
        )
        room = Room.objects.create(
            room_id="API-R001",
            hostel=hostel,
            room_no="A101",
            room_type="Single",
            capacity=1,
        )
        allocation = Allocation.objects.create(
            student=self.student_record,
            room=room,
            allocation_date=date(2026, 10, 1),
            check_in_date=date(2026, 10, 2),
        )

        self.client.force_login(self.student_user)
        url = reverse("api_v1:auth-me")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "STUDENT")
        self.assertIsNotNone(response.data["student"])
        self.assertEqual(response.data["student"]["student_id"], "API-S001")
        self.assertIsNotNone(response.data["current_allocation"])
        self.assertEqual(response.data["current_allocation"]["id"], allocation.id)
        self.assertEqual(response.data["current_allocation"]["room_no"], "A101")
        self.assertEqual(response.data["current_allocation"]["hostel_name"], "API Test Hostel")

    def test_logout_invalidates_session(self):
        self.client.force_login(self.warden_user)
        url = reverse("api_v1:auth-logout")
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # After logout, accessing current user must return 401
        me_url = reverse("api_v1:auth-me")
        me_response = self.client.get(me_url)
        self.assertEqual(me_response.status_code, status.HTTP_401_UNAUTHORIZED)


class APIPermissionClassesTests(TestCase):

    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username="admin_perm",
            password="AdminPassword!482",
        )
        self.warden_user = User.objects.create_user(
            username="warden_perm",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden_user,
            role=RoleProfile.Role.WARDEN,
        )
        self.student_record = Student.objects.create(
            student_id="STUDENT-PERM-1",
            name="Perm Student",
            contact="1111111111",
            course_program="CS",
            year=1,
        )
        self.student_user = User.objects.create_user(
            username="student_perm",
            password="StudentPassword!482",
        )
        RoleProfile.objects.create(
            user=self.student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student_record,
        )

        class MockRequest:
            def __init__(self, user):
                self.user = user

        self.admin_req = MockRequest(self.admin_user)
        self.warden_req = MockRequest(self.warden_user)
        self.student_req = MockRequest(self.student_user)

    def test_is_administrator_permission(self):
        perm = IsAdministrator()
        self.assertTrue(perm.has_permission(self.admin_req, None))
        self.assertFalse(perm.has_permission(self.warden_req, None))
        self.assertFalse(perm.has_permission(self.student_req, None))

    def test_is_warden_or_administrator_permission(self):
        perm = IsWardenOrAdministrator()
        self.assertTrue(perm.has_permission(self.admin_req, None))
        self.assertTrue(perm.has_permission(self.warden_req, None))
        self.assertFalse(perm.has_permission(self.student_req, None))

    def test_is_student_user_permission(self):
        perm = IsStudentUser()
        self.assertFalse(perm.has_permission(self.admin_req, None))
        self.assertFalse(perm.has_permission(self.warden_req, None))
        self.assertTrue(perm.has_permission(self.student_req, None))

    def test_is_owner_student_or_staff_object_permission(self):
        perm = IsOwnerStudentOrStaff()
        other_student = Student.objects.create(
            student_id="STUDENT-OTHER",
            name="Other Student",
            contact="2222222222",
            course_program="CS",
            year=1,
        )

        # Staff can access any student object
        self.assertTrue(perm.has_object_permission(self.admin_req, None, other_student))
        self.assertTrue(perm.has_object_permission(self.warden_req, None, other_student))

        # Student can only access own object
        self.assertTrue(perm.has_object_permission(self.student_req, None, self.student_record))
        self.assertFalse(perm.has_object_permission(self.student_req, None, other_student))

        self.assertFalse(perm.has_object_permission(self.student_req, None, {}))

    def test_student_allocation_ownership_and_missing_student_link(self):
        hostel = Hostel.objects.create(
            hostel_id="PERM-H-01",
            name="Permission Hostel",
            block_location="North",
        )
        room = Room.objects.create(
            room_id="PERM-R-01",
            hostel=hostel,
            room_no="101",
            room_type="Single",
            capacity=1,
        )
        own_allocation = Allocation.objects.create(
            student=self.student_record,
            room=room,
            allocation_date=timezone.localdate(),
        )
        other_student = Student.objects.create(
            student_id="STUDENT-PERM-OTHER",
            name="Other Perm Student",
            contact="3333333333",
            course_program="CS",
            year=1,
        )
        other_allocation = Allocation.objects.create(
            student=other_student,
            room=Room.objects.create(
                room_id="PERM-R-02",
                hostel=hostel,
                room_no="102",
                room_type="Single",
                capacity=1,
            ),
            allocation_date=timezone.localdate(),
        )

        permission = IsOwnerStudentOrStaff()
        self.assertTrue(
            permission.has_object_permission(self.student_req, None, own_allocation)
        )
        self.assertFalse(
            permission.has_object_permission(self.student_req, None, other_allocation)
        )

        RoleProfile.objects.filter(user=self.student_user).update(student=None)
        self.student_user.refresh_from_db()
        self.assertFalse(
            permission.has_object_permission(self.student_req, None, self.student_record)
        )

    def test_has_hms_role_rejects_users_without_a_role(self):
        user_without_role = User.objects.create_user(username="no_hms_role")

        class Request:
            user = user_without_role

        self.assertFalse(HasHMSRole().has_permission(Request(), None))

    def test_anonymous_permission_checks_are_rejected(self):
        class Request:
            user = AnonymousUser()

        request = Request()
        with self.assertRaises(exceptions.NotAuthenticated):
            HasHMSRole().has_permission(request, None)
        self.assertFalse(
            IsOwnerStudentOrStaff().has_object_permission(
                request,
                None,
                self.student_record,
            )
        )


class RoleProfileValidationTests(TestCase):
    def test_student_role_requires_a_linked_student_record(self):
        user = User.objects.create_user(username="unlinked_student_profile")
        profile = RoleProfile(user=user, role=RoleProfile.Role.STUDENT)

        with self.assertRaises(DjangoValidationError) as raised:
            profile.clean()

        self.assertIn("student", raised.exception.message_dict)

    def test_staff_role_rejects_a_linked_student_record(self):
        user = User.objects.create_user(username="linked_staff_profile")
        student = Student.objects.create(
            student_id="ROLE-VALIDATION-01",
            name="Role Validation Student",
            contact="4444444444",
            course_program="CS",
            year=1,
        )
        profile = RoleProfile(
            user=user,
            role=RoleProfile.Role.WARDEN,
            student=student,
        )

        with self.assertRaises(DjangoValidationError) as raised:
            profile.clean()

        self.assertIn("student", raised.exception.message_dict)


class StudentAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.warden = User.objects.create_user(
            username="student_api_warden",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.student_user = User.objects.create_user(
            username="student_api_user",
            password="StudentPassword!482",
        )
        self.student_obj = Student.objects.create(
            student_id="STUDENT-API-01",
            name="Alice",
            contact="1234567890",
            course_program="CSE",
            year=2,
            status="Active",
        )
        RoleProfile.objects.create(
            user=self.student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student_obj,
        )

    def test_warden_can_list_students(self):
        self.client.force_login(self.warden)
        url = reverse("api_v1:student-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student_id"], "STUDENT-API-01")

    def test_warden_can_create_student_and_audit_logged(self):
        self.client.force_login(self.warden)
        url = reverse("api_v1:student-list")
        payload = {
            "student_id": "STUDENT-API-02",
            "name": "Bob",
            "contact": "0987654321",
            "course_program=" : "ECE",
            "course_program": "ECE",
            "year": 1,
            "status": "Active",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["student_id"], "STUDENT-API-02")
        self.assertTrue(
            AuditLog.objects.filter(
                action_type="CREATE",
                entity_type="Student",
                record_id="STUDENT-API-02",
            ).exists()
        )

    def test_student_search_and_filter(self):
        Student.objects.create(
            student_id="SEARCH-01",
            name="Charlie Search",
            contact="1111111111",
            course_program="MECH",
            year=3,
            status="Inactive",
        )
        self.client.force_login(self.warden)
        url = reverse("api_v1:student-list")

        # Search query
        response = self.client.get(url, {"q": "Charlie"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student_id"], "SEARCH-01")

        # Status filter
        response = self.client.get(url, {"status": "Inactive"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["student_id"], "SEARCH-01")

    def test_warden_can_deactivate_student(self):
        self.client.force_login(self.warden)
        url = reverse("api_v1:student-deactivate", kwargs={"pk": self.student_obj.pk})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.student_obj.refresh_from_db()
        self.assertEqual(self.student_obj.status, "Inactive")
        self.assertTrue(
            AuditLog.objects.filter(
                action_type="UPDATE",
                entity_type="Student",
                record_id=self.student_obj.student_id,
            ).exists()
        )

    def test_student_cannot_list_all_students(self):
        self.client.force_login(self.student_user)
        url = reverse("api_v1:student-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class HostelAndRoomAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.warden = User.objects.create_user(
            username="hostel_api_warden",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )
        self.client.force_login(self.warden)

        self.hostel = Hostel.objects.create(
            hostel_id="H-API-01",
            name="Cauvery Hostel",
            block_location="North Block",
            status="Active",
        )

    def test_create_and_list_hostel(self):
        url = reverse("api_v1:hostel-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["hostel_id"], "H-API-01")

    def test_create_room_and_availability(self):
        url = reverse("api_v1:room-list")
        payload = {
            "room_id": "R-API-101",
            "hostel": self.hostel.pk,
            "room_no": "101",
            "room_type": "Double",
            "capacity": 2,
            "status": "Available",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["room_id"], "R-API-101")
        self.assertEqual(response.data["available_beds"], 2)

        # Check availability endpoint
        avail_url = reverse("api_v1:room-availability")
        avail_response = self.client.get(avail_url)
        self.assertEqual(avail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(avail_response.data), 1)
        self.assertEqual(avail_response.data[0]["availability_label"], "Vacant")

    def test_zero_capacity_room_is_rejected(self):
        url = reverse("api_v1:room-list")
        payload = {
            "room_id": "R-API-102",
            "hostel": self.hostel.pk,
            "room_no": "102",
            "room_type": "Single",
            "capacity": 0,
            "status": "Available",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AllocationAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.warden = User.objects.create_user(
            username="alloc_api_warden",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.hostel = Hostel.objects.create(
            hostel_id="H-ALLOC-01",
            name="Ganga Hostel",
            block_location="South Block",
            status="Active",
        )
        self.room1 = Room.objects.create(
            room_id="R-ALLOC-101",
            hostel=self.hostel,
            room_no="101",
            room_type="Single",
            capacity=1,
            status="Available",
        )
        self.room2 = Room.objects.create(
            room_id="R-ALLOC-102",
            hostel=self.hostel,
            room_no="102",
            room_type="Single",
            capacity=1,
            status="Available",
        )
        self.student = Student.objects.create(
            student_id="STUDENT-ALLOC-01",
            name="John Doe",
            contact="9876543210",
            course_program="CSE",
            year=2,
            status="Active",
        )
        self.client.force_login(self.warden)

    def test_create_allocation_success(self):
        url = reverse("api_v1:allocation-list")
        payload = {
            "student": self.student.pk,
            "room": self.room1.pk,
            "allocation_date": timezone.localdate().isoformat(),
            "check_in_date": timezone.localdate().isoformat(),
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["student"], self.student.pk)
        self.assertEqual(response.data["room"], self.room1.pk)
        self.assertTrue(
            AuditLog.objects.filter(
                action_type="CREATE",
                entity_type="Allocation",
            ).exists()
        )

    def test_cannot_exceed_room_capacity(self):
        today = timezone.localdate()
        Allocation.objects.create(
            student=self.student,
            room=self.room1,
            allocation_date=today,
            check_in_date=today,
        )

        student2 = Student.objects.create(
            student_id="STUDENT-ALLOC-02",
            name="Jane Doe",
            contact="9876543211",
            course_program="ECE",
            year=1,
            status="Active",
        )

        url = reverse("api_v1:allocation-list")
        payload = {
            "student": student2.pk,
            "room": self.room1.pk,
            "allocation_date": today.isoformat(),
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_transfer_allocation(self):
        today = timezone.localdate()
        allocation = Allocation.objects.create(
            student=self.student,
            room=self.room1,
            allocation_date=today,
            check_in_date=today,
        )

        url = reverse("api_v1:allocation-transfer", kwargs={"pk": allocation.pk})
        payload = {
            "new_room": self.room2.pk,
            "transfer_date": today.isoformat(),
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        allocation.refresh_from_db()
        self.assertEqual(allocation.check_out_date, today)

        new_alloc = Allocation.objects.get(student=self.student, check_out_date__isnull=True)
        self.assertEqual(new_alloc.room, self.room2)

    def test_vacate_allocation(self):
        today = timezone.localdate()
        allocation = Allocation.objects.create(
            student=self.student,
            room=self.room1,
            allocation_date=today,
            check_in_date=today,
        )

        url = reverse("api_v1:allocation-vacate", kwargs={"pk": allocation.pk})
        payload = {"checkout_date": today.isoformat()}
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        allocation.refresh_from_db()
        self.assertEqual(allocation.check_out_date, today)


class AdminRoleManagementAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin_api_user",
            password="AdminPassword!482",
        )
        self.target_user = User.objects.create_user(
            username="target_user",
            email="target@example.com",
            password="TargetPassword!482",
        )
        self.client.force_login(self.admin)

    def test_admin_can_list_users(self):
        url = reverse("api_v1:admin-users")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 2)
        # Verify password is not exposed
        for u in response.data:
            self.assertNotIn("password", u)

    def test_admin_can_assign_warden_role_and_audit_logged(self):
        url = reverse("api_v1:admin-roles")
        payload = {
            "user_id": self.target_user.pk,
            "role": "WARDEN",
        }
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "WARDEN")

        profile = RoleProfile.objects.get(user=self.target_user)
        self.assertEqual(profile.role, "WARDEN")

        # Verify TC-SEC-05 audit log for role creation
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                entity_type="RoleProfile",
                record_id=str(profile.pk),
            ).exists()
        )


class ReportsAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.warden = User.objects.create_user(
            username="report_warden",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )
        self.client.force_login(self.warden)

        hostel = Hostel.objects.create(
            hostel_id="H-REP-1",
            name="Report Hostel",
            block_location="Main",
            status="Active",
        )
        room = Room.objects.create(
            room_id="R-REP-1",
            hostel=hostel,
            room_no="101",
            room_type="Single",
            capacity=2,
            status="Available",
        )
        student = Student.objects.create(
            student_id="STUDENT-REP-1",
            name="Report Student",
            contact="1234567890",
            course_program="CSE",
            year=1,
            status="Active",
        )
        Allocation.objects.create(
            student=student,
            room=room,
            allocation_date=timezone.localdate(),
        )

    def test_occupancy_report(self):
        url = reverse("api_v1:report-occupancy")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_rooms"], 1)
        self.assertEqual(response.data["total_capacity"], 2)
        self.assertEqual(response.data["total_occupied_beds"], 1)
        self.assertEqual(response.data["total_available_beds"], 1)
        self.assertEqual(response.data["overall_occupancy_rate"], 50.0)

    def test_allocation_report(self):
        url = reverse("api_v1:report-allocations")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_allocations"], 1)
        self.assertEqual(response.data["active_allocations"], 1)
        self.assertEqual(response.data["completed_allocations"], 0)
        self.assertEqual(response.data["allocations_by_program"]["CSE"], 1)


class OpenAPIDocumentationTests(TestCase):

    def setUp(self):
        self.client = APIClient()

    def test_schema_endpoint_returns_200(self):
        url = reverse("schema")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_swagger_ui_endpoint_returns_200(self):
        url = reverse("swagger-ui")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_redoc_endpoint_returns_200(self):
        url = reverse("redoc")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


from django.db import IntegrityError
from django.test import TransactionTestCase
import concurrent.futures


class DatabaseConstraintAndConcurrencyTests(TransactionTestCase):

    def setUp(self):
        self.warden = User.objects.create_user(
            username="concurrent_warden",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )
        self.hostel = Hostel.objects.create(
            hostel_id="H-CONC-1",
            name="Concurrency Hostel",
            block_location="C Block",
            status="Active",
        )
        self.room = Room.objects.create(
            room_id="R-CONC-1",
            hostel=self.hostel,
            room_no="C101",
            room_type="Single",
            capacity=1,
            status="Available",
        )
        self.student_a = Student.objects.create(
            student_id="STUDENT-CONC-A",
            name="Student A",
            contact="1111111111",
            course_program="CSE",
            year=1,
            status="Active",
        )
        self.student_b = Student.objects.create(
            student_id="STUDENT-CONC-B",
            name="Student B",
            contact="2222222222",
            course_program="ECE",
            year=1,
            status="Active",
        )

    def test_database_constraint_positive_room_capacity(self):
        with self.assertRaises(IntegrityError):
            Room.objects.create(
                room_id="R-INVALID-CAP",
                hostel=self.hostel,
                room_no="C999",
                room_type="Single",
                capacity=0,
                status="Available",
            )

    def test_database_constraint_unique_hostel_room_no(self):
        with self.assertRaises(IntegrityError):
            Room.objects.create(
                room_id="R-DUPE-NO",
                hostel=self.hostel,
                room_no="C101",
                room_type="Single",
                capacity=1,
                status="Available",
            )

    def test_database_constraint_unique_active_student_allocation(self):
        today = timezone.localdate()
        Allocation.objects.create(
            student=self.student_a,
            room=self.room,
            allocation_date=today,
        )
        room_b = Room.objects.create(
            room_id="R-CONC-2",
            hostel=self.hostel,
            room_no="C102",
            room_type="Single",
            capacity=1,
            status="Available",
        )
        with self.assertRaises(IntegrityError):
            Allocation.objects.bulk_create([
                Allocation(
                    student=self.student_a,
                    room=room_b,
                    allocation_date=today,
                )
            ])

    def test_concurrent_allocation_capacity_protection(self):
        if connection.vendor == "sqlite":
            self.skipTest("Row-level lock concurrency testing requires PostgreSQL; SQLite locks at table/database level.")

        url = reverse("api_v1:allocation-list")
        today = timezone.localdate().isoformat()

        client_a = APIClient()
        client_a.force_login(self.warden)
        client_b = APIClient()
        client_b.force_login(self.warden)

        def try_allocate(client, student_id):
            try:
                return client.post(
                    url,
                    {
                        "student": student_id,
                        "room": self.room.pk,
                        "allocation_date": today,
                    },
                    format="json",
                )
            finally:
                connections.close_all()

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_a = executor.submit(try_allocate, client_a, self.student_a.pk)
            future_b = executor.submit(try_allocate, client_b, self.student_b.pk)
            res_a = future_a.result()
            res_b = future_b.result()

        status_codes = [res_a.status_code, res_b.status_code]
        self.assertIn(status.HTTP_201_CREATED, status_codes)
        self.assertIn(status.HTTP_400_BAD_REQUEST, status_codes)

        self.assertEqual(
            Allocation.objects.filter(room=self.room, check_out_date__isnull=True).count(),
            1,
        )

    def tearDown(self):
        connections.close_all()
        super().tearDown()


from io import StringIO
from django.core.management import call_command
from django.core.management.base import CommandError


class StudentSignupAndApprovalAPITests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.csrf_client = APIClient(enforce_csrf_checks=True)
        self.active_student = Student.objects.create(
            student_id="PES1UG23CS901",
            name="Rohan Deshmukh",
            contact="9876543210",
            course_program="B.Tech CSE",
            year=3,
            status="Active",
        )
        self.inactive_student = Student.objects.create(
            student_id="PES1UG23CS902",
            name="Inactive Student",
            contact="9876543211",
            course_program="B.Tech ECE",
            year=2,
            status="Inactive",
        )
        self.admin = User.objects.create_user(
            username="approval_admin",
            email="approval.admin@pes.edu",
            password="AdminPassword!482",
        )
        RoleProfile.objects.create(
            user=self.admin,
            role=RoleProfile.Role.ADMINISTRATOR,
        )
        self.warden = User.objects.create_user(
            username="approval_warden",
            email="approval.warden@pes.edu",
            password="WardenPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

    def test_signup_requires_csrf_when_enforced(self):
        url = reverse("api_v1:auth-signup")
        payload = {
            "student_id": "PES1UG23CS901",
            "contact": "9876543210",
            "email": "rohan.deshmukh@stu.pes.edu",
            "username": "rohan_deshmukh",
            "password": "StrongStudentPass!901",
            "confirm_password": "StrongStudentPass!901",
        }
        res_without_csrf = self.csrf_client.post(url, payload, format="json")
        self.assertEqual(res_without_csrf.status_code, status.HTTP_403_FORBIDDEN)

        csrf_res = self.csrf_client.get(reverse("api_v1:auth-csrf"))
        csrf_token = csrf_res.data["csrfToken"]
        res_with_csrf = self.csrf_client.post(
            url,
            payload,
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(res_with_csrf.status_code, status.HTTP_201_CREATED)

    def test_valid_student_signup_creates_pending_account_and_audit_log(self):
        url = reverse("api_v1:auth-signup")
        payload = {
            "student_id": "PES1UG23CS901",
            "contact": "+91 98765-43210" if False else "98765-43210",
            "email": "rohan.deshmukh@stu.pes.edu",
            "username": "rohan_deshmukh",
            "password": "StrongStudentPass!901",
            "confirm_password": "StrongStudentPass!901",
        }
        response = self.client.post(url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            response.data["message"],
            "Your account registration has been submitted and is awaiting hostel administration approval.",
        )
        self.assertEqual(response.data["status"], "PENDING_APPROVAL")

        created_user = User.objects.get(username="rohan_deshmukh")
        self.assertFalse(created_user.is_active)
        self.assertEqual(created_user.first_name, "Rohan")
        self.assertEqual(created_user.last_name, "Deshmukh")

        profile = RoleProfile.objects.get(user=created_user)
        self.assertEqual(profile.role, RoleProfile.Role.STUDENT)
        self.assertEqual(profile.student, self.active_student)

        self.assertTrue(
            AuditLog.objects.filter(
                action_type="CREATE",
                entity_type="RoleProfile",
                record_id=str(profile.pk),
            ).exists()
        )

    def test_signup_rejects_invalid_student_or_mismatched_contact_or_inactive(self):
        url = reverse("api_v1:auth-signup")
        # Unknown student_id
        res_unknown = self.client.post(
            url,
            {
                "student_id": "PES1UG99ZZ999",
                "contact": "9876543210",
                "email": "unknown@stu.pes.edu",
                "username": "unknown_stu",
                "password": "StrongStudentPass!901",
                "confirm_password": "StrongStudentPass!901",
            },
            format="json",
        )
        self.assertEqual(res_unknown.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("student_id", res_unknown.data["details"])

        # Wrong contact number for active student
        res_bad_contact = self.client.post(
            url,
            {
                "student_id": "PES1UG23CS901",
                "contact": "0000000000",
                "email": "rohan.deshmukh@stu.pes.edu",
                "username": "rohan_deshmukh",
                "password": "StrongStudentPass!901",
                "confirm_password": "StrongStudentPass!901",
            },
            format="json",
        )
        self.assertEqual(res_bad_contact.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("student_id", res_bad_contact.data["details"])

        # Inactive student record
        res_inactive = self.client.post(
            url,
            {
                "student_id": "PES1UG23CS902",
                "contact": "9876543211",
                "email": "inactive@stu.pes.edu",
                "username": "inactive_stu",
                "password": "StrongStudentPass!901",
                "confirm_password": "StrongStudentPass!901",
            },
            format="json",
        )
        self.assertEqual(res_inactive.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("student_id", res_inactive.data["details"])

    def test_signup_rejects_duplicate_student_username_email_and_role_escalation(self):
        url = reverse("api_v1:auth-signup")
        base_payload = {
            "student_id": "PES1UG23CS901",
            "contact": "9876543210",
            "email": "rohan.deshmukh@stu.pes.edu",
            "username": "rohan_deshmukh",
            "password": "StrongStudentPass!901",
            "confirm_password": "StrongStudentPass!901",
        }
        # Reject privilege escalation attempt
        res_escalate = self.client.post(
            url,
            {**base_payload, "role": "ADMINISTRATOR"},
            format="json",
        )
        self.assertEqual(res_escalate.status_code, status.HTTP_400_BAD_REQUEST)

        # Register first time
        res_ok = self.client.post(url, base_payload, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED)

        # Duplicate student record
        res_dup_student = self.client.post(
            url,
            {
                **base_payload,
                "username": "rohan_second",
                "email": "rohan2@stu.pes.edu",
            },
            format="json",
        )
        self.assertEqual(res_dup_student.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("student_id", res_dup_student.data["details"])

    def test_pending_student_cannot_login_until_approved_by_administrator(self):
        signup_url = reverse("api_v1:auth-signup")
        login_url = reverse("api_v1:auth-login")
        self.client.post(
            signup_url,
            {
                "student_id": "PES1UG23CS901",
                "contact": "9876543210",
                "email": "rohan.deshmukh@stu.pes.edu",
                "username": "rohan_deshmukh",
                "password": "StrongStudentPass!901",
                "confirm_password": "StrongStudentPass!901",
            },
            format="json",
        )
        pending_user = User.objects.get(username="rohan_deshmukh")

        # Attempt login before approval -> rejected with pending approval message
        login_before = self.client.post(
            login_url,
            {"username": "rohan_deshmukh", "password": "StrongStudentPass!901"},
            format="json",
        )
        self.assertEqual(login_before.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("awaiting administrator approval", str(login_before.data))

        # Warden cannot approve
        approve_url = reverse("api_v1:admin-user-approve", kwargs={"user_id": pending_user.pk})
        self.client.force_login(self.warden)
        warden_approve = self.client.post(approve_url)
        self.assertEqual(warden_approve.status_code, status.HTTP_403_FORBIDDEN)

        # Active student cannot approve
        active_student_record = Student.objects.create(
            student_id="PES1UG23CS999",
            name="Active Student Actor",
            contact="9876543999",
            course_program="B.Tech CSE",
            year=3,
            status="Active",
        )
        active_student_user = User.objects.create_user(
            username="active_student_actor",
            email="active.actor@stu.pes.edu",
            password="StrongStudentPass!901",
            is_active=True,
        )
        RoleProfile.objects.create(
            user=active_student_user,
            role=RoleProfile.Role.STUDENT,
            student=active_student_record,
        )
        self.client.force_login(active_student_user)
        student_approve = self.client.post(approve_url)
        self.assertEqual(student_approve.status_code, status.HTTP_403_FORBIDDEN)

        # Administrator approves
        self.client.force_login(self.admin)
        admin_approve = self.client.post(approve_url)
        self.assertEqual(admin_approve.status_code, status.HTTP_200_OK)
        self.assertTrue(admin_approve.data["is_active"])
        self.assertEqual(admin_approve.data["role"], "STUDENT")

        self.assertTrue(
            AuditLog.objects.filter(
                user=self.admin,
                action_type="UPDATE",
                entity_type="User",
                record_id=str(pending_user.pk),
            ).exists()
        )

        # Approving an already-active account again is rejected with 400
        approve_again = self.client.post(approve_url)
        self.assertEqual(approve_again.status_code, status.HTTP_400_BAD_REQUEST)

        # Approving an account without a RoleProfile is rejected with 400
        unassigned_inactive = User.objects.create_user(
            username="unassigned_inactive",
            email="unassigned@stu.pes.edu",
            password="StrongStudentPass!901",
            is_active=False,
        )
        unassigned_approve = self.client.post(
            reverse("api_v1:admin-user-approve", kwargs={"user_id": unassigned_inactive.pk})
        )
        self.assertEqual(unassigned_approve.status_code, status.HTTP_400_BAD_REQUEST)

        # Approving an inactive Warden or Administrator account is rejected with 400
        inactive_warden = User.objects.create_user(
            username="inactive_warden_acc",
            email="inactive.warden@pes.edu",
            password="WardenPassword!482",
            is_active=False,
        )
        RoleProfile.objects.create(
            user=inactive_warden,
            role=RoleProfile.Role.WARDEN,
        )
        warden_acc_approve = self.client.post(
            reverse("api_v1:admin-user-approve", kwargs={"user_id": inactive_warden.pk})
        )
        self.assertEqual(warden_acc_approve.status_code, status.HTTP_400_BAD_REQUEST)

        inactive_admin = User.objects.create_user(
            username="inactive_admin_acc",
            email="inactive.admin@pes.edu",
            password="AdminPassword!482",
            is_active=False,
        )
        RoleProfile.objects.create(
            user=inactive_admin,
            role=RoleProfile.Role.ADMINISTRATOR,
        )
        admin_acc_approve = self.client.post(
            reverse("api_v1:admin-user-approve", kwargs={"user_id": inactive_admin.pk})
        )
        self.assertEqual(admin_acc_approve.status_code, status.HTTP_400_BAD_REQUEST)

        # Approving a pending student linked to an inactive Student record is rejected with 400
        pending_inactive_stu = User.objects.create_user(
            username="pending_inactive_stu",
            email="pending.inactive@stu.pes.edu",
            password="StrongStudentPass!901",
            is_active=False,
        )
        RoleProfile.objects.create(
            user=pending_inactive_stu,
            role=RoleProfile.Role.STUDENT,
            student=self.inactive_student,
        )
        inactive_stu_approve = self.client.post(
            reverse("api_v1:admin-user-approve", kwargs={"user_id": pending_inactive_stu.pk})
        )
        self.assertEqual(inactive_stu_approve.status_code, status.HTTP_400_BAD_REQUEST)

        # Now student can log in
        self.client.logout()
        login_after = self.client.post(
            login_url,
            {"username": "rohan_deshmukh", "password": "StrongStudentPass!901"},
            format="json",
        )
        self.assertEqual(login_after.status_code, status.HTTP_200_OK)
        self.assertEqual(login_after.data["role"], "STUDENT")
        self.assertEqual(login_after.data["student"]["student_id"], "PES1UG23CS901")

    def test_csrf_cookie_attributes_and_localhost_3000_origin_login_and_signup(self):
        csrf_res = self.csrf_client.get(
            reverse("api_v1:auth-csrf"),
            HTTP_ORIGIN="http://localhost:3000",
        )
        self.assertEqual(csrf_res.status_code, status.HTTP_200_OK)
        self.assertIn("csrftoken", csrf_res.cookies)
        morsel = csrf_res.cookies["csrftoken"]
        self.assertEqual(morsel["path"], "/")
        self.assertEqual(morsel["samesite"], "Lax")
        self.assertFalse(bool(morsel["httponly"]))

        csrf_cookie_val = morsel.value
        signup_res = self.csrf_client.post(
            reverse("api_v1:auth-signup"),
            {
                "student_id": "PES1UG23CS901",
                "contact": "9876543210",
                "email": "rohan.deshmukh@stu.pes.edu",
                "username": "rohan_deshmukh",
                "password": "StrongStudentPass!901",
                "confirm_password": "StrongStudentPass!901",
            },
            format="json",
            HTTP_X_CSRFTOKEN=csrf_cookie_val,
            HTTP_ORIGIN="http://localhost:3000",
            HTTP_REFERER="http://localhost:3000/signup",
        )
        self.assertEqual(signup_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(signup_res.data["status"], "PENDING_APPROVAL")

        login_res = self.csrf_client.post(
            reverse("api_v1:auth-login"),
            {"username": "approval_admin", "password": "AdminPassword!482"},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_cookie_val,
            HTTP_ORIGIN="http://localhost:3000",
            HTTP_REFERER="http://localhost:3000/login",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertEqual(login_res.data["username"], "approval_admin")


class BootstrapAdminCommandTests(TestCase):

    def test_bootstrap_admin_provisions_active_administrator_without_superuser(self):
        out = StringIO()
        call_command(
            "bootstrap_admin",
            "--username=initial_hms_admin",
            "--email=admin.bootstrap@pes.edu",
            "--password=AdminBootstrapPass!2026",
            "--first-name=Chief",
            "--last-name=WardenAdmin",
            stdout=out,
        )
        user = User.objects.get(username="initial_hms_admin")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password("AdminBootstrapPass!2026"))
        profile = RoleProfile.objects.get(user=user)
        self.assertEqual(profile.role, RoleProfile.Role.ADMINISTRATOR)
        self.assertTrue(
            AuditLog.objects.filter(
                user=user,
                action_type="CREATE",
                entity_type="RoleProfile",
                record_id=str(profile.pk),
            ).exists()
        )

    def test_bootstrap_admin_refuses_when_administrator_already_exists(self):
        existing_admin = User.objects.create_user(
            username="existing_admin",
            email="existing.admin@pes.edu",
            password="ExistingAdminPass!2026",
            is_active=True,
        )
        RoleProfile.objects.create(
            user=existing_admin,
            role=RoleProfile.Role.ADMINISTRATOR,
        )

        with self.assertRaisesMessage(
            CommandError,
            "An active HMS Administrator account already exists.",
        ):
            call_command(
                "bootstrap_admin",
                "--username=second_admin",
                "--email=second.admin@pes.edu",
                "--password=SecondAdminPass!2026",
            )
        self.assertFalse(User.objects.filter(username="second_admin").exists())

    def test_bootstrap_admin_refuses_when_username_already_exists_without_modifying(self):
        existing_user = User.objects.create_user(
            username="existing_warden",
            email="warden.orig@pes.edu",
            password="OriginalPassword!2026",
            is_active=False,
        )
        RoleProfile.objects.create(
            user=existing_user,
            role=RoleProfile.Role.WARDEN,
        )

        with self.assertRaisesMessage(
            CommandError,
            "Username 'existing_warden' already exists.",
        ):
            call_command(
                "bootstrap_admin",
                "--username=existing_warden",
                "--email=new.email@pes.edu",
                "--password=AttemptedNewPass!2026",
            )

        existing_user.refresh_from_db()
        self.assertEqual(existing_user.email, "warden.orig@pes.edu")
        self.assertFalse(existing_user.is_active)
        self.assertTrue(existing_user.check_password("OriginalPassword!2026"))
        self.assertEqual(existing_user.role_profile.role, RoleProfile.Role.WARDEN)

    def test_bootstrap_admin_refuses_when_email_already_exists_without_modifying(self):
        existing_user = User.objects.create_user(
            username="student_holder",
            email="shared.email@pes.edu",
            password="OriginalPassword!2026",
            is_active=True,
        )

        with self.assertRaisesMessage(
            CommandError,
            "Email 'shared.email@pes.edu' is already associated with an existing account.",
        ):
            call_command(
                "bootstrap_admin",
                "--username=brand_new_admin",
                "--email=shared.email@pes.edu",
                "--password=ValidBootstrapPass!2026",
            )

        self.assertFalse(User.objects.filter(username="brand_new_admin").exists())
        existing_user.refresh_from_db()
        self.assertTrue(existing_user.check_password("OriginalPassword!2026"))

    def test_bootstrap_admin_rejects_weak_password(self):
        with self.assertRaises(CommandError):
            call_command(
                "bootstrap_admin",
                "--username=weak_admin",
                "--email=weak@pes.edu",
                "--password=123",
            )
