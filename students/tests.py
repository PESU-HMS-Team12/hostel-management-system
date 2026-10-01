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