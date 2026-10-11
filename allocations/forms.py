from django import forms
from django.db.models import Count, F, Q
from django.utils import timezone

from hostels.models import Room
from students.models import Student

from .models import Allocation


class AllocationForm(forms.ModelForm):

    class Meta:
        model = Allocation
        fields = [
            "student",
            "room",
            "allocation_date",
            "check_in_date",
        ]
        widgets = {
            "allocation_date": forms.DateInput(
                attrs={"type": "date"}
            ),
            "check_in_date": forms.DateInput(
                attrs={"type": "date"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["allocation_date"].initial = timezone.localdate()
        self.fields["check_in_date"].required = False

        # Only active students can receive a new allocation.
        self.fields["student"].queryset = (
            Student.objects
            .filter(status="Active")
            .order_by("student_id")
        )

        # Only active-hostel rooms that are Available and below
        # their configured capacity are offered for allocation.
        self.fields["room"].queryset = (
            Room.objects
            .filter(
                status="Available",
                hostel__status="Active",
            )
            .annotate(
                active_occupancy=Count(
                    "allocations",
                    filter=Q(
                        allocations__check_out_date__isnull=True
                    ),
                )
            )
            .filter(active_occupancy__lt=F("capacity"))
            .select_related("hostel")
            .order_by("hostel__name", "room_no")
        )