from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views.admin import (
    AdminRoleAssignView,
    AdminUserApproveView,
    AdminUserListView,
)
from api.views.allocations import AllocationViewSet
from api.views.auth import (
    CSRFTokenView,
    CurrentUserView,
    LoginView,
    LogoutView,
    StudentSignupView,
)
from api.views.health import HealthCheckView
from api.views.hostels import HostelViewSet, RoomViewSet
from api.views.reports import AllocationReportView, OccupancyReportView
from api.views.students import StudentViewSet

app_name = "api_v1"

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="student")
router.register(r"hostels", HostelViewSet, basename="hostel")
router.register(r"rooms", RoomViewSet, basename="room")
router.register(r"allocations", AllocationViewSet, basename="allocation")

urlpatterns = [
    # System Health
    path("health/", HealthCheckView.as_view(), name="health"),

    # Authentication & Session
    path("auth/csrf/", CSRFTokenView.as_view(), name="auth-csrf"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/signup/", StudentSignupView.as_view(), name="auth-signup"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", CurrentUserView.as_view(), name="auth-me"),

    # Administrative Management
    path("admin/users/", AdminUserListView.as_view(), name="admin-users"),
    path("admin/users/<int:user_id>/approve/", AdminUserApproveView.as_view(), name="admin-user-approve"),
    path("admin/roles/", AdminRoleAssignView.as_view(), name="admin-roles"),

    # Occupancy and Allocation Reports
    path("reports/occupancy/", OccupancyReportView.as_view(), name="report-occupancy"),
    path("reports/allocations/", AllocationReportView.as_view(), name="report-allocations"),

    # Resource ViewSets
    path("", include(router.urls)),
]
