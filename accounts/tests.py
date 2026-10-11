from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from students.models import Student
from .models import RoleProfile


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