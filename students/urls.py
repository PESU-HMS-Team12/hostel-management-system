from django.urls import path

from . import views


urlpatterns = [
    path("", views.student_list, name="student_list"),
    path("add/", views.student_create, name="student_create"),
    path("<int:student_id>/", views.student_detail, name="student_detail"),
    path(
        "<int:student_id>/edit/",
        views.student_update,
        name="student_update",
    ),
    path(
        "<int:student_id>/deactivate/",
        views.student_deactivate,
        name="student_deactivate",
    ),
]