from functools import wraps

from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden

from .models import RoleProfile


def get_user_role(user):
    if not user.is_authenticated:
        return None

    # A Django superuser has system-administrator access.
    if user.is_superuser:
        return RoleProfile.Role.ADMINISTRATOR

    profile = RoleProfile.objects.filter(user=user).first()

    if profile is None:
        return None

    return profile.role


def role_required(*allowed_roles):
    def decorator(view_func):

        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            role = get_user_role(request.user)

            if role not in allowed_roles:
                return HttpResponseForbidden(
                    "You do not have permission to access this page."
                )

            return view_func(request, *args, **kwargs)

        return login_required(wrapped_view)

    return decorator