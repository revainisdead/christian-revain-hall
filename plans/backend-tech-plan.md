# Backend Tech Plan

Status: steps 1–6 implemented on `develop` (2026-11-03). Step 7 (Google sign-in) is next. Concrete code requirements for the server, in order. Product behavior is in [training-tool-plan.md](training-tool-plan.md); the data design is in [chess-data-plan.md](chess-data-plan.md).

Each step should be its own branch or PR off `develop`, with CI green before merging.

## Step 1: Upgrade the framework (done)

The server runs Python 3.8 and Django 4.0.1, both past end of life. The auth libraries for later steps need a current Django.

**Targets:**
- **Python 3.12.** Django 5.2 needs Python 3.10 or newer.
- **Django 5.2 LTS,** supported until April 2028.

**Requirements (`server/requirements.in`):**

| Package | Now | Change |
|---|---|---|
| Django | 4.0.1 | 5.2.x |
| djangorestframework | 3.14.0 | latest that supports Django 5.2 |
| psycopg2-binary | 2.9.1 | replace with `psycopg[binary]` (v3). Django supports it natively, and the engine name stays `postgresql`. |
| dj-database-url | 0.5.0 | latest |
| django-environ | 0.8.1 | **remove** (unused: settings read `os.environ` directly) |
| gunicorn | 20.1.0 | latest |
| pytest-django, model-bakery | old | latest |
| django-debug-toolbar, flake8 (dev) | old | latest |
| `chess` (python-chess) | none | **add** (needed in step 4) |

**Code and infrastructure changes:**
- `dockerfiles/Dockerfile-server`: change the base to `python:3.12-slim-bookworm`.
  - Delete the Debian *stretch* archive `sed` workaround.
  - Trim the apt list to what is still needed: `libpq-dev` and `build-essential` at most. psycopg 3 binary needs neither.
  - Drop the `setuptools==50.1.0` pin.
- `.github/workflows/server.yml`: `container: python:3.12`. Drop the `setuptools<70` pin.
- `blunderproof/settings.py`: run `manage.py check --deploy` and fix the warnings that apply. Read through the Django 4.1 to 5.2 release notes for removed settings.
- `CLAUDE.md`: update the Python and Django versions.

**Done when:**
- CI is green.
- `make rebuild-env`, `make dev`, and `make migrate` work.
- `manage.py check` is clean.

## Step 2: Remove legacy apps (done)

`bank`, `blog`, and `api` are unused.

- `INSTALLED_APPS`: remove `bank`, `blog`, `api`.
- `blunderproof/urls.py`: remove the `bank.urls` import and the `bank-api/` route.
- `blunderproof/serializers.py`: remove `BankAccountSerializer` and the `bank_accounts` fields from the user serializers.
- Delete the `server/bank/`, `server/blog/`, and `server/api/` directories.
- Dev database: the old `bank_*` tables can be dropped, or the database reset (the data is test-only).
- `CLAUDE.md`: remove the legacy-app note.

**Done when:** `grep -rn "bank\|blog" server` returns nothing, and CI is green.

## Step 3: Settings and session auth endpoints (done)

### Settings

| Setting | Requirement |
|---|---|
| `DEBUG` | Keep: env `DEBUG=true`. |
| `ALLOWED_HOSTS` | From env, comma-separated. Default `localhost,127.0.0.1` when `DEBUG`. |
| `CSRF_TRUSTED_ORIGINS` | From env. Dev: `http://127.0.0.1:8007,http://localhost:8007`. |
| `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | `True` when not `DEBUG`. |
| `STATIC_ROOT` | Set (for example `/srv/app/static`) so `collectstatic` works for admin and DRF assets in prod. |

The client talks to the API on the same origin through the Quasar dev proxy (`/api` → `crh-server-net:8000`) in dev and through nginx in prod. That means **no CORS setup is needed.**

In prod, nginx must also proxy `/admin/`, `/api-auth/`, and `/static/`. Today it only proxies `/api/`.

### Auth API (in the `accounts` app, `accounts/urls.py`, mounted at `/api/auth/`)

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/auth/csrf/` | Sets the CSRF cookie (`ensure_csrf_cookie`). Returns 204. |
| POST | `/api/auth/register/` | `{username, email, password}`. Runs Django's password validators, creates the user, logs them in. Returns 201 with `me`. `AllowAny`. |
| POST | `/api/auth/login/` | `{username, password}`. Returns 200 with `me`, or 400 on bad credentials. `AllowAny`. |
| POST | `/api/auth/logout/` | Returns 204. |
| GET | `/api/auth/me/` | `{id, username, email}`, or 401 when logged out (JWT is the first auth class, so DRF answers 401). |

**Requirements:**
- Use `django.contrib.auth.authenticate`, `login`, and `logout`. No custom password handling.
- Write a serializer for each request body.
- Override `permission_classes` only on `csrf`, `register`, and `login`. Everything else keeps the global `IsAuthenticated`.
- The client axios boot (`client/src/boot/axios.ts`) sets `baseURL: '/api'`, `withCredentials: true`, `xsrfCookieName: 'csrftoken'`, and `xsrfHeaderName: 'X-CSRFToken'`.

**Done when** tests in `accounts/tests/` cover:
- register (success, duplicate username, weak password),
- login (success, bad password),
- `me` both logged in and logged out,
- logout.

## Step 4: Games and moves (`chess_local`) (done)

This step implements [chess-data-plan.md](chess-data-plan.md).

### Models (`chess_local/models.py`)

- Replace `ChPiece`, `ChPlayer`, `ChGame`, and `TrainingGrounds` with `Game` and `Move`, exactly as specified in the data plan:
  - `Game.owner`, `Game.user_color`, `start_fen`, status and result fields, timestamps,
  - `Move` with `UniqueConstraint(game, ply)`.
- Add migration `0002` that drops the old tables and creates the new ones. The dev database keeps working without a reset.
- Register both models in `chess_local/admin.py`, with moves shown inline on the game.

### Rules logic (`chess_local/services.py`)

All python-chess usage lives in this one module. Views stay thin.

```python
class IllegalMove(Exception): ...
class PlyConflict(Exception): ...

def board_at(game: Game, ply: int | None = None) -> chess.Board: ...
    # board from start_fen + moves up to ply (None = latest), or from that move's fen_after

@transaction.atomic
def append_move(game: Game, uci: str, ply: int) -> Move:
    # 1. Game.objects.select_for_update().get(pk=game.pk)
    # 2. ply must equal move count + 1, else PlyConflict
    # 3. board = board_at(game); move = chess.Move.from_uci(uci); must be in board.legal_moves, else IllegalMove
    # 4. san = board.san(move); board.push(move); create Move(uci, san, fen_after=board.fen())
    # 5. if board.outcome(claim_draw=True): set Game.status and result_reason

@transaction.atomic
def truncate_after(game: Game, ply: int) -> None:
    # delete moves with ply > ply; reset status to IN_PROGRESS when moves are removed
```

### API (`chess_local/views.py`, `serializers.py`)

`GameViewSet` (a `ModelViewSet`) is registered at `/api/games/`:
- `get_queryset()` returns `Game.objects.filter(owner=self.request.user)`, so other users' games return 404.
- `perform_create()` sets `owner=self.request.user`.
- **List** uses a light serializer without moves. **Retrieve** includes `moves` (ordered).
- **Create** takes `{user_color, title?}`.
- An `@action(detail=True, methods=["post", "delete"], url_path="moves")` handles moves:
  - POST `{uci, ply}` calls `append_move`. It returns 201 with the move, or 400 for `IllegalMove` / bad UCI, or 409 for `PlyConflict`.
  - DELETE `?after=<ply>` calls `truncate_after`. It returns 204.
- Remove `TrainingGroundsViewSet` and the `training_grounds` route.

### Commands and make targets

- Replace `create_chess_game` with `seed_game <username> [--moves "e2e4 e7e5 g1f3"] [--color white|black]`. It goes through `append_move`, so seeded games are valid.
- Update `make create-game` to call `seed_game`.

### Tests (`chess_local/tests/`)

- **services:**
  - a legal move is stored with the correct SAN and FEN,
  - an illegal move raises,
  - a ply conflict raises,
  - promotion (`e7e8q`), castling (`e1g1` → `O-O`), and en passant work,
  - checkmate (fool's mate) sets `BLACK_WON` / `checkmate`, and stalemate sets `DRAW`,
  - truncation deletes later moves and resets the status.
- **API:**
  - logged out returns 401,
  - another user's game returns 404,
  - the create, retrieve, append, and truncate flows work,
  - the error codes (400 and 409) are returned correctly.

## Step 5: Testing and lint baseline (done)

- Switch the test runner to **pytest** (`pytest-django` is already a dependency).
  - Add a `pytest.ini` or `[tool:pytest]` `DJANGO_SETTINGS_MODULE = blunderproof.settings`.
  - CI runs `pytest`.
- Use **model-bakery** for test fixtures.
- Fix the existing flake8 findings, then make the CI flake8 step blocking (remove `continue-on-error`). Optionally replace flake8 with **ruff** (lint and format in one tool).
- Coverage report in CI: informational, not a gate.

## Step 6: JWT (done)

- Add `djangorestframework-simplejwt` with these endpoints:
  - `/api/auth/token/` (obtain),
  - `/api/auth/token/refresh/`,
  - `/api/auth/token/blacklist/` (logout). This needs `rest_framework_simplejwt.token_blacklist` in `INSTALLED_APPS`.
- Settings:
  - short access-token lifetime (5–15 minutes) and a longer refresh lifetime,
  - `ROTATE_REFRESH_TOKENS` and `BLACKLIST_AFTER_ROTATION` set to `True`.
- `DEFAULT_AUTHENTICATION_CLASSES`: JWT first, session second, so the admin and the browsable API keep working.
- Decide where the client keeps tokens: memory plus an httpOnly refresh cookie (preferred), or `localStorage`.

## Step 7: Google sign-in

- The client gets a Google ID token from Google Identity Services.
- `POST /api/auth/google/` with `{credential}`:
  1. The server verifies the token (audience = our client ID, issuer = Google).
  2. It finds or creates the user by verified email.
  3. It returns our JWT pair.
- The library is still open: `django-allauth` + `dj-rest-auth` (more features), or `google-auth` verification only (smaller).
- Store `GOOGLE_CLIENT_ID` in `.env` and `.env.example`.

## Later

- **The `training` app** (roguelike campaign against AI). It gets its own plan when it starts.
- **Remove the `TEST DJ CONFIG` print in settings before going to production.** It writes the database password to the logs.
