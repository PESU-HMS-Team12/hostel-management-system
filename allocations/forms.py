from django import forms
from django.core.exceptions import ValidationError
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

        today = timezone.localdate()

        self.fields["allocation_date"].initial = today
        self.fields["check_in_date"].required = False

        # Only active students may receive new allocations.
        self.fields["student"].queryset = (
            Student.objects
            .filter(status="Active")
            .order_by("student_id")
        )

        # Only rooms in active hostels that are available and
        # have remaining capacity may be selected.
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

    def clean(self):
        cleaned_data = super().clean()

        student = cleaned_data.get("student")
        room = cleaned_data.get("room")
        allocation_date = cleaned_data.get("allocation_date")
        check_in_date = cleaned_data.get("check_in_date")

        today = timezone.localdate()

        # Prevent future allocation dates.
        if allocation_date and allocation_date > today:
            self.add_error(
                "allocation_date",
                "Allocation date cannot be in the future.",
            )

        # Prevent future check-in dates and check-ins before allocation.
        if check_in_date:
            if check_in_date > today:
                self.add_error(
                    "check_in_date",
                    "Check-in date cannot be in the future.",
                )

            if (
                allocation_date
                and check_in_date < allocation_date
            ):
                self.add_error(
                    "check_in_date",
                    "Check-in date cannot be before the allocation date.",
                )

        # Recheck student eligibility and active allocation status.
        # The model also validates duplicate active allocations.
        if student:
            if student.status != "Active":
                self.add_error(
                    "student",
                    "Only active students can receive an allocation.",
                )

            existing_allocation = Allocation.objects.filter(
                student=student,
                check_out_date__isnull=True,
            )

            if self.instance.pk:
                existing_allocation = existing_allocation.exclude(
                    pk=self.instance.pk
                )

            if existing_allocation.exists():
                self.add_error(
                    "student",
                    "This student already has an active allocation.",
                )

        # Recheck room eligibility and occupancy.
        # This provides a friendly form error; model validation remains
        # necessary because room occupancy can change after form loading.
        if room:
            if room.status != "Available":
                self.add_error(
                    "room",
                    "The selected room is not available.",
                )

            if room.hostel.status != "Active":
                self.add_error(
                    "room",
                    "The selected room belongs to an inactive hostel.",
                )

            active_occupancy = Allocation.objects.filter(
                room=room,
                check_out_date__isnull=True,
            )

            if self.instance.pk:
                active_occupancy = active_occupancy.exclude(
                    pk=self.instance.pk
                )

            if active_occupancy.count() >= room.capacity:
                self.add_error(
                    "room",
                    "The selected room has reached its capacity.",
                )

        return cleaned_data


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

        # Exclude the current room and offer only eligible destinations.
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
        new_room = cleaned_data.get("new_room")

        today = timezone.localdate()

        if transfer_date:
            if transfer_date > today:
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

        # Revalidate the target room in case its state changed
        # after the form was initially displayed.
        if new_room:
            if new_room.status != "Available":
                self.add_error(
                    "new_room",
                    "The destination room is not available.",
                )

            if new_room.hostel.status != "Active":
                self.add_error(
                    "new_room",
                    "The destination room belongs to an inactive hostel.",
                )

            active_occupancy = Allocation.objects.filter(
                room=new_room,
                check_out_date__isnull=True,
            )

            if active_occupancy.count() >= new_room.capacity:
                self.add_error(
                    "new_room",
                    "The destination room has reached its capacity.",
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
            today = timezone.localdate()

            if checkout_date > today:
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

                self.add_error(
                    "checkout_date",
                    error_message,
                )

            # Prevent changing the checkout date through a repeated
            # vacation submission if the allocation is already closed.
            if self.allocation.check_out_date is not None:
                self.add_error(
                    "checkout_date",
                    "This allocation has already been checked out.",
                )

        return cleaned_data
