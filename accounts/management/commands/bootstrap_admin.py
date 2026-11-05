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
        "Trusted server-side bootstrap command to provision the initial "
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
            if RoleProfile.objects.filter(
                role=RoleProfile.Role.ADMINISTRATOR,
                user__is_active=True,
            ).exists():
                raise CommandError(
                    "An active HMS Administrator account already exists. "
                    "Initial bootstrap is restricted to provisioning the first administrator."
                )

            if User.objects.filter(username__iexact=username).exists():
                raise CommandError(
                    f"Username '{username}' already exists. "
                    "Bootstrap cannot modify or promote existing accounts."
                )

            if User.objects.filter(email__iexact=email).exists():
                raise CommandError(
                    f"Email '{email}' is already associated with an existing account."
                )

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                is_active=True,
                is_staff=False,
                is_superuser=False,
            )

            profile = RoleProfile.objects.create(
                user=user,
                role=RoleProfile.Role.ADMINISTRATOR,
                student=None,
            )

            create_audit_log(
                user,
                "CREATE",
                "RoleProfile",
                profile.pk,
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Created HMS Administrator '{user.username}' ({user.email}) with active ADMINISTRATOR role."
            )
        )
