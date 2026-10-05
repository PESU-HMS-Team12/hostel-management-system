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
        # Check-out cannot happen before check-in.
        if (
            self.check_in_date
            and self.check_out_date
            and self.check_out_date < self.check_in_date
        ):
            raise ValidationError(
                "Check-out date cannot be before check-in date."
            )

        # Only active allocations count towards room capacity.
        active_room_allocations = Allocation.objects.filter(
            room=self.room,
            check_out_date__isnull=True,
        ).exclude(pk=self.pk)

        if (
            self.check_out_date is None
            and active_room_allocations.count() >= self.room.capacity
        ):
            raise ValidationError(
                "Room capacity has been reached."
            )

        # A student may have only one active allocation.
        active_student_allocation = Allocation.objects.filter(
            student=self.student,
            check_out_date__isnull=True,
        ).exclude(pk=self.pk)

        if (
            self.check_out_date is None
            and active_student_allocation.exists()
        ):
            raise ValidationError(
                "Student already has an active room allocation."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.student.student_id} - {self.room.room_id}"