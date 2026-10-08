from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    ACTION_CHOICES = [
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    action_type = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
    )

    entity_type = models.CharField(max_length=50)

    record_id = models.CharField(max_length=100)

    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action_type} {self.entity_type} {self.record_id}"
