from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from chess_local import services
from chess_local.models import Game

User = get_user_model()


class Command(BaseCommand):
    help = "Create a local game for a user, optionally playing some opening moves."

    def add_arguments(self, parser):
        parser.add_argument("username", help="Owner of the game (must already exist).")
        parser.add_argument("--color", choices=["white", "black"], default="white", help="Your color.")
        parser.add_argument("--moves", default="", help='UCI moves to play, e.g. "e2e4 e7e5 g1f3".')
        parser.add_argument("--title", default="", help="Game title.")

    def handle(self, *args, **options):
        user = User.objects.filter(username=options["username"]).first()
        if user is None:
            raise CommandError(f"No user named '{options['username']}'. Create one with: make superuser")

        game = Game.objects.create(owner=user, user_color=options["color"], title=options["title"])
        for ply, uci in enumerate(options["moves"].split(), start=1):
            try:
                services.append_move(game, uci, ply)
            except services.IllegalMove as exc:
                game.delete()
                raise CommandError(f"Move {ply}: {exc}")

        self.stdout.write(self.style.SUCCESS(
            f"Created game {game.pk} for {user.username} ({game.user_color}) with {game.moves.count()} moves."
        ))
