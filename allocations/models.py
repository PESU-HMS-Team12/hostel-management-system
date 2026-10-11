from django.core.exceptions import ValidationError
from django.db import models

from hostels.models import Room
from students.models import Student


class Allocation(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="allocations",
    )
    room = models.ForeignKey(
        Room,
        on_delete=models.CASCADE,
        related_name="allocations",
    )
    allocation_date = models.DateField()
    check_in_date = models.DateField(null=True, blank=True)
    check_out_date = models.DateField(null=True, blank=True)

    def clean(self):
        errors = {}

        if (
            self.check_in_date
            and self.check_out_date
            and self.check_out_date < self.check_in_date
        ):
            errors["check_out_date"] = (
                "Check-out date cannot be before check-in date."
            )

        if self.room_id and self.check_out_date is None:
            active_room_allocations = Allocation.objects.filter(
                room_id=self.room_id,
                check_out_date__isnull=True,
            ).exclude(pk=self.pk)

            if active_room_allocations.count() >= self.room.capacity:
                errors["room"] = "Room capacity has been reached."

        if self.student_id and self.check_out_date is None:
            active_student_allocation = Allocation.objects.filter(
                student_id=self.student_id,
                check_out_date__isnull=True,
            ).exclude(pk=self.pk)

            if active_student_allocation.exists():
                errors["student"] = (
                    "Student already has an active room allocation."
                )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.student_id} - {self.room.room_id}"