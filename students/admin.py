from django.contrib import admin
from .models import Student


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_id", "name", "course_program", "year", "status")
    search_fields = ("student_id", "name", "course_program")
    list_filter = ("year", "status")