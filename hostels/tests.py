from django.test import TestCase
from .models import Hostel, Room


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
        self.assertEqual(hostel.block_location, "Block A")
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
        self.assertEqual(room.room_no, "101")
        self.assertEqual(room.room_type, "Single")
        self.assertEqual(room.capacity, 1)
        self.assertEqual(room.status, "Available")

    def test_room_belongs_to_hostel(self):
        hostel = Hostel.objects.create(
            hostel_id="H003",
            name="Test Hostel 3",
            block_location="Block C",
            status="Active",
        )

        room = Room.objects.create(
            room_id="R002",
            hostel=hostel,
            room_no="202",
            room_type="Double",
            capacity=2,
            status="Available",
        )

        self.assertIn(room, hostel.rooms.all())

    def test_room_capacity_is_stored_correctly(self):
        hostel = Hostel.objects.create(
            hostel_id="H004",
            name="Test Hostel 4",
            block_location="Block D",
            status="Active",
        )

        room = Room.objects.create(
            room_id="R003",
            hostel=hostel,
            room_no="303",
            room_type="Triple",
            capacity=3,
            status="Available",
        )

        self.assertEqual(room.capacity, 3)