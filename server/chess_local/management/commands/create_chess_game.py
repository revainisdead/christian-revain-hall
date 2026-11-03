from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from chess_local.models import ChGame, ChPiece, ChPlayer, TrainingGrounds


User = get_user_model()

BACK_RANK = [
    ChPiece.Roles.ROOK,
    ChPiece.Roles.KNIGHT,
    ChPiece.Roles.BISHOP,
    ChPiece.Roles.QUEEN,
    ChPiece.Roles.KING,
    ChPiece.Roles.BISHOP,
    ChPiece.Roles.KNIGHT,
    ChPiece.Roles.ROOK,
]
FILES = "abcdefgh"


class Command(BaseCommand):
    help = "Create a chess game in the starting position for a user."

    def add_arguments(self, parser):
        parser.add_argument("username", help="Owner of the game (must already exist).")

    @transaction.atomic
    def handle(self, *args, **options):
        username = options["username"]
        user = User.objects.filter(username=username).first()
        if user is None:
            raise CommandError(f"No user named '{username}'. Create one with: manage.py createsuperuser")

        training_ground, _ = TrainingGrounds.objects.get_or_create(user=user)
        white = ChPlayer.objects.create(color="white")
        black = ChPlayer.objects.create(color="black")
        game = ChGame.objects.create(white_player=white, black_player=black, training_ground=training_ground)

        pieces = []
        for player, back_rank, pawn_rank in ((white, 1, 2), (black, 8, 7)):
            for file, role in zip(FILES, BACK_RANK):
                pieces.append(ChPiece(player=player, role=role, position=f"{file}{back_rank}"))
                pieces.append(ChPiece(player=player, role=ChPiece.Roles.PAWN, position=f"{file}{pawn_rank}"))
        ChPiece.objects.bulk_create(pieces)

        self.stdout.write(self.style.SUCCESS(f"Created game {game.pk} for {username} with {len(pieces)} pieces."))
