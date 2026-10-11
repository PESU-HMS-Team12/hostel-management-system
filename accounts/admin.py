from django.contrib import admin

from .models import RoleProfile


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