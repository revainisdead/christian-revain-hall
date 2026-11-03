# Chess Data Plan

Status: draft. Companion to [training-tool-plan.md](training-tool-plan.md).

## Recommendation

Store games relationally **down to the move**, not down to the piece:

```
User 1──* Game 1──* Move
```

- Each **Move** row stores the move (UCI and SAN) and the **FEN** of the position after it.
- A **Game** stores your chosen color, its starting FEN, status, and result.
- **Pieces are not stored.** The pieces on the board are always derived from a FEN, using chess.js on the client and python-chess on the server.

This keeps real relational modeling (foreign keys, ordering, uniqueness constraints, transactions, per-user scoping). It also matches what the training tool needs: stepping forward and back through history.

### Notation reference

| Name | What it describes | Example |
|---|---|---|
| **FEN** (Forsyth–Edwards Notation) | One full position: pieces, side to move, castling rights, en passant square, move counters | `rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1` |
| **SAN** (Standard Algebraic Notation) | One move, written the way humans read it | `e4`, `Nf3`, `exd5`, `O-O`, `e8=Q+` |
| **UCI** (long algebraic) | One move as from-square and to-square, unambiguous for machines | `e2e4`, `g1f3`, `e7e8q` |
| **PGN** (Portable Game Notation) | A whole game: headers plus the SAN move list | `[White "..."] 1. e4 e5 2. Nf3 ...` |

## Why not store pieces relationally

The current models in `chess_local` (`ChPiece` → `ChPlayer` → `ChGame` → `TrainingGrounds`) store one row per piece with its current square.

| Need | Piece rows (current) | FEN on the game only | **Moves + FEN per move (recommended)** |
|---|---|---|---|
| Show the current board | Read and assemble 32 rows | Parse 1 string | Last move's FEN |
| Go back and forth in history | Not possible: rows hold only the *current* square | Not possible | Jump to any ply's FEN |
| Undo or truncate | Would need a history table anyway | Not possible | Delete moves after ply N |
| Castling rights, en passant, move counters | Extra columns | Inside FEN | Inside FEN |
| Captures and promotion | Delete or mutate rows; a pawn turns into a queen | Inside FEN | Inside FEN, and the move records it |
| Validate a move | Rebuild the board from rows first | Load FEN into python-chess | Load FEN into python-chess |
| Writes per move | 1–3 row updates plus bookkeeping | 1 update | 1 insert |
| Export to standard formats (PGN) | Hard | Loses history | Directly from the move list |

The main problem is that piece rows only describe *now*. The training tool is built around *history*, which needs a move log. Once there's a move log, the piece rows become a second copy of the same information that can drift out of sync. FEN alone fixes the format but still loses history. Moves with a FEN per move gives both.

**Learning value:** the relational ideas are still all there: `Game → Move` one-to-many, `UniqueConstraint(game, ply)`, ordering and indexes, transactional "append move" and "truncate after ply" operations, and queries scoped to the owner. The future `training` app (runs, opponents, achievements, cards) adds many-to-many relationships, which give more practice.

## Proposed models (`chess_local`)

```python
import chess  # python-chess; works because the Django app is named chess_local


class Game(models.Model):
    class Color(models.TextChoices):
        WHITE = "white"
        BLACK = "black"

    class Status(models.TextChoices):
        IN_PROGRESS = "in_progress"
        WHITE_WON = "white_won"
        BLACK_WON = "black_won"
        DRAW = "draw"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="games", on_delete=models.CASCADE)
    user_color = models.CharField(max_length=5, choices=Color.choices)   # "you"; also the board orientation
    title = models.CharField(max_length=100, blank=True)
    start_fen = models.CharField(max_length=100, default=chess.STARTING_FEN)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.IN_PROGRESS)
    result_reason = models.CharField(max_length=30, blank=True)   # checkmate, stalemate, threefold, resign...
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Move(models.Model):
    game = models.ForeignKey(Game, related_name="moves", on_delete=models.CASCADE)
    ply = models.PositiveIntegerField()           # 1 = white's first move
    uci = models.CharField(max_length=5)          # e2e4, e7e8q
    san = models.CharField(max_length=10)         # e4, exd5, O-O, e8=Q+
    fen_after = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ply"]
        constraints = [models.UniqueConstraint(fields=["game", "ply"], name="unique_move_ply")]
```

Notes:
- **`user_color`** is the color chosen at game start. It decides who "you" is for attacker counts and which side sits at the bottom of the board. The user still plays both sides' moves.
- **`fen_after` is derived data,** stored on purpose. It could be recomputed by replaying `uci` from `start_fen`, but storing it makes history jumps and list views cheap. It's around 60–90 bytes per move.
- **The current position** is the FEN of the last move, or `start_fen` if there are no moves. Add `Game.current_fen` only if a profile shows it's needed.
- **Annotations** (arrows and square highlights) are **not stored**. They're client-only state.
- **The current models are replaced:**
  - `ChPiece` and `ChPlayer` go away.
  - `ChGame` becomes `Game`.
  - `TrainingGrounds` (a one-to-one wrapper around the user that holds nothing) is dropped in favor of `Game.owner`. The user model still doesn't store games; they're a reverse relation (`user.games`).
  - The name "training" is reserved for the future `training` app.
  - `create_chess_game` becomes a `seed_game` command that creates a `Game` with a few moves.
- **The data is test-only,** so the migration can be a fresh `0001_initial` for `chess_local` plus a dev-database reset.

## API (DRF, all scoped to `request.user`)

All endpoints require a logged-in user (`IsAuthenticated` is the global default). Querysets are filtered by `owner=request.user`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/games/` | List my games (no move list) |
| POST | `/api/games/` | New game: `{user_color, title?}` |
| GET | `/api/games/{id}/` | Game plus its ordered moves |
| PATCH / DELETE | `/api/games/{id}/` | Rename, resign, delete |
| POST | `/api/games/{id}/moves/` | `{uci, ply}`: append a move |
| DELETE | `/api/games/{id}/moves/?after={ply}` | Truncate (undo, or rewrite from an earlier position) |

Appending a move runs in a transaction:
1. Lock the game row.
2. Check that `ply` equals the current move count plus 1.
3. Load the current FEN into python-chess and reject the move if it's illegal.
4. Compute the SAN and the new FEN, and insert the `Move`.
5. If the game is over, update `status` and `result_reason`.

The client gets back the server's SAN and FEN, so the server is the source of truth and chess.js is used only for UX.

## Client-side model

- One chess.js instance per open game. The move list is loaded from the API.
- Navigation keeps a `viewPly` cursor and renders `moves[viewPly - 1].fen_after`, or `start_fen` when the cursor is at 0.
- `ChessBoard.vue` already takes a `position` map (`{ e4: 'w_pawn' }`).
  - Add a `fenToPosition(fen)` helper in `chessAssets.ts`, or switch the prop to a FEN string.
  - Add an `orientation` prop (`'white' | 'black'`) set from `user_color`.
- Attacker counts, move previews, and annotations are computed or held on the client from the chess.js board at `viewPly`. None of them are stored.

## Dependencies to add

- Server: `chess` (python-chess) in `requirements.in`.
- Client: `chess.js` in `client/package.json`.
- Auth (later phases): `djangorestframework-simplejwt`, plus the Google sign-in library chosen in the training tool plan.
- **Framework upgrade first:** Django 4.0 and Python 3.8 are both end of life.
