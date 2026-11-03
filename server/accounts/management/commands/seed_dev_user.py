import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = "DEV ONLY: create (or reset) a superuser with a known password for the dev login box."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--email", default="")
        parser.add_argument(
            "--password",
            default=os.environ.get("DEV_USER_PASSWORD", "a"),
            help="Default: $DEV_USER_PASSWORD, else 'a'. Set directly: skips the password validators/prompt.",
        )

    def handle(self, *args, username, email, password, **options):
        if not settings.DEBUG:
            raise CommandError("seed_dev_user only runs with DEBUG=true.")
        user, created = User.objects.get_or_create(username=username, defaults={"email": email})
        user.is_staff = user.is_superuser = True
        if email:
            user.email = email
        user.set_password(password)
        user.save()
        verb = "Created" if created else "Reset"
        self.stdout.write(self.style.SUCCESS(f"{verb} dev superuser '{username}' with password '{password}'."))
