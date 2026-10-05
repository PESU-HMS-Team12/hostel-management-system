from django.test import TestCase
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