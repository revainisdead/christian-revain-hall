# Training Tool Plan

Status: draft. Data storage is covered in [chess-data-plan.md](chess-data-plan.md).

## Training goal

**BlunderProof trains the seeing behind a move, not the move itself.** Engines and bots jump to the end: a best move and a number. They skip everything a player has to see to find that move on their own. BlunderProof breaks a position into those pieces, one layer at a time:

1. **Where can this piece go?** (move preview)
2. **Who controls each square?** (attack counts)
3. **Which of my pieces are in danger, and do they hold?** (pieces under attack)
4. **What does the board look like once the fight is over?** (battle board)

Each layer is a picture a strong player builds in their head without help. The tools exist to **check** that picture, so a player can make the step themselves, compare it with the truth, and move up. As the player improves, the aids should fade: from counts on every square, to only the threatened pieces, to nothing but the final board to confirm a guess.

The aim is a player who sees the battle before it happens.

Ideas this opens up (not built yet):
- **Predict, then reveal:** before opening the battle board, the player guesses the outcome (−3? holds?) or the final position, and BlunderProof scores the guess.
- **Step-through battles:** the battle board plays the captures one at a time instead of jumping to the end, for players still learning to count an exchange.
- **Fading aids as progression:** in the Training campaign, aids are unlocked, limited or removed as the player levels up (ties into the RNG cards under [Future](#future-training-campaign-vs-ai)).
- **Visualization score over time:** track prediction accuracy per player, so improvement is something they can see.

All of it stays on BlunderProof's own positions and shows structure, never engine moves (see [Fair play](#fair-play-constraints)).

## Concept

Every person has their own account. A signed-in user opens the **local board** (Django app `chess_local`): one chess board on one screen where they play **both sides**. They make a move, then make the opponent's reply on the same board, and so on. The point is to replay or explore any game while BlunderProof's training tools show what is happening on every square:

- **move preview:** where the selected piece can go, with arrows
- **attacker counts:** who controls each square

BlunderProof shows *structure*. It never suggests moves or evaluates positions with an engine. See [Fair play](#fair-play-constraints).

The same training tools will later be available in **Training** (a separate future app, `training`): a roguelike campaign against AI opponents. See [Future](#future-training-campaign-vs-ai).

## Starting a game: choose your color

- A new game starts by choosing **White** or **Black**.
- The chosen color is **"you"** for the whole game. The other color is **the opponent**, even though the user also plays the opponent's moves.
- **Board orientation follows your color and never flips automatically.** If you choose White, White is at the bottom, nearest you. If you choose Black, Black is at the bottom. That's how a real board sits.
- A manual "flip board" button can exist as a viewing aid. It changes only the view, never who "you" are.
- Your color is saved on the game (see the data plan).

## Core chess (must have)

- **Rules engine on the client:** [chess.js](https://github.com/jhlywa/chess.js) handles legal move generation, check, checkmate, stalemate, castling, en passant, promotion, and draw rules (50-move, threefold repetition, insufficient material).
- **Rules check on the server:** `python-chess` validates every move before it is stored. See the data plan.
- **Turns:** sides alternate automatically. The UI shows whose turn it is ("Your move" or "Opponent's move").
- **Moving pieces:** click a piece, then click a destination. Drag and drop comes later.
- **Promotion:** a picker for queen, rook, bishop, or knight.
- **Game end:** show the result and the reason (checkmate, stalemate, draw rule, resignation). Reviewing the game stays possible afterwards.
- **Games list:** start a new game, see saved games, reopen one.

## History navigation (must have)

- **Move list:** SAN moves in numbered pairs (`1. e4 e5 2. Nf3 ...`). Clicking a move jumps to that position.
- **Controls:** `|<` start, `<` back, `>` forward, `>|` end. Left and right arrow keys step back and forward; Home and End jump to the ends.
- **Viewing the past is read-only by default.** If the user makes a move while viewing an earlier position, v1 asks to **truncate**: discard every later move and continue from there. Keeping both lines as variations (a move tree) comes later.
- **Undo:** remove the last move. This is the same as truncating at the previous ply.

## Training tool 1: move preview and annotations

### 1a. Move preview (automatic)

When the user selects a piece that belongs to the side to move:

- Every **legal destination square is tinted red**.
- A **basic arrow** shows the direction the piece travels: one per line to the farthest reachable square (so a rook's file is one arrow, not seven), and one per knight jump. v1 uses straight lines for every piece, knights included. An L-shaped knight path is a later polish item.
- Enemy pieces it could capture are **marked for destruction** (red tint plus a pulsing crosshair ring). Built as described in [attack-map-plan.md](attack-map-plan.md).
- Captures get a stronger tint or ring than quiet moves.
- Deselecting the piece (clicking it again, clicking an empty non-target square, or pressing Esc) clears the preview.

### 1b. User annotations (manual)

Same conventions as other chess sites:

- **Right-click a square** to toggle a highlight color on it.
- **Right-click and drag** from one square to another to draw an arrow.
- Modifier keys (Shift, Alt, Ctrl) pick alternate colors.
- A left click on the board clears annotations.
- **Annotations are not saved.** They live in client state and are cheap to redraw at any time.

### Rendering (canvas)

Arrows and highlights are drawn on canvas layers over the board, building on the existing `ChessOverlay.vue` (`drawArrow(from, to)` already works).

- **Native Canvas 2D first, no library.** It already covers everything needed:
  - opacity: `globalAlpha` or `rgba` colors,
  - glow: `shadowBlur` and `shadowColor`,
  - rounded ends: `lineCap` and `lineJoin`,
  - arrowheads,
  - additive or blended highlights: `globalCompositeOperation`.
- **Two layers:** an *auto* layer (move preview, attacker-count tints) and a *user* layer (annotations). Each can be cleared and redrawn on its own.
- **Redraw is a pure function** of state: board, selection, and the annotation list. Nothing is drawn incrementally, so the canvas is always correct after any change (navigation, resize, theme).
- **Sharp on high-DPI screens:** size the canvas backing store by `devicePixelRatio`.
- **Resizes with the board:** a `ResizeObserver` triggers a redraw, which also fixes today's hard-coded 400px canvas.
- **When to add a library:** if hit-testing, animation, or many objects get heavy, switch to **Konva** (with `vue-konva`). It provides layers, opacity, shadow and glow, and tweening, and the redraw-from-state design carries over unchanged.

## Training tool 2: attacker counts

Each square can show how many pieces attack it:

- **Bottom-left corner, green:** the number of **your** pieces (your chosen color) that attack the square.
- **Bottom-right corner, red:** the number of the **opponent's** pieces that attack it.
- **When no piece is selected,** the whole square is tinted:
  - **green** if you have more attackers (you control it),
  - **red** if the opponent has more (you're losing it),
  - no tint if the counts are equal, including zero to zero.
- **When a piece is selected,** the move-preview colors take over the square tints. The corner numbers stay visible.
- "You" is your chosen color, so the green and red sides never swap during a game.

### Definitions (v1)

**"Attacks"** means the piece could capture on that square if an enemy piece stood there:
- Pawns attack diagonally only. Their forward pushes don't count.
- Pieces attacking a square occupied by their own side count. That's **defense**.
- Pinned pieces still count in v1. Excluding them could be a toggle later.
- Kings count.
- Sliding pieces stop at the first piece in the way, so **no x-rays** in v1. A rook behind a rook counts once. Counting batteries is a later toggle.

The counts are computed on the client from the current position. They are not stored.

### Known limitation

More attackers isn't the same as winning the square: a pawn attacking a square defended by two queens still wins material there. v1 shows raw counts, labelled as counts. A later version can weight them by piece value (static exchange evaluation). That's still structural information, not an engine.

### Display

- Counts on all 64 squares could be noisy. Provide a toggle with three modes: off, occupied squares only, all squares.
- Use colors that hold up for color-blind users. Pair red and green with the corner position (left is you, right is them) so color isn't the only signal.

## Accounts and authentication

Each person has their own account, and all games belong to one user. There are three login methods, all planned:

1. **Django session login (now, for dev).** DRF requires a logged-in user on every endpoint by default, using `SessionAuthentication` and `IsAuthenticated`. Log in through `/api-auth/login/` or `/admin/`. The client needs a login page, and axios must send cookies (`withCredentials`) and the CSRF token header.
2. **JWT.** Token login for the SPA via `djangorestframework-simplejwt`: access and refresh tokens, refresh rotation, and token blacklisting on logout. Sessions stay enabled for the admin.
3. **Google sign-in.** Google Identity Services issues an ID token, which the server verifies and exchanges for our JWT. A matching account is created on first sign-in. Use `django-allauth` with `dj-rest-auth`, or verify the token directly with `google-auth`. Decide when the work starts.

Also needed:
- sign-up (username, email, password) for non-Google users,
- logout,
- a "me" endpoint,
- password reset later.

**Upgrade first:** the server runs **Django 4.0 on Python 3.8**, both past end of life. Current releases of the JWT and Google auth libraries expect newer Django. Upgrading to a supported Django LTS (and the Python it requires) is part of Phase 0.

## Fair play constraints

These follow from [FAIR_PLAY.md](../FAIR_PLAY.md) and the hard rule in CLAUDE.md:

- **No engine evaluation, best-move hints, or "blunder alerts" on positions the user plays on the local board.** The training tools describe the position. They don't recommend a move.
- **No FEN or PGN import, screen capture, extension, or overlay on other sites.** Positions enter only by playing moves on our board.
- **Remaining risk:** a user could copy a live game by hand onto the local board, and any analysis board allows this. The fair play policy forbids it, and keeping engines out limits how useful it would be. Revisit before adding any feature that gives positional *advice*.
- Engine-backed AI opponents exist only inside Training games that BlunderProof creates. They never analyze arbitrary user positions.

## Phases

| Phase | Scope |
|---|---|
| **0. Foundation** | Upgrade Django and Python. Add `chess.js` and `python-chess`. Build the `Game`/`Move` models and API (data plan). Client login page plus session auth. Sign-up. |
| **1. Playable local board** | Color choice and orientation, legal moves, turns, promotion, game-end detection, games list, save and load. Move list and history navigation. |
| **2. Training tool 1** | Canvas layer rework (DPR, resize, redraw from state). Move preview tints and arrows. Right-click annotations with opacity and glow. |
| **3. Training tool 2** | Attacker counts, square tints, display toggle. |
| **4. Auth, part 2** | JWT for the SPA, then Google sign-in. |
| **5. Polish** | Drag and drop, knight L-arrows, animations, sounds, responsive board size, Playwright smoke test of a full game. |

## Future: Training (campaign vs AI)

**The long-run product is a solo training game:** you play against bots that get harder as you get better, inside an app with enough color, flavor and progression that people want to open it every day. It should feel like a game and work like a training tool.

A separate Django app, `training`, holds the server side. On the client, the matching Pinia groups are `campaign`, `progress` and `settings` (see `client/src/stores/CONTEXT.md`).

**Opponents**
- **A ladder of bots of increasing difficulty.** For example, a UCI engine such as Stockfish run server-side with limited skill and depth, or a custom engine.
- **Bots with personality:** a name, a portrait, a playing style (aggressive, solid, tricky) and a few lines of flavor text. A "boss" bot ends each tier.
- The engine only **plays** the bot's moves. Its evaluations and suggestions are never shown to the player (see [Fair play](#fair-play-constraints)).

**Runs and progression**
- **Roguelike runs:** go deep through the ladder. Losing ends the run, and what you earned carries over.
- **Training aids as in-game resources:** move preview, attack counts, the threat list and the battle board are available, limited, or unlocked over time. They fade as the player levels up, following the [training goal](#training-goal).
- **RNG card system:** cards that give buffs or rule twists for a run or a game. For example, attack counts for N turns, an extra undo, or one free battle-board peek. Effects stay inside Training games.

**Achievements and rewards**
- First win, flawless game, win without losing a piece, beat a boss without any aids, and so on.
- **Visualization score:** prediction accuracy over time (guess the battle result, then reveal), so improvement is visible.
- Cosmetic rewards: board and piece themes, bot portraits, titles.

**Coming back every day**
- Short sessions: a game against one bot fits in a few minutes.
- A daily challenge (one position or one bot) and streaks.
- Color and flavor throughout: themes, sounds, move and capture animations, celebrations for wins and achievements.

**Later still:** a variations tree on the local board instead of truncating. Possibly PGN import of games that are verifiably finished.

## Open questions

1. Should the manual "flip board" view button exist at all, or is the board always fixed to your color?
2. Google sign-in: `django-allauth` + `dj-rest-auth` (more features, more moving parts), or `google-auth` token verification only (smaller)?
