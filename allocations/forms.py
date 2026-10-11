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

class TransferAllocationForm(forms.Form):
    new_room = forms.ModelChoiceField(
        queryset=Room.objects.none(),
        label="Destination room",
        empty_label="Select a destination room",
    )

    transfer_date = forms.DateField(
        label="Transfer date",
        widget=forms.DateInput(attrs={"type": "date"}),
    )

    def __init__(self, *args, allocation, **kwargs):
        super().__init__(*args, **kwargs)
        self.allocation = allocation

        self.fields["transfer_date"].initial = timezone.localdate()

        # Show only available rooms in active hostels that have capacity.
        # The room the student currently occupies is not a transfer target.
        self.fields["new_room"].queryset = (
            Room.objects
            .filter(
                status="Available",
                hostel__status="Active",
            )
            .exclude(pk=allocation.room_id)
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

    def clean(self):
        cleaned_data = super().clean()
        transfer_date = cleaned_data.get("transfer_date")

        if transfer_date:
            if transfer_date > timezone.localdate():
                self.add_error(
                    "transfer_date",
                    "Transfer date cannot be in the future.",
                )

            earliest_date = (
                self.allocation.check_in_date
                or self.allocation.allocation_date
            )

            if transfer_date < earliest_date:
                self.add_error(
                    "transfer_date",
                    "Transfer date cannot be before the current "
                    "allocation's start date.",
                )

        return cleaned_data


class VacationAllocationForm(forms.Form):
    checkout_date = forms.DateField(
        label="Check-out date",
        widget=forms.DateInput(attrs={"type": "date"}),
    )

    def __init__(self, *args, allocation, **kwargs):
        super().__init__(*args, **kwargs)
        self.allocation = allocation

        self.fields["checkout_date"].initial = timezone.localdate()

    def clean(self):
        cleaned_data = super().clean()
        checkout_date = cleaned_data.get("checkout_date")

        if checkout_date:
            if checkout_date > timezone.localdate():
                self.add_error(
                    "checkout_date",
                    "Check-out date cannot be in the future.",
                )

            earliest_date = (
                self.allocation.check_in_date
                or self.allocation.allocation_date
            )

            if checkout_date < earliest_date:
                if self.allocation.check_in_date:
                    error_message = (
                        "Check-out date cannot be before check-in date."
                    )
                else:
                    error_message = (
                        "Check-out date cannot be before allocation date."
                    )

                self.add_error("checkout_date", error_message)

        return cleaned_data