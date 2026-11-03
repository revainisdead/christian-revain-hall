import chess
import pytest
from model_bakery import baker

from chess_local import services
from chess_local.models import Game

pytestmark = pytest.mark.django_db


def play(game, *ucis):
    start = game.moves.count() + 1
    return [services.append_move(game, uci, ply) for ply, uci in enumerate(ucis, start=start)]


@pytest.fixture
def game():
    return baker.make(Game)


def test_legal_move_stores_san_and_fen(game):
    (move,) = play(game, "e2e4")
    assert (move.ply, move.uci, move.san) == (1, "e2e4", "e4")
    assert move.fen_after == "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"


@pytest.mark.parametrize("uci", ["e2e5", "e7e5", "zz99", "e2"])
def test_illegal_or_malformed_move(game, uci):
    with pytest.raises(services.IllegalMove):
        services.append_move(game, uci, 1)
    assert game.moves.count() == 0


@pytest.mark.parametrize("ply", [0, 2, 5])
def test_wrong_ply(game, ply):
    with pytest.raises(services.PlyConflict):
        services.append_move(game, "e2e4", ply)


def test_castling(game):
    moves = play(game, "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1g1")
    assert moves[-1].san == "O-O"


def test_en_passant(game):
    moves = play(game, "e2e4", "a7a6", "e4e5", "d7d5", "e5d6")
    assert moves[-1].san == "exd6"
    assert services.board_at(game).piece_at(chess.D5) is None


def test_promotion(game):
    game.start_fen = "8/4P3/8/8/8/8/k7/4K3 w - - 0 1"
    game.save()
    (move,) = play(game, "e7e8q")
    assert move.san == "e8=Q"


def test_checkmate_sets_result(game):
    play(game, "f2f3", "e7e5", "g2g4", "d8h4")  # fool's mate
    assert services.board_at(game).is_checkmate()
    game.refresh_from_db()
    assert game.status == Game.Status.BLACK_WON
    assert game.result_reason == "checkmate"
    with pytest.raises(services.IllegalMove):
        services.append_move(game, "a2a3", 5)


def test_stalemate_sets_draw(game):
    game.start_fen = "7k/4Q3/6K1/8/8/8/8/8 w - - 0 1"
    game.save()
    play(game, "e7f7")  # Qf7: black king on h8 has no legal moves and is not in check
    assert services.board_at(game).is_stalemate()
    game.refresh_from_db()
    assert (game.status, game.result_reason) == (Game.Status.DRAW, "stalemate")


KNIGHT_DANCE = ["g1f3", "g8f6", "f3g1", "f6g8"]


def test_threefold_is_claimable_but_does_not_end_game(game):
    play(game, *KNIGHT_DANCE * 2)
    assert services.board_at(game).can_claim_threefold_repetition()
    game.refresh_from_db()
    assert game.status == Game.Status.IN_PROGRESS


def test_fivefold_repetition_ends_game(game):
    # Needs the full move history, which board_at keeps by replaying from start_fen.
    play(game, *KNIGHT_DANCE * 4)
    assert services.board_at(game).is_fivefold_repetition()
    game.refresh_from_db()
    assert (game.status, game.result_reason) == (Game.Status.DRAW, "fivefold_repetition")


def test_truncate_removes_later_moves_and_reopens_game(game):
    play(game, "f2f3", "e7e5", "g2g4", "d8h4")
    assert services.truncate_after(game, 2) == 2
    game.refresh_from_db()
    assert list(game.moves.values_list("ply", flat=True)) == [1, 2]
    assert game.status == Game.Status.IN_PROGRESS
    play(game, "g2g3")  # play continues from ply 3


def test_board_at_ply(game):
    play(game, "e2e4", "e7e5")
    assert services.board_at(game, 0).fen() == chess.STARTING_FEN
    assert services.board_at(game, 1).piece_at(chess.E4) == chess.Piece.from_symbol("P")
