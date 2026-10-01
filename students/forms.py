from django import forms
from .models import Student


class StudentForm(forms.ModelForm):
    class Meta:
        model = Student
        fields = [
            "student_id",
            "name",
            "contact",
            "course_program",
            "year",
            "status",
        ]

    def clean_student_id(self):
        student_id = self.cleaned_data["student_id"].strip()

        if not student_id:
            raise forms.ValidationError("Student ID is required.")

        return student_id