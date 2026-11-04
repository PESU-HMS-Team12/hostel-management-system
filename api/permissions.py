from rest_framework import exceptions
from rest_framework.permissions import BasePermission
from accounts.decorators import get_user_role
from accounts.models import RoleProfile


def _check_authenticated(request):
    if not request.user or not request.user.is_authenticated:
        raise exceptions.NotAuthenticated("Authentication credentials were not provided.")


class HasHMSRole(BasePermission):
    """
    Allows access only to authenticated users who have an assigned HMS role
    (Student, Warden, or Administrator).
    """
    message = "Your account has no assigned HMS role."

    def has_permission(self, request, view):
        _check_authenticated(request)
        return get_user_role(request.user) is not None


class IsAdministrator(BasePermission):
    """
    Allows access only to users with the ADMINISTRATOR role or Django superusers.
    """
    message = "Administrator privileges are required to perform this action."

    def has_permission(self, request, view):
        _check_authenticated(request)
        return get_user_role(request.user) == RoleProfile.Role.ADMINISTRATOR


class IsWardenOrAdministrator(BasePermission):
    """
    Allows access only to Wardens and Administrators.
    """
    message = "Staff privileges (Warden or Administrator) are required."

    def has_permission(self, request, view):
        _check_authenticated(request)
        return get_user_role(request.user) in (
            RoleProfile.Role.WARDEN,
            RoleProfile.Role.ADMINISTRATOR,
        )


class IsStudentUser(BasePermission):
    """
    Allows access only to users with the STUDENT role.
    """
    message = "Student privileges are required."

    def has_permission(self, request, view):
        _check_authenticated(request)
        return get_user_role(request.user) == RoleProfile.Role.STUDENT


class IsOwnerStudentOrStaff(BasePermission):
    """
    Object-level permission allowing staff full access, while students can only
    access their own student/allocation records.
    """
    message = "You do not have permission to access another user's record."

    def has_permission(self, request, view):
        _check_authenticated(request)
        return get_user_role(request.user) is not None

    def has_object_permission(self, request, view, obj):
        role = get_user_role(request.user)

        if role in (RoleProfile.Role.WARDEN, RoleProfile.Role.ADMINISTRATOR):
            return True

        if role == RoleProfile.Role.STUDENT:
            profile = getattr(request.user, "role_profile", None)
            if not profile or not profile.student:
                return False

            # Check if object is a Student
            if hasattr(obj, "student_id") and not hasattr(obj, "room"):
                return obj.pk == profile.student.pk

            # Check if object is an Allocation
            if hasattr(obj, "student"):
                return obj.student.pk == profile.student.pk

        return False
