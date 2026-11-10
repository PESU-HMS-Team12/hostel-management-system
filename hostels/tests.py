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

    def test_administrator_can_edit_room(self):
        administrator = User.objects.create_superuser(
            username="room_edit_admin",
            email="room-admin@example.com",
            password="TestPassword!482",
        )
        self.client.force_login(administrator)

        response = self.client.post(
            self.url,
            self.room_data(room_type="Triple", capacity="3"),
        )

        self.assertRedirects(response, reverse("room_list"))
        self.room.refresh_from_db()
        self.assertEqual(self.room.room_type, "Triple")
        self.assertEqual(self.room.capacity, 3)

    def test_zero_capacity_is_rejected(self):
        self.client.force_login(self.warden)

        response = self.client.post(self.url, self.room_data(capacity="0"))

        self.assertEqual(response.status_code, 200)
        self.room.refresh_from_db()
        self.assertEqual(self.room.capacity, 2)

    def test_capacity_cannot_be_reduced_below_positive_active_occupancy(self):
        second_student = Student.objects.create(
            student_id="EDIT-STUDENT-002",
            name="Second Room Edit Student",
            contact="8888888888",
            course_program="Computer Science",
            year=2,
            status="Active",
        )
        Allocation.objects.create(
            student=self.student_record,
            room=self.room,
            allocation_date="2026-10-01",
        )
        Allocation.objects.create(
            student=second_student,
            room=self.room,
            allocation_date="2026-10-02",
        )
        self.client.force_login(self.warden)

        response = self.client.post(self.url, self.room_data(capacity="1"))

        self.assertEqual(response.status_code, 200)
        self.room.refresh_from_db()
        self.assertEqual(self.room.capacity, 2)

    def test_room_edit_preserves_existing_allocation_history(self):
        allocation = Allocation.objects.create(
            student=self.student_record,
            room=self.room,
            allocation_date="2026-10-01",
        )
        self.client.force_login(self.warden)

        response = self.client.post(
            self.url,
            self.room_data(room_type="Triple", capacity="3"),
        )

        self.assertRedirects(response, reverse("room_list"))
        allocation.refresh_from_db()
        self.assertEqual(allocation.room_id, self.room.pk)
        self.assertEqual(allocation.student_id, self.student_record.pk)
        self.assertEqual(str(allocation.allocation_date), "2026-10-01")
        self.assertIsNone(allocation.check_out_date)

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


class HostelAndRoomWorkflowViewTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.warden = User.objects.create_user(username="hostel_workflow_warden")
        RoleProfile.objects.create(user=cls.warden, role=RoleProfile.Role.WARDEN)
        cls.hostel = Hostel.objects.create(
            hostel_id="WORKFLOW-H-01",
            name="Workflow Hostel",
            block_location="North Block",
            status="Active",
        )
        cls.inactive_hostel = Hostel.objects.create(
            hostel_id="WORKFLOW-H-02",
            name="Inactive Hostel",
            block_location="South Block",
            status="Inactive",
        )
        cls.room = Room.objects.create(
            room_id="WORKFLOW-R-01",
            hostel=cls.hostel,
            room_no="101",
            room_type="Double",
            capacity=2,
            status="Available",
        )

    def setUp(self):
        self.client.force_login(self.warden)

    def test_hostel_create_validation_duplicate_and_success(self):
        url = reverse("hostel_create")
        self.assertEqual(self.client.get(url).status_code, 200)

        missing = self.client.post(url, {"hostel_id": ""})
        self.assertEqual(missing.status_code, 200)

        duplicate = self.client.post(
            url,
            {
                "hostel_id": self.hostel.hostel_id,
                "name": "Duplicate",
                "block_location": "North",
            },
        )
        self.assertEqual(duplicate.status_code, 200)

        response = self.client.post(
            url,
            {
                "hostel_id": "WORKFLOW-H-03",
                "name": "New Hostel",
                "block_location": "East Block",
            },
        )
        created = Hostel.objects.get(hostel_id="WORKFLOW-H-03")
        self.assertRedirects(response, reverse("hostel_detail", args=[created.pk]))
        self.assertEqual(created.status, "Active")

    def test_hostel_list_detail_and_update_validation(self):
        self.assertEqual(self.client.get(reverse("hostel_list")).status_code, 200)
        self.assertEqual(
            self.client.get(reverse("hostel_detail", args=[self.hostel.pk])).status_code,
            200,
        )
        self.assertEqual(
            self.client.get(reverse("hostel_detail", args=[99999])).status_code,
            404,
        )

        url = reverse("hostel_update", args=[self.hostel.pk])
        self.assertEqual(self.client.get(url).status_code, 200)
        invalid = self.client.post(
            url,
            {"name": "", "block_location": "North Block", "status": "Active"},
        )
        self.assertEqual(invalid.status_code, 200)
        self.hostel.refresh_from_db()
        self.assertEqual(self.hostel.name, "Workflow Hostel")

        response = self.client.post(
            url,
            {
                "name": "Workflow Hostel Updated",
                "block_location": "West Block",
                "status": "Inactive",
            },
        )
        self.assertRedirects(response, reverse("hostel_detail", args=[self.hostel.pk]))
        self.hostel.refresh_from_db()
        self.assertEqual(self.hostel.status, "Inactive")

    def test_room_list_and_create_validation_and_audit(self):
        self.assertEqual(self.client.get(reverse("room_list")).status_code, 200)
        url = reverse("room_create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.context["hostels"]), [self.hostel])

        missing = self.client.post(url, {"room_id": ""})
        self.assertEqual(missing.status_code, 200)

        invalid_capacity = self.client.post(
            url,
            {
                "room_id": "WORKFLOW-R-02",
                "room_no": "102",
                "room_type": "Single",
                "capacity": "not-a-number",
                "hostel_id": self.hostel.pk,
            },
        )
        self.assertEqual(invalid_capacity.status_code, 200)

        duplicate_id = self.client.post(
            url,
            {
                "room_id": self.room.room_id,
                "room_no": "102",
                "room_type": "Single",
                "capacity": "1",
                "hostel_id": self.hostel.pk,
            },
        )
        self.assertEqual(duplicate_id.status_code, 200)

        inactive_hostel = self.client.post(
            url,
            {
                "room_id": "WORKFLOW-R-03",
                "room_no": "103",
                "room_type": "Single",
                "capacity": "1",
                "hostel_id": self.inactive_hostel.pk,
            },
        )
        self.assertEqual(inactive_hostel.status_code, 404)

        response = self.client.post(
            url,
            {
                "room_id": "WORKFLOW-R-04",
                "room_no": "104",
                "room_type": "Single",
                "capacity": "1",
                "hostel_id": self.hostel.pk,
            },
        )
        self.assertRedirects(response, reverse("room_list"))
        self.assertTrue(
            AuditLog.objects.filter(
                user=self.warden,
                action_type="CREATE",
                entity_type="Room",
                record_id="WORKFLOW-R-04",
            ).exists()
        )
