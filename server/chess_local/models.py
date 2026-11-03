import chess
from django.conf import settings
from django.db import models


class Game(models.Model):
    """A local (same-screen) game: the owner plays both sides; `user_color` is "you"."""

    class Color(models.TextChoices):
        WHITE = "white", "White"
        BLACK = "black", "Black"

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress", "In progress"
        WHITE_WON = "white_won", "White won"
        BLACK_WON = "black_won", "Black won"
        DRAW = "draw", "Draw"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="games", on_delete=models.CASCADE)
    # Your color: decides board orientation and the attacker-count perspective.
    user_color = models.CharField(max_length=5, choices=Color.choices, default=Color.WHITE)
    title = models.CharField(max_length=100, blank=True)
    start_fen = models.CharField(max_length=100, default=chess.STARTING_FEN)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    # checkmate, stalemate, insufficient_material, threefold_repetition, ...
    result_reason = models.CharField(max_length=30, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title or f"Game {self.pk}"


class Move(models.Model):
    game = models.ForeignKey(Game, related_name="moves", on_delete=models.CASCADE)
    ply = models.PositiveIntegerField()  # 1 = first move from start_fen
    uci = models.CharField(max_length=5)  # e2e4, e7e8q
    san = models.CharField(max_length=10)  # e4, exd5, O-O, e8=Q+
    fen_after = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ply"]
        constraints = [models.UniqueConstraint(fields=["game", "ply"], name="unique_move_ply")]

    def __str__(self):
        return f"{self.ply}. {self.san}"
