from django.urls import path

from . import views


urlpatterns = [
    path("", views.allocation_list, name="allocation_list"),
    path("create/", views.allocation_create, name="allocation_create"),
    path(
        "availability/",
        views.room_availability,
        name="room_availability",
    ),
    path(
        "<int:allocation_id>/transfer/",
        views.allocation_transfer,
        name="allocation_transfer",
    ),
    path(
        "<int:allocation_id>/vacate/",
        views.allocation_vacate,
        name="allocation_vacate",
    ),
]