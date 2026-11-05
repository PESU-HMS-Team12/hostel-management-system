from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection, connections
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import RoleProfile
from allocations.models import Allocation
from api.exceptions import custom_exception_handler
from api.permissions import (
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


class CustomExceptionHandlerTests(TestCase):

    def test_django_validation_error_is_structured(self):
        exc = DjangoValidationError({"field_name": ["This field is required."]})
        response = custom_exception_handler(exc, {})

        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Validation error.")
        self.assertIn("field_name", response.data["details"])
        self.assertEqual(response.data["status_code"], 400)


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
