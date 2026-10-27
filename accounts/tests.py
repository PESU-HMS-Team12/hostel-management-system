from django.conf import settings
from django.contrib.auth import get_user_model
from django.template import response
from django.test import TestCase
from django.urls import reverse

from students.models import Student
from .models import RoleProfile

from datetime import date

from allocations.models import Allocation
from hostels.models import Hostel, Room

User = get_user_model()


class AuthenticationTests(TestCase):

    def setUp(self):
        self.warden = User.objects.create_user(
            username="warden_test",
            email="warden@example.com",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

    def test_login_with_username(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "warden_test",
                "password": "TestPassword!482",
            },
        )

        self.assertRedirects(response, reverse("dashboard"))

    def test_login_with_email(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "warden@example.com",
                "password": "TestPassword!482",
            },
        )

        self.assertRedirects(response, reverse("dashboard"))

    def test_invalid_password_is_rejected(self):
        response = self.client.post(
            reverse("login"),
            {
                "username": "warden_test",
                "password": "WrongPassword!123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Invalid username/email or password.")

        self.assertNotIn("_auth_user_id", self.client.session)

    def test_user_without_role_cannot_log_in(self):
        unconfigured_user = User.objects.create_user(
            username="unconfigured_test",
            password="TestPassword!482",
        )

        response = self.client.post(
            reverse("login"),
            {
                "username": "unconfigured_test",
                "password": "TestPassword!482",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_logout_invalidates_session(self):
        self.client.force_login(self.warden)

        response = self.client.post(reverse("logout"))

        self.assertRedirects(response, reverse("login"))

        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

    def test_anonymous_user_cannot_access_dashboard(self):
        response = self.client.get(reverse("dashboard"))

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

    def test_session_timeout_is_configured(self):
        self.assertEqual(settings.SESSION_COOKIE_AGE, 1800)
        self.assertTrue(settings.SESSION_SAVE_EVERY_REQUEST)


class RoleAuthorizationTests(TestCase):

    def setUp(self):
        self.student_record = Student.objects.create(
            student_id="TEST-STUDENT-001",
            name="Student Test",
            contact="9999999999",
            course_program="Computer Science",
            year=2,
            status="Active",
        )

        self.student_user = User.objects.create_user(
            username="student_test",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=self.student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student_record,
        )

        self.warden = User.objects.create_user(
            username="warden_access_test",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.admin_user = User.objects.create_superuser(
            username="admin_access_test",
            email="admin@example.com",
            password="TestPassword!482",
        )

    def test_student_can_view_own_profile(self):
        self.client.force_login(self.student_user)

        response = self.client.get(reverse("my_profile"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "TEST-STUDENT-001")
        self.assertContains(response, "Student Test")
        self.assertIsNone(response.context["allocation"])
        self.assertContains(
            response,
            "You do not currently have an active room allocation.",
        )

    def test_student_profile_displays_current_allocation(self):
        hostel = Hostel.objects.create(
            hostel_id="PROFILE-H001",
            name="Profile Test Hostel",
            block_location="Profile Block",
        )

        room = Room.objects.create(
            room_id="PROFILE-R001",
            hostel=hostel,
            room_no="P101",
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
        response = self.client.get(reverse("my_profile"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
          response.context["allocation"].pk,
          allocation.pk,
        )
        self.assertContains(response, "Profile Test Hostel")
        self.assertContains(response, "P101")
        self.assertContains(response, "01 Oct 2026")
        self.assertContains(response, "02 Oct 2026")
        self.assertContains(response, "Active")

    def test_student_profile_does_not_show_completed_allocation_as_current(self):
        hostel = Hostel.objects.create(
            hostel_id="PROFILE-H002",
            name="Previous Hostel",
            block_location="Previous Block",
        )

        room = Room.objects.create(
            room_id="PROFILE-R002",
            hostel=hostel,
            room_no="P102",
            room_type="Single",
            capacity=1,
        )

        Allocation.objects.create(
            student=self.student_record,
            room=room,
            allocation_date=date(2026, 9, 1),
            check_in_date=date(2026, 9, 2),
            check_out_date=date(2026, 9, 10),
        )

        self.client.force_login(self.student_user)
        response = self.client.get(reverse("my_profile"))

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.context["allocation"])
        self.assertContains(
            response,
            "You do not currently have an active room allocation.",
        )
        self.assertNotContains(response, "Previous Hostel")
        self.assertNotContains(response, "P102")

    def test_student_cannot_access_staff_student_list(self):
        self.client.force_login(self.student_user)

        response = self.client.get(reverse("student_list"))

        self.assertEqual(response.status_code, 403)

    def test_student_cannot_access_hostel_management(self):
        self.client.force_login(self.student_user)

        response = self.client.get(reverse("hostel_list"))

        self.assertEqual(response.status_code, 403)

    def test_warden_can_access_student_list(self):
        self.client.force_login(self.warden)

        response = self.client.get(reverse("student_list"))

        self.assertEqual(response.status_code, 200)

    def test_superuser_has_administrator_role(self):
        from accounts.decorators import get_user_role

        self.assertEqual(
            get_user_role(self.admin_user),
            RoleProfile.Role.ADMINISTRATOR,
        )