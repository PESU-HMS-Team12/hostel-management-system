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
]