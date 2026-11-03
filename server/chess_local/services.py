"""All python-chess rules logic for local games. Views stay thin and call these."""
import chess
from django.db import transaction

from chess_local.models import Game, Move


class IllegalMove(Exception):
    pass


class PlyConflict(Exception):
    pass


def board_at(game: Game, ply: int | None = None) -> chess.Board:
    """Board after `ply` moves (None = latest).

    Replays from start_fen rather than loading the stored FEN so the board keeps its move
    stack, which python-chess needs to detect threefold repetition.
    """
    board = chess.Board(game.start_fen)
    moves = game.moves.order_by("ply")
    if ply is not None:
        moves = moves.filter(ply__lte=ply)
    for uci in moves.values_list("uci", flat=True):
        board.push_uci(uci)
    return board


def _set_result(game: Game, board: chess.Board) -> None:
    # Only automatic endings (mate, stalemate, insufficient material, fivefold, 75-move).
    # Claimable draws (threefold, 50-move) don't end the game; claiming one is a player action.
    outcome = board.outcome()
    if outcome is None:
        game.status, game.result_reason = Game.Status.IN_PROGRESS, ""
    else:
        if outcome.winner is None:
            game.status = Game.Status.DRAW
        else:
            game.status = Game.Status.WHITE_WON if outcome.winner == chess.WHITE else Game.Status.BLACK_WON
        game.result_reason = outcome.termination.name.lower()
    game.save(update_fields=["status", "result_reason", "updated_at"])


@transaction.atomic
def append_move(game: Game, uci: str, ply: int) -> Move:
    """Validate and store the move at `ply` (must be the next ply). Updates the game result."""
    game = Game.objects.select_for_update().get(pk=game.pk)
    expected = game.moves.count() + 1
    if ply != expected:
        raise PlyConflict(f"Expected ply {expected}, got {ply}.")
    if game.status != Game.Status.IN_PROGRESS:
        raise IllegalMove("The game is over.")

    board = board_at(game)
    try:
        move = chess.Move.from_uci(uci)
    except ValueError:
        raise IllegalMove(f"'{uci}' is not a UCI move.")
    if move not in board.legal_moves:
        raise IllegalMove(f"{uci} is not legal in this position.")

    san = board.san(move)
    board.push(move)
    created = Move.objects.create(game=game, ply=ply, uci=move.uci(), san=san, fen_after=board.fen())
    _set_result(game, board)
    return created


@transaction.atomic
def truncate_after(game: Game, ply: int) -> int:
    """Delete every move after `ply` (0 = all moves). Returns how many were deleted."""
    game = Game.objects.select_for_update().get(pk=game.pk)
    deleted, _ = game.moves.filter(ply__gt=ply).delete()
    if deleted:
        _set_result(game, board_at(game))
    return deleted
