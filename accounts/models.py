from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class RoleProfile(models.Model):

    class Role(models.TextChoices):
        STUDENT = "STUDENT", "Student"
        WARDEN = "WARDEN", "Warden"
        ADMINISTRATOR = "ADMINISTRATOR", "Administrator"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="role_profile",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
    )

    student = models.OneToOneField(
        "students.Student",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="account_profile",
    )

    def clean(self):
        errors = {}

        if self.role == self.Role.STUDENT and not self.student_id:
            errors["student"] = (
                "A student account must be linked to a student record."
            )

        if self.role != self.Role.STUDENT and self.student_id:
            errors["student"] = (
                "Only Student role profiles can be linked to a student record."
            )

        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.get_username()} - {self.get_role_display()}"