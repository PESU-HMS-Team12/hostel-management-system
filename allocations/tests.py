from datetime import date

from django.core.exceptions import ValidationError
from django.test import TestCase

from allocations.models import Allocation
from hostels.models import Hostel, Room
from students.models import Student
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from accounts.models import RoleProfile

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

class AllocationWorkflowViewTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.hostel = Hostel.objects.create(
            hostel_id="WF-H001",
            name="Workflow Hostel",
            block_location="Block W",
        )

        self.room = Room.objects.create(
            room_id="WF-R001",
            hostel=self.hostel,
            room_no="W101",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        self.student = Student.objects.create(
            student_id="WF-S001",
            name="Workflow Student",
            contact="9999999999",
            course_program="CSE",
            year=2,
            status="Active",
        )

        self.warden = User.objects.create_user(
            username="workflow_warden",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.client.force_login(self.warden)

    def test_warden_can_view_allocation_list(self):
        response = self.client.get(reverse("allocation_list"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Room Allocations")

    def test_warden_can_create_allocation(self):
        today = timezone.localdate()

        response = self.client.post(
            reverse("allocation_create"),
            {
                "student": self.student.pk,
                "room": self.room.pk,
                "allocation_date": today.isoformat(),
                "check_in_date": today.isoformat(),
            },
        )

        self.assertRedirects(
            response,
            reverse("allocation_list"),
        )

        self.assertEqual(
            Allocation.objects.filter(
                student=self.student,
                room=self.room,
                check_out_date__isnull=True,
            ).count(),
            1,
        )

    def test_room_availability_shows_occupancy(self):
        Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=timezone.localdate(),
            check_in_date=timezone.localdate(),
        )

        response = self.client.get(reverse("room_availability"))

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "W101")
        self.assertContains(response, "Partially occupied")
        self.assertContains(response, "1")

    def test_student_cannot_access_allocation_list(self):
        User = get_user_model()

        student_user = User.objects.create_user(
            username="workflow_student",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student,
        )

        self.client.force_login(student_user)

        response = self.client.get(reverse("allocation_list"))

        self.assertEqual(response.status_code, 403)

    def test_anonymous_user_is_redirected_to_login(self):
        self.client.logout()

        response = self.client.get(reverse("allocation_list"))

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)

    def test_full_room_is_not_offered_for_allocation(self):
        self.room.capacity = 1
        self.room.save(update_fields=["capacity"])

        Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=timezone.localdate(),
        )

        response = self.client.get(reverse("allocation_create"))

        self.assertEqual(response.status_code, 200)

        form = response.context["form"]

        self.assertFalse(
            form.fields["room"].queryset.filter(pk=self.room.pk).exists()
        )
