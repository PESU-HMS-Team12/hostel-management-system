from django.contrib import messages
from django.shortcuts import get_object_or_404, redirect, render

from .forms import StudentForm
from .models import Student


def student_list(request):
    students = Student.objects.all().order_by("student_id")

    query = request.GET.get("q", "").strip()
    status = request.GET.get("status", "").strip()

    if query:
        students = students.filter(
            student_id__icontains=query
        ) | students.filter(
            name__icontains=query
        ) | students.filter(
            course_program__icontains=query
        )

    if status:
        students = students.filter(status=status)

    return render(
        request,
        "students/student_list.html",
        {
            "students": students,
            "query": query,
            "selected_status": status,
        },
    )


def student_detail(request, student_id):
    student = get_object_or_404(Student, id=student_id)

    return render(
        request,
        "students/student_detail.html",
        {"student": student},
    )


def student_create(request):
    if request.method == "POST":
        form = StudentForm(request.POST)

        if form.is_valid():
            form.save()
            messages.success(request, "Student created successfully.")
            return redirect("student_list")
    else:
        form = StudentForm()

    return render(
        request,
        "students/student_form.html",
        {
            "form": form,
            "title": "Add Student",
        },
    )


def student_update(request, student_id):
    student = get_object_or_404(Student, id=student_id)

    if request.method == "POST":
        form = StudentForm(request.POST, instance=student)

        if form.is_valid():
            form.save()
            messages.success(request, "Student updated successfully.")
            return redirect("student_detail", student_id=student.id)
    else:
        form = StudentForm(instance=student)

    return render(
        request,
        "students/student_form.html",
        {
            "form": form,
            "title": "Edit Student",
        },
    )


def student_deactivate(request, student_id):
    student = get_object_or_404(Student, id=student_id)

    if request.method == "POST":
        student.status = "Inactive"
        student.save(update_fields=["status"])
        messages.success(request, "Student deactivated successfully.")

    return redirect("student_detail", student_id=student.id)