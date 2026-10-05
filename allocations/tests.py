from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from allocations.models import Allocation
from hostels.models import Hostel, Room
from students.models import Student


class AllocationValidationTests(TestCase):

    def setUp(self):
        self.hostel = Hostel.objects.create(
            hostel_id="H001",
            name="Test Hostel",
            block_location="Test Location",
        )

        self.room = Room.objects.create(
            room_id="R001",
            hostel=self.hostel,
            room_no="101",
            room_type="Single",
            capacity=2,
        )

        self.student1 = Student.objects.create(
            student_id="S001",
            name="Student One",
            contact="9876543210",
            course_program="CSE",
            year=1,
        )

        self.student2 = Student.objects.create(
            student_id="S002",
            name="Student Two",
            contact="9876543211",
            course_program="CSE",
            year=1,
        )

        self.student3 = Student.objects.create(
            student_id="S003",
            name="Student Three",
            contact="9876543212",
            course_program="CSE",
            year=1,
        )

    def create_allocation(self, student, room=None, check_out_date=None):
        return Allocation.objects.create(
            student=student,
            room=room or self.room,
            allocation_date=date(2026, 1, 1),
            check_in_date=date(2026, 1, 2),
            check_out_date=check_out_date,
        )

    def test_valid_allocation_is_allowed(self):
        allocation = self.create_allocation(self.student1)

        self.assertEqual(allocation.student, self.student1)
        self.assertEqual(allocation.room, self.room)

    def test_room_capacity_cannot_be_exceeded(self):
        self.create_allocation(self.student1)
        self.create_allocation(self.student2)

        with self.assertRaises(ValidationError):
            self.create_allocation(self.student3)

    def test_student_cannot_have_two_active_allocations(self):
        self.create_allocation(self.student1)

        with self.assertRaises(ValidationError):
            self.create_allocation(self.student1)

    def test_student_can_have_new_allocation_after_checkout(self):
        self.create_allocation(
            self.student1,
            check_out_date=date(2026, 1, 10),
        )

        allocation = self.create_allocation(self.student1)

        self.assertEqual(allocation.student, self.student1)

    def test_checked_out_allocation_does_not_count_towards_capacity(self):
        self.create_allocation(
            self.student1,
            check_out_date=date(2026, 1, 10),
        )

        self.create_allocation(self.student2)

        allocation = self.create_allocation(self.student3)

        self.assertEqual(allocation.student, self.student3)

    def test_checkout_before_checkin_is_rejected(self):
        with self.assertRaises(ValidationError):
            Allocation.objects.create(
                student=self.student1,
                room=self.room,
                allocation_date=date(2026, 1, 1),
                check_in_date=date(2026, 1, 10),
                check_out_date=date(2026, 1, 5),
            )
