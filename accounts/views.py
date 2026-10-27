from django.contrib import messages
from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
)

from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect, render
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_POST

from allocations.models import Allocation
from .decorators import get_user_role
from .models import RoleProfile


User = get_user_model()


def login_view(request):
    if request.user.is_authenticated:
        if get_user_role(request.user) is not None:
            return redirect("dashboard")

        logout(request)

    next_url = request.POST.get("next") or request.GET.get("next", "")

    if request.method == "POST":
        identifier = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        # Support either username or a uniquely matching email address.
        auth_username = identifier

        if "@" in identifier:
            matching_users = User.objects.filter(email__iexact=identifier)

            if matching_users.count() == 1:
                auth_username = matching_users.first().get_username()
            else:
                auth_username = None

        user = None

        if auth_username:
            user = authenticate(
                request,
                username=auth_username,
                password=password,
            )

        if user is None:
            messages.error(request, "Invalid username/email or password.")

        elif get_user_role(user) is None:
            messages.error(
                request,
                "Your account has no assigned HMS role. Contact an administrator.",
            )

        else:
            login(request, user)

            if next_url and url_has_allowed_host_and_scheme(
                next_url,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure(),
            ):
                return redirect(next_url)

            return redirect("dashboard")

    return render(
        request,
        "accounts/login.html",
        {"next": next_url},
    )


@login_required
def dashboard(request):
    role = get_user_role(request.user)

    if role is None:
        logout(request)
        messages.error(
            request,
            "Your account has no assigned HMS role. Contact an administrator.",
        )
        return redirect("login")

    profile = (
        RoleProfile.objects
        .select_related("student")
        .filter(user=request.user)
        .first()
    )

    role_label = dict(RoleProfile.Role.choices).get(role, role)

    return render(
        request,
        "accounts/dashboard.html",
        {
            "role": role,
            "role_label": role_label,
            "profile": profile,
            "username": request.user.get_username(),
        },
    )


@login_required
def my_profile(request):
    role = get_user_role(request.user)

    if role != RoleProfile.Role.STUDENT:
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden(
            "Only Student accounts can access this page."
        )

    profile = (
        RoleProfile.objects
        .select_related("student")
        .filter(user=request.user)
        .first()
    )

    if profile is None or profile.student is None:
        from django.http import HttpResponseForbidden
        return HttpResponseForbidden(
            "This account is not linked to a student record."
        )

    allocation = (
        Allocation.objects
        .select_related("room", "room__hostel")
        .filter(
            student=profile.student,
            check_out_date__isnull=True,
        )
        .order_by("-allocation_date")
        .first()
    )

    return render(
        request,
        "accounts/my_profile.html",
        {
            "student": profile.student,
            "allocation": allocation,
        },
    )


@require_POST
def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("login")