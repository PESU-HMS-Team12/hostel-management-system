from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = (
        "timestamp",
        "user",
        "action_type",
        "entity_type",
        "record_id",
    )

    list_filter = (
        "action_type",
        "entity_type",
        "timestamp",
    )

    search_fields = (
        "record_id",
        "user__username",
    )