from django.core.manangement.base import BaseCommand
from chess.models import ChGame, ChPlayer, ChPiece

from accounts.models import BfUser


class Command(BaseCommand):
    help = 'Create a chess game with initial pieces and players'

    def handle(self, *args, **options):
        # auto create a chess name from timestamp, etc.
        game = ChGame.objects.create(name='game1')

        user = BfUser.objects.filter(username='christian').first()
