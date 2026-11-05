import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import RoleProfile
from auditlog.services import create_audit_log

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Trusted server-side bootstrap command to provision or promote the initial "
        "HMS Administrator account with RoleProfile.Role.ADMINISTRATOR."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            required=True,
            help="Username for the administrator account.",
        )
        parser.add_argument(
            "--email",
            required=True,
            help="University email address for the administrator account.",
        )
        parser.add_argument(
            "--password",
            default=None,
            help=(
                "Password for the administrator account. If omitted, reads from "
                "the HMS_BOOTSTRAP_ADMIN_PASSWORD environment variable."
            ),
        )
        parser.add_argument(
            "--first-name",
            default="System",
            help="First name for the administrator account (default: System).",
        )
        parser.add_argument(
            "--last-name",
            default="Administrator",
            help="Last name for the administrator account (default: Administrator).",
        )

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip().lower()
        password = options["password"] or os.environ.get("HMS_BOOTSTRAP_ADMIN_PASSWORD")
        first_name = options["first_name"].strip()
        last_name = options["last_name"].strip()

        if not username:
            raise CommandError("A non-empty --username is required.")
        if not email or "@" not in email:
            raise CommandError("A valid --email address is required.")
        if not password:
            raise CommandError(
                "Password must be supplied via --password or the HMS_BOOTSTRAP_ADMIN_PASSWORD environment variable."
            )

        candidate_user = User(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name,
        )
        try:
            validate_password(password, user=candidate_user)
        except ValidationError as exc:
            raise CommandError("; ".join(exc.messages)) from exc

        with transaction.atomic():
            user = User.objects.filter(username__iexact=username).first()
            is_new_user = user is None

            if is_new_user:
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    first_name=first_name,
                    last_name=last_name,
                    is_active=True,
                    is_staff=True,
                    is_superuser=True,
                )
            else:
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.is_active = True
                user.is_staff = True
                user.is_superuser = True
                user.set_password(password)
                user.save()

            profile = RoleProfile.objects.filter(user=user).first()
            is_new_profile = profile is None
            if is_new_profile:
                profile = RoleProfile(user=user)

            profile.role = RoleProfile.Role.ADMINISTRATOR
            profile.student = None
            profile.save()

            create_audit_log(
                user,
                "CREATE" if is_new_profile else "UPDATE",
                "RoleProfile",
                profile.pk,
            )

        action_label = "Created" if is_new_user else "Updated"
        self.stdout.write(
            self.style.SUCCESS(
                f"{action_label} HMS Administrator '{user.username}' ({user.email}) with active ADMINISTRATOR role."
            )
        )
