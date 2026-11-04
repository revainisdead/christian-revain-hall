# UI Plan

Status: step 1 done on `develop` (2026-11-04). This plan covers the client work in order: the board page, its controls, and the arrow system. Product behavior is defined in [training-tool-plan.md](training-tool-plan.md), and the games API in [chess-data-plan.md](chess-data-plan.md).

## The board page today

The page (`src/pages/IndexPage.vue`) has the board on the left and two control cards on the right.

| Card | Controls | Purpose |
|---|---|---|
| **Moves** | `\|<` `<` `>` `>\|`, move list (click to jump), "White/Black to move" badge. Keys: ← → Home End, Esc deselects. | Real chess controls. These stay. |
| **Arrows (testing)** | From/To squares + Draw, Sample set, Last move, Undo arrow, Clear, "N drawn" count | Exercises the overlay while the arrow system is built. It is replaced by real input (right-click drag) in step 5, and may be kept behind a dev flag. |

Code:
- `components/useBoardHistory.ts`: positions list plus a `ply` cursor. It exposes `move(from, to)`, `back`, `forward`, `goTo`, `toStart`, `toEnd`, `sideToMove` and `lastMove`. Moving while viewing an earlier position drops the later moves (truncate).
- `components/ChessBoard.vue`: emits `square-click` and takes `selected` and `highlights` (squares tinted yellow for the last move).
- `components/ChessOverlay.vue`: takes an `arrows` prop (`{ from, to, color? }[]`) and **redraws from state** whenever it changes. `data-arrow-count` on the canvas lets tests check it.
- Tests: `tests/moves.spec.ts` (click-to-move, back/forward, side to move, draw/clear arrows).

## Steps

### Step 1: First move and two control sets (done)

- Click a piece of the side to move, then a square, to move it. Turns alternate. The last move's squares are tinted.
- Back, forward, start and end, plus the keyboard shortcuts, and a clickable move list.
- Arrow test card: draw by squares, a sample set (three colors), the last move as an arrow, undo, and clear.
- **No rules yet:** any destination is accepted, and there is no castling, en passant or promotion. Captures just replace the piece.

### Step 2: Rules with chess.js

- Add `chess.js` and keep the move history in it, so `useBoardHistory` keeps the same interface while gaining rules (legal moves only, SAN, check, mate, stalemate, draws).
- Move list in SAN (`1. e4 e5 2. Nf3`).
- Promotion picker (queen, rook, bishop, knight).
- Game-over banner with the result and reason. Navigating back stays possible.
- Clicking an illegal square deselects (or switches the selection to another piece of the same side).
- Truncate prompt: making a move while viewing the past asks before discarding later moves.
- Tests: castling, en passant and promotion by clicks; an illegal click doesn't move.

### Step 3: Save games through the API

- Games list page: new game (choose White or Black), open a saved game.
- `/games/:id` loads `GET /api/games/{id}/` and replays its moves.
- Each move is sent as `POST /moves/ {uci, ply}`. The server stays the authority: a 400 or 409 reverts the client move and shows why. Truncating sends `DELETE ?after=`.
- Mock the games API in `tests/mockApi.ts` the same way auth is mocked.

### Step 4: Orientation and layout

- The board is oriented to your color and never flips automatically. A manual flip button changes only the view.
- `ChessBoard` renders ranks and files in the reversed order for Black. The overlay's square-to-pixel mapping takes the same `orientation`.
- Responsive board size: the board fills its column, so it isn't fixed at 400px (this ties into the arrow DPR and resize work below).
- Narrow screens: the controls stack under the board.

### Step 5: Arrow system

The aim is to go from "draws a red line" to a small, reliable rendering layer that the move preview and annotations can build on. **Every drawing is still a pure function of state** (board, orientation, selection, annotation list), as today.

**Rendering quality**
- **Sharp on high-DPI screens:** size the backing store as `cssSize * devicePixelRatio` and `ctx.scale(dpr, dpr)`.
- **Resize:** a `ResizeObserver` on the board container redraws at the new size. Arrow widths and head sizes scale with the square size, not fixed pixels.
- **Geometry:** start the shaft at the edge of the origin piece instead of its center, and end it at the target center. Use rounded caps and a head sized to the shaft.
- **Style per arrow kind:** opacity, width and an optional glow (`shadowBlur`/`shadowColor`). Kinds: `preview` (move preview), `annotation` (user), `lastMove`, `test`.
- **Knight arrows:** an L-shaped path (two segments with one corner) instead of a straight diagonal.
- **Overlaps:** when two arrows end on the same square or share a line, offset them slightly or merge them, so they stay readable. Draw annotations above previews.

**State and layers**
- Two canvases: **auto** (move preview, attacker-count tints) and **user** (annotations). Each one redraws and clears on its own, so clearing annotations never wipes the preview.
- Arrow identity is `from + to + kind`. Drawing an arrow that already exists **removes it** (toggle), the convention on other chess sites.
- Square highlights (circles or tinted fills) live in the same annotation list as arrows.

**Input (replaces most of the test card)**
- Right-click drag from one square to another draws an arrow. Right-click without dragging toggles a square highlight.
- Shift, Alt and Ctrl choose alternate colors.
- A left click on the board clears annotations. Esc clears the selection, then the annotations.
- Suppress the browser context menu over the board only.

**Move preview (training tool 1a)**
- Selecting a piece draws an arrow to each legal destination (from chess.js) and tints those squares red, with captures stronger. Deselecting clears them.

**Tests**
- Keep `data-arrow-count`, and add a `data-arrows` attribute (a JSON list of `from-to-kind`) so tests can assert exactly which arrows are drawn.
- Unit-test the geometry helpers (square to pixel for both orientations, knight path).
- Optional: a Playwright screenshot comparison of a fixed arrow set.

**When to switch to Konva:** if animation, hit-testing on arrows, or many objects make Canvas 2D awkward, move to Konva (`vue-konva`). The redraw-from-state design carries over unchanged.

### Step 6: Attacker counts (training tool 2)

- Green count at the bottom left (yours) and red at the bottom right (the opponent's) on each square, using the definitions in the training-tool plan.
- Square tints when nothing is selected.
- Toggle: off, occupied squares only, all squares.

### Later

- Drag and drop moves.
- Move animation and sounds.
- A variations tree instead of truncating.

## Fair play

All of this works only on positions played on BlunderProof's own board. No FEN or PGN paste, and no engine output (see [FAIR_PLAY.md](../FAIR_PLAY.md)).
