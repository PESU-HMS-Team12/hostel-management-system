from django.test import TestCase

from .models import Hostel, Room

from django.contrib.auth import get_user_model
from django.urls import reverse

from accounts.models import RoleProfile
from allocations.models import Allocation
from auditlog.models import AuditLog
from students.models import Student


class HostelModelTests(TestCase):

    def test_hostel_creation(self):
        hostel = Hostel.objects.create(
            hostel_id="H001",
            name="Test Hostel",
            block_location="Block A",
            status="Active",
        )

        self.assertEqual(hostel.hostel_id, "H001")
        self.assertEqual(hostel.name, "Test Hostel")
        self.assertEqual(hostel.status, "Active")

    def test_room_creation(self):
        hostel = Hostel.objects.create(
            hostel_id="H002",
            name="Test Hostel 2",
            block_location="Block B",
            status="Active",
        )

        room = Room.objects.create(
            room_id="R001",
            hostel=hostel,
            room_no="101",
            room_type="Single",
            capacity=1,
            status="Available",
        )

        self.assertEqual(room.room_id, "R001")
        self.assertEqual(room.hostel, hostel)
        self.assertEqual(room.capacity, 1)

    def test_hostel_can_have_multiple_rooms(self):
        hostel = Hostel.objects.create(
            hostel_id="H003",
            name="Test Hostel 3",
            block_location="Block C",
            status="Active",
        )

        Room.objects.create(
            room_id="R002",
            hostel=hostel,
            room_no="201",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        Room.objects.create(
            room_id="R003",
            hostel=hostel,
            room_no="202",
            room_type="Triple",
            capacity=3,
            status="Available",
        )

        self.assertEqual(hostel.rooms.count(), 2)

    def test_room_capacity_is_stored(self):
        hostel = Hostel.objects.create(
            hostel_id="H004",
            name="Test Hostel 4",
            block_location="Block D",
            status="Active",
        )

        room = Room.objects.create(
            room_id="R004",
            hostel=hostel,
            room_no="301",
            room_type="Triple",
            capacity=3,
            status="Available",
        )

        self.assertEqual(room.capacity, 3)

    def test_hostel_string_representation(self):
        hostel = Hostel.objects.create(
            hostel_id="H005",
            name="String Hostel",
            block_location="Block E",
            status="Active",
        )

        self.assertEqual(str(hostel), "String Hostel")

    def test_room_string_representation(self):
        hostel = Hostel.objects.create(
            hostel_id="H006",
            name="Room Test Hostel",
            block_location="Block F",
            status="Active",
        )

        room = Room.objects.create(
            room_id="R005",
            hostel=hostel,
            room_no="401",
            room_type="Single",
            capacity=1,
            status="Available",
        )

        self.assertEqual(str(room), "Room Test Hostel - 401")


User = get_user_model()


class RoomUpdateTests(TestCase):
    def setUp(self):
        self.hostel = Hostel.objects.create(
            hostel_id="EDIT-H001",
            name="Editing Test Hostel",
            block_location="Block A",
            status="Active",
        )
        self.other_hostel = Hostel.objects.create(
            hostel_id="EDIT-H002",
            name="Other Test Hostel",
            block_location="Block B",
            status="Active",
        )
        self.room = Room.objects.create(
            room_id="EDIT-R001",
            hostel=self.hostel,
            room_no="101",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        self.warden = User.objects.create_user(
            username="room_edit_warden",
            password="TestPassword!482",
        )
        RoleProfile.objects.create(
            user=self.warden,
            role=RoleProfile.Role.WARDEN,
        )

        self.student_record = Student.objects.create(
            student_id="EDIT-STUDENT-001",
            name="Room Edit Student",
            contact="9999999999",
            course_program="Computer Science",
            year=2,
            status="Active",
        )
        self.student_user = User.objects.create_user(
            username="room_edit_student",
            password="TestPassword!482",
        )
        RoleProfile.objects.create(
            user=self.student_user,
            role=RoleProfile.Role.STUDENT,
            student=self.student_record,
        )

        self.url = reverse("room_update", args=[self.room.pk])

    def room_data(self, **overrides):
        data = {
            "room_id": self.room.room_id,
            "hostel_id": str(self.hostel.pk),
            "room_no": "101",
            "room_type": "Double",
            "capacity": "2",
            "status": "Available",
        }
        data.update(overrides)
        return data

    def test_warden_can_edit_room_and_update_is_audited(self):
        self.client.force_login(self.warden)

        response = self.client.post(
            self.url,
            self.room_data(room_type="Triple", capacity="3"),
        )

        self.assertRedirects(response, reverse("room_list"))
        self.room.refresh_from_db()
        self.assertEqual(self.room.room_type, "Triple")
        self.assertEqual(self.room.capacity, 3)
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.warden,
                action_type="UPDATE",
                entity_type="Room",
                record_id=self.room.room_id,
            ).exists()
        )

    def test_student_cannot_edit_room(self):
        self.client.force_login(self.student_user)

        response = self.client.post(
            self.url,
            self.room_data(room_type="Triple"),
        )

        self.assertEqual(response.status_code, 403)
        self.room.refresh_from_db()
        self.assertEqual(self.room.room_type, "Double")

    def test_duplicate_room_number_in_same_hostel_is_rejected(self):
        Room.objects.create(
            room_id="EDIT-R002",
            hostel=self.hostel,
            room_no="102",
            room_type="Single",
            capacity=1,
            status="Available",
        )
        self.client.force_login(self.warden)

        response = self.client.post(
            self.url,
            self.room_data(room_no="102"),
        )

        self.assertEqual(response.status_code, 200)
        self.room.refresh_from_db()
        self.assertEqual(self.room.room_no, "101")

    def test_capacity_cannot_be_reduced_below_active_occupancy(self):
        Allocation.objects.create(
            student=self.student_record,
            room=self.room,
            allocation_date="2026-10-01",
        )
        self.client.force_login(self.warden)

        response = self.client.post(
            self.url,
            self.room_data(capacity="0"),
        )

        self.assertEqual(response.status_code, 200)
        self.room.refresh_from_db()
        self.assertEqual(self.room.capacity, 2)
