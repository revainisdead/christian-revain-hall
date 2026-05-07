from django.db import models

from django.contrib.auth.models import User


class ChPiece(models.Model):
    position = models.CharField(null=True, blank=True, max_length=10)
    player = models.ForeignKey('ChPlayer', related_name='pieces', on_delete=models.CASCADE)

    class Roles(models.TextChoices):
        PAWN = 'PAWN', 'Pawn'
        ROOK = 'ROOK', 'Rook'
        KNIGHT = 'KNIGHT', 'Knight'
        BISHOP = 'BISHOP', 'Bishop'
        QUEEN = 'QUEEN', 'Queen'
        KING = 'KING', 'King'

    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.PAWN)


class ChPlayer(models.Model):
    color = models.CharField(max_length=5)



# user.games.white_player.pieces
# user.games.black_player.pieces

class ChGame(models.Model):
    """
    dont store all on user

    training grounds
    """
    white_player = models.OneToOneField(ChPlayer, related_name='white_game', on_delete=models.CASCADE)
    black_player = models.OneToOneField(ChPlayer, related_name='black_game', on_delete=models.CASCADE)

    training_ground = models.ForeignKey('TrainingGrounds', related_name='games', on_delete=models.CASCADE)


class TrainingGrounds(models.Model):
    """
    Has user as field and also has games

    Allow connection between user and games without directly storing on user

    /api/v1/training-grounds/1/games/1
    /api/v1/training-grounds/{user_id}/games/{game_id}
    """
    user = models.OneToOneField(User, related_name='training_grounds', on_delete=models.CASCADE)

    #profile = models.ForeignKey()

