from django.urls import path

from . import views


urlpatterns = [
    path("", views.hostel_list, name="hostel_list"),
    path("add/", views.hostel_create, name="hostel_create"),
    path(
        "<int:hostel_id>/",
        views.hostel_detail,
        name="hostel_detail",
    ),
    path(
        "<int:hostel_id>/edit/",
        views.hostel_update,
        name="hostel_update",
    ),
    path("rooms/", views.room_list, name="room_list"),
    path("rooms/add/", views.room_create, name="room_create"),
]