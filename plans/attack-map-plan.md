# Attack Map Plan

Status: parts 1 (move preview with capture marks) and 2 (attacker bubbles and threat list) done on `develop` (2026-11-11). This plan expands training tool 1a and training tool 2 from [training-tool-plan.md](training-tool-plan.md) and UI plan steps 5 and 6 from [ui-plan.md](ui-plan.md).

## Part 1: Move preview (done)

Selecting a piece of the side to move shows where it can go:

- **Arrows, one per direction.** Rooks, bishops and queens get a single arrow along each line to the farthest square they can reach. A rook on an open file gets one arrow down the file, not seven stacked ones. Pawn double pushes count as a line. Knights get one arrow per jump (straight for now).
- **On the board, legal only.** Destinations come from chess.js legal moves, so off-board jumps never appear, lines stop at the first piece in the way, and pins and check are respected (a pinned rook only gets its pin line).
- **Stops at an enemy.** A line that runs into an enemy piece ends **on** it (the capture). One that runs into a friendly piece ends on the square before it.
- **Marked for destruction.** Every enemy piece the selected piece could capture gets a red tint and a pulsing red crosshair ring. For en passant, the mark goes on the pawn that would be removed, not on the empty target square. The pulse turns off under `prefers-reduced-motion`.
- **Quiet destinations** get a red dot.
- Deselecting (clicking the piece again, an empty non-target square, or Esc) or stepping through history clears the preview.

Code:
- `useBoardHistory.previewMoves(from)`: `{ to, victim }[]`, one entry per destination (promotion choices merged). `victim` is the square of the captured piece.
- `components/movePreview.ts`: `previewArrows(from, moves)` merges line moves into one arrow per direction.
- `ChessBoard` takes `targets` (dots) and `victims` (destruction marks). `ChessOverlay` styles arrows by `kind` (`test`, `preview`) and exposes `data-arrows` (a sorted JSON list of `from-to-kind`) for tests.
- Tests: `tests/preview.spec.ts` (knight, pawn push, rook line stopping at an enemy, bishop capture, queen with three victims, en passant victim, clearing on navigation). The positions were checked with python-chess.

## Part 2: Attacker bubbles and threat list (done)

Built on the main board instead of the separate mini board first planned, so the counts sit on the real pieces.

### Attacker bubbles

**Name:** the small green and red number circles in a square's bottom corners are **attacker bubbles**. Use that name in code, UI and docs.

- Each occupied square (by default; or every square) shows a **green** bubble at the bottom left (how many of **your** pieces attack it) and a **red** bubble at the bottom right (how many of the **opponent's** do). Zero is hidden. The corner position carries the meaning too, so color isn't the only signal.
- An **Attacker bubbles** card (right column) holds two dropdowns:
  - **Show on:** Pieces only (default: occupied squares only), All squares, Off. Off clears the board for clean viewing.
  - **You are:** Side to move (default), White, Black. Until saved games record your color (UI plan step 3), "you" is the side to move, so green and red swap each move. Picking a color pins them. Step 3 can default this to `user_color`.
- The counts follow history navigation, since they're computed from the shown position.

### Pieces under attack (threat list)

A card on the left of the board lists **your pieces the opponent attacks**, top 5, most urgent first. Kings are left out, because check has its own red glow.

Each row shows the piece, **attackers vs defenders** (red vs green), and the **battle**:
- **Losing −N:** the opponent wins N points of material if they start capturing there.
- **Holds:** starting the exchange doesn't pay for them.

The battle isn't a bare count comparison. Both sides capture with their **cheapest piece first** and either side stops when continuing would cost more (a simple static exchange evaluation, using pawn 1, knight and bishop 3, rook 5, queen 9). Counts alone mislead: a knight defended twice but attacked by one pawn still loses 2 (knight for pawn), and a pawn attacked once with no defenders loses 1. Sorting is by loss, then piece value.

### Counting rules (v1)

- "Attacks" means the piece could capture on that square if an enemy stood there. Pawns attack diagonally only.
- Attacks on a square holding your own piece count (that's **defense**).
- Pinned pieces count. Kings count.
- No x-rays: a rook behind a rook counts once, and it doesn't join an exchange after the front one is traded.

chess.js `attackers()` follows exactly these rules, the same as python-chess `board.attackers()` (confirmed from its source). The exchange rule was cross-checked against a Python version on 2,000 random cases.

### Code

- `useBoardHistory.attackers`: `{ [square]: { w: string[]; b: string[] } }` for the shown position.
- `components/attackMap.ts`: `attackerBubbles` (bubbles per square for the mode), `exchangeLoss` (the battle), `threatsTo` (the top-5 list), `PIECE_VALUE`.
- `ChessBoard` takes `bubbles` and renders them (`.attacker-bubble.mine` / `.theirs`). Squares expose `data-attackers-mine` / `data-attackers-theirs` for tests.
- `components/AttackerBubbleControls.vue` (the dropdowns) and `components/ThreatList.vue` (rows expose `data-threat-square` and `data-loss`).
- Tests: `tests/attackMap.spec.ts`. All counts and losses there were computed with python-chess.

### Next

- Square tints from the training-tool plan (green where you have more attackers, red where they do), with the move preview taking over when a piece is selected.
- Clicking a threat row selects that square on the board and draws arrows from its attackers (a new `attack` arrow kind).
- Pins and x-rays: count batteries, and drop pinned defenders from the battle.
- Remember the dropdown choices in `localStorage`.
- Knight L-shaped arrows, DPR-sharp canvas, resize, and the separate auto and user canvas layers (UI plan step 5).

## Part 3: Battle board (done)

Each row in "Pieces under attack" ends with an eye button. It opens a **new browser tab** with a bare board (no header, no controls) showing the position **after the battle is over**, with the battle square highlighted. If you'd lose a pawn (−1), that's the board you see. For a piece that holds, the tab shows what happens if the opponent starts anyway (they stop as soon as going on would cost them).

- The board page works out the battle (`battleOn` in `attackMap.ts`: each capture, cheapest piece first, stopping by the same rule as the loss) and opens `/#/battle?board=<FEN placement>&square=<square>`.
- The battle page (`pages/BattlePage.vue`, in `BlankLayout`) only **draws** the board in the address. It computes nothing, so a typed-in position gets a picture, not analysis. That keeps it out of fair-play trouble even though the position is in the URL.
- The game tab is untouched.
- `toPlacement` / `fromPlacement` in `chessAssets.ts` convert between a `Position` and FEN placement.
- Tests: `tests/battle.spec.ts` (hanging bishop, knight for a pawn, a piece that holds, a bad address).

Next: step through the captures one at a time, and predict-then-reveal (see the training goal in [training-tool-plan.md](training-tool-plan.md)).

## Fair play

The preview, the attacker bubbles and the threat list read only positions played on BlunderProof's own board (the local game, the sample game, saved games). There's no way to enter an outside position (no FEN or PGN paste), and the map shows counts, not moves or evaluations. See [FAIR_PLAY.md](../FAIR_PLAY.md).
