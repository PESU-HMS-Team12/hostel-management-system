from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from accounts.models import RoleProfile
from allocations.models import Allocation
from auditlog.models import AuditLog
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

    # HMS-24: Allocation history search and filtering tests.

    def test_allocation_history_search_by_student_id(self):
        Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=date(2026, 1, 1),
            check_in_date=date(2026, 1, 2),
        )

        response = self.client.get(
            reverse("allocation_list"),
            {"q": self.student.student_id, "status": "all"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.student.student_id)
        self.assertContains(response, self.student.name)

    def test_allocation_history_active_filter(self):
        active_allocation = Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=date(2026, 1, 1),
            check_in_date=date(2026, 1, 2),
        )

        completed_student = Student.objects.create(
            student_id="WF-S002",
            name="Completed History Student",
            contact="9999999998",
            course_program="CSE",
            year=2,
            status="Active",
        )

        Allocation.objects.create(
            student=completed_student,
            room=self.room,
            allocation_date=date(2025, 12, 1),
            check_in_date=date(2025, 12, 2),
            check_out_date=date(2025, 12, 10),
        )

        response = self.client.get(
            reverse("allocation_list"),
            {"status": "active"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, active_allocation.student.student_id)
        self.assertNotContains(response, completed_student.student_id)

    def test_allocation_history_completed_filter(self):
        completed_student = Student.objects.create(
            student_id="WF-S003",
            name="Completed Student",
            contact="9999999997",
            course_program="CSE",
            year=2,
            status="Active",
        )

        Allocation.objects.create(
            student=completed_student,
            room=self.room,
            allocation_date=date(2025, 12, 1),
            check_in_date=date(2025, 12, 2),
            check_out_date=date(2025, 12, 10),
        )

        Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=date(2026, 1, 1),
            check_in_date=date(2026, 1, 2),
        )

        response = self.client.get(
            reverse("allocation_list"),
            {"status": "completed"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, completed_student.student_id)
        self.assertNotContains(response, self.student.student_id)

    def test_allocation_history_all_filter(self):
        completed_student = Student.objects.create(
            student_id="WF-S004",
            name="Historical Student",
            contact="9999999996",
            course_program="CSE",
            year=2,
            status="Active",
        )

        Allocation.objects.create(
            student=self.student,
            room=self.room,
            allocation_date=date(2026, 1, 1),
            check_in_date=date(2026, 1, 2),
        )

        Allocation.objects.create(
            student=completed_student,
            room=self.room,
            allocation_date=date(2025, 12, 1),
            check_in_date=date(2025, 12, 2),
            check_out_date=date(2025, 12, 10),
        )

        response = self.client.get(
            reverse("allocation_list"),
            {"status": "all"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.student.student_id)
        self.assertContains(response, completed_student.student_id)

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


class AllocationTransferVacationViewTests(TestCase):

    def setUp(self):
        User = get_user_model()

        self.hostel = Hostel.objects.create(
            hostel_id="TV-H001",
            name="Transfer Vacation Hostel",
            block_location="Block TV",
            status="Active",
        )

        self.source_room = Room.objects.create(
            room_id="TV-R001",
            hostel=self.hostel,
            room_no="TV101",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        self.target_room = Room.objects.create(
            room_id="TV-R002",
            hostel=self.hostel,
            room_no="TV102",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        self.student = Student.objects.create(
            student_id="TV-S001",
            name="Transfer Vacation Student",
            contact="9888888888",
            course_program="CSE",
            year=2,
            status="Active",
        )

        self.warden = User.objects.create_user(
            username="transfer_vacation_warden",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.client.force_login(self.warden)

    def create_active_allocation(self, student=None, room=None):
        start_date = timezone.localdate() - timedelta(days=3)

        return Allocation.objects.create(
            student=student or self.student,
            room=room or self.source_room,
            allocation_date=start_date,
            check_in_date=start_date,
        )

    def test_warden_can_transfer_active_allocation(self):
        allocation = self.create_active_allocation()
        today = timezone.localdate()

        response = self.client.post(
            reverse(
                "allocation_transfer",
                kwargs={"allocation_id": allocation.pk},
            ),
            {
                "new_room": self.target_room.pk,
                "transfer_date": today.isoformat(),
            },
        )

        self.assertRedirects(
            response,
            reverse("allocation_list"),
        )

        allocation.refresh_from_db()
        self.assertEqual(allocation.check_out_date, today)

        active_allocation = Allocation.objects.get(
            student=self.student,
            check_out_date__isnull=True,
        )

        self.assertEqual(active_allocation.room, self.target_room)
        self.assertEqual(active_allocation.check_in_date, today)

        # The original allocation remains in the database.
        self.assertEqual(
            Allocation.objects.filter(student=self.student).count(),
            2,
        )

        # The transfer records both the old and new allocation changes.
        logs = AuditLog.objects.filter(entity_type="Allocation")

        self.assertEqual(logs.count(), 2)
        self.assertSetEqual(
            set(logs.values_list("action_type", flat=True)),
            {"UPDATE", "CREATE"},
        )

    def test_warden_can_vacate_active_allocation(self):
        allocation = self.create_active_allocation()
        today = timezone.localdate()

        response = self.client.post(
            reverse(
                "allocation_vacate",
                kwargs={"allocation_id": allocation.pk},
            ),
            {"checkout_date": today.isoformat()},
        )

        self.assertRedirects(
            response,
            reverse("allocation_list"),
        )

        allocation.refresh_from_db()

        self.assertEqual(allocation.check_out_date, today)
        self.assertFalse(
            Allocation.objects.filter(
                student=self.student,
                check_out_date__isnull=True,
            ).exists()
        )

        self.assertTrue(
            AuditLog.objects.filter(
                action_type="UPDATE",
                entity_type="Allocation",
                record_id=str(allocation.pk),
            ).exists()
        )

    def test_vacation_rejects_checkout_before_checkin(self):
        allocation = self.create_active_allocation()
        invalid_date = allocation.check_in_date - timedelta(days=1)

        response = self.client.post(
            reverse(
                "allocation_vacate",
                kwargs={"allocation_id": allocation.pk},
            ),
            {"checkout_date": invalid_date.isoformat()},
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            "Check-out date cannot be before check-in date.",
        )

        allocation.refresh_from_db()
        self.assertIsNone(allocation.check_out_date)

    def test_transfer_does_not_close_allocation_if_target_is_full(self):
        allocation = self.create_active_allocation()

        # Make the target room full.
        self.target_room.capacity = 1
        self.target_room.save(update_fields=["capacity"])

        other_student = Student.objects.create(
            student_id="TV-S002",
            name="Other Student",
            contact="9777777777",
            course_program="CSE",
            year=2,
            status="Active",
        )

        self.create_active_allocation(
            student=other_student,
            room=self.target_room,
        )

        today = timezone.localdate()

        response = self.client.post(
            reverse(
                "allocation_transfer",
                kwargs={"allocation_id": allocation.pk},
            ),
            {
                "new_room": self.target_room.pk,
                "transfer_date": today.isoformat(),
            },
        )

        self.assertEqual(response.status_code, 200)

        # Failed transfer must leave the old allocation active.
        allocation.refresh_from_db()
        self.assertIsNone(allocation.check_out_date)

        self.assertEqual(
            Allocation.objects.filter(
                student=self.student,
            ).count(),
            1,
        )

    def test_student_cannot_transfer_or_vacate_allocations(self):
        allocation = self.create_active_allocation()
        User = get_user_model()

        student_user = User.objects.create_user(
            username="transfer_vacation_student",
            password="TestPassword!482",
        )

        RoleProfile.objects.create(
            user=student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student,
        )

        self.client.force_login(student_user)

        transfer_response = self.client.get(
            reverse(
                "allocation_transfer",
                kwargs={"allocation_id": allocation.pk},
            )
        )

        vacation_response = self.client.get(
            reverse(
                "allocation_vacate",
                kwargs={"allocation_id": allocation.pk},
            )
        )

        self.assertEqual(transfer_response.status_code, 403)
        self.assertEqual(vacation_response.status_code, 403)

    def test_anonymous_user_must_log_in_before_transfer(self):
        allocation = self.create_active_allocation()
        self.client.logout()

        response = self.client.get(
            reverse(
                "allocation_transfer",
                kwargs={"allocation_id": allocation.pk},
            )
        )

        self.assertEqual(response.status_code, 302)
        self.assertIn("/accounts/login/", response.url)