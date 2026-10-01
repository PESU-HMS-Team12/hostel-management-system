# hostels/models.py
from django.db import models


class Hostel(models.Model):
    hostel_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    block_location = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return self.name


class Room(models.Model):
    room_id = models.CharField(max_length=20, unique=True)
    hostel = models.ForeignKey(
        Hostel,
        on_delete=models.CASCADE,
        related_name="rooms"
    )
    room_no = models.CharField(max_length=20)
    room_type = models.CharField(max_length=50)
    capacity = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default="Available")

    def __str__(self):
        return f"{self.hostel.name} - {self.room_no}"