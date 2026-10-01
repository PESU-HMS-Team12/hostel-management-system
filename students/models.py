from django.db import models


class Student(models.Model):
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    contact = models.CharField(max_length=20)
    course_program = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    status = models.CharField(max_length=20, default="Active")

    def __str__(self):
        return f"{self.student_id} - {self.name}"