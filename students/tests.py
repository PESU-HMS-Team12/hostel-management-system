from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from accounts.models import RoleProfile
from auditlog.models import AuditLog
from .models import Student


class StudentModelTests(TestCase):
    def test_student_creation(self):
        student = Student.objects.create(
            student_id="TEST001",
            name="Test Student",
            contact="9999999999",
            course_program="Computer Science",
            year=2,
            status="Active",
        )

        self.assertEqual(student.student_id, "TEST001")
        self.assertEqual(student.name, "Test Student")

    def test_student_id_is_unique(self):
        Student.objects.create(
            student_id="TEST002",
            name="Student One",
            contact="9999999999",
            course_program="Computer Science",
            year=2,
            status="Active",
        )

        with self.assertRaises(Exception):
            Student.objects.create(
                student_id="TEST002",
                name="Student Two",
                contact="8888888888",
                course_program="Computer Science",
                year=2,
                status="Active",
            )

    def test_student_default_status_is_active(self):
        student = Student.objects.create(
            student_id="TEST003",
            name="Default Status Student",
            contact="7777777777",
            course_program="Computer Science",
            year=1,
        )

        self.assertEqual(student.status, "Active")

    def test_student_string_representation(self):
        student = Student.objects.create(
            student_id="TEST004",
            name="String Student",
            contact="6666666666",
            course_program="Computer Science",
            year=2,
            status="Active",
        )

        self.assertEqual(str(student), "TEST004 - String Student")


class StudentWorkflowViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        user_model = get_user_model()
        cls.warden = user_model.objects.create_user(username="student_view_warden")
        RoleProfile.objects.create(user=cls.warden, role=RoleProfile.Role.WARDEN)

    def setUp(self):
        self.client.force_login(self.warden)

    def make_student(self, student_id, name, course="Computer Science", status="Active"):
        return Student.objects.create(
            student_id=student_id,
            name=name,
            contact="9876543210",
            course_program=course,
            year=2,
            status=status,
        )

    def test_student_list_search_and_status_filters(self):
        self.make_student("VIEW-001", "Asha Rao", status="Active")
        self.make_student("VIEW-002", "Bala Das", course="Electronics", status="Inactive")

        all_students = self.client.get(reverse("student_list"))
        self.assertEqual(all_students.status_code, 200)
        self.assertEqual(len(all_students.context["students"]), 2)

        by_name = self.client.get(reverse("student_list"), {"q": "Asha"})
        self.assertEqual([s.student_id for s in by_name.context["students"]], ["VIEW-001"])

        by_course = self.client.get(reverse("student_list"), {"q": "Electronics"})
        self.assertEqual([s.student_id for s in by_course.context["students"]], ["VIEW-002"])

        inactive = self.client.get(reverse("student_list"), {"status": "Inactive"})
        self.assertEqual([s.student_id for s in inactive.context["students"]], ["VIEW-002"])

    def test_student_create_get_validation_and_audit(self):
        url = reverse("student_create")
        self.assertEqual(self.client.get(url).status_code, 200)

        invalid = self.client.post(url, {"student_id": "VIEW-003"})
        self.assertEqual(invalid.status_code, 200)
        self.assertFalse(Student.objects.filter(student_id="VIEW-003").exists())

        response = self.client.post(
            url,
            {
                "student_id": "VIEW-003",
                "name": "Chitra Sen",
                "contact": "9876543211",
                "course_program": "Computer Science",
                "year": 3,
                "status": "Active",
            },
        )
        self.assertRedirects(response, reverse("student_list"))
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.warden,
                action_type="CREATE",
                entity_type="Student",
                record_id="VIEW-003",
            ).exists()
        )

    def test_student_detail_and_update_validation_and_audit(self):
        student = self.make_student("VIEW-004", "Dev Iyer")
        self.assertEqual(
            self.client.get(reverse("student_detail", args=[student.pk])).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(reverse("student_detail", args=[99999])).status_code,
            404,
        )

        url = reverse("student_update", args=[student.pk])
        self.assertEqual(self.client.get(url).status_code, 200)
        invalid = self.client.post(url, {"student_id": student.student_id})
        self.assertEqual(invalid.status_code, 200)
        student.refresh_from_db()
        self.assertEqual(student.name, "Dev Iyer")

        response = self.client.post(
            url,
            {
                "student_id": student.student_id,
                "name": "Dev Iyer Updated",
                "contact": student.contact,
                "course_program": student.course_program,
                "year": student.year,
                "status": student.status,
            },
        )
        self.assertRedirects(
            response,
            reverse("student_detail", args=[student.pk]),
        )
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.warden,
                action_type="UPDATE",
                entity_type="Student",
                record_id=student.student_id,
            ).exists()
        )

    def test_student_deactivation_changes_status_only_on_post_and_is_audited(self):
        student = self.make_student("VIEW-005", "Esha Nair")
        url = reverse("student_deactivate", args=[student.pk])

        self.assertRedirects(
            self.client.get(url),
            reverse("student_detail", args=[student.pk]),
        )
        student.refresh_from_db()
        self.assertEqual(student.status, "Active")

        self.assertRedirects(
            self.client.post(url),
            reverse("student_detail", args=[student.pk]),
        )
        student.refresh_from_db()
        self.assertEqual(student.status, "Inactive")
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.warden,
                action_type="UPDATE",
                entity_type="Student",
                record_id=student.student_id,
            ).exists()
        )
