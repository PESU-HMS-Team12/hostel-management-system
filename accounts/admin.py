from django.contrib import admin

from .models import RoleProfile
from auditlog.services import create_audit_log


@admin.register(RoleProfile)
class RoleProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "role",
        "student",
    )

    list_filter = (
        "role",
    )

    search_fields = (
        "user__username",
        "user__email",
        "student__student_id",
        "student__name",
    )

    def save_model(self, request, obj, form, change):
        should_log = not change or bool(
            {"role", "student"}.intersection(form.changed_data)
        )

        super().save_model(request, obj, form, change)

        if should_log:
            create_audit_log(
                request.user,
                "UPDATE" if change else "CREATE",
                "RoleProfile",
                obj.pk,
            )
