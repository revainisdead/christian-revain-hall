from django.db import models



class ChPiece(models.Model):
    position = models.CharField(null=True, blank=True)


class ChPlayer(models.Model)
    user = models.ForeignKey('auth.User'))


class ChGame(models.Model):
    player = models.ForeignKey('auth.User', related_name='games', on_delete=models.CASCADE)
