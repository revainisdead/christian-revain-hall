# CLAUDE.md

BlunderProof: a chess training tool. Vue 3 + Quasar client, Django REST Framework server, PostgreSQL, all run through Docker Compose.

## Product rule: no cheating vector (hard constraint)

BlunderProof must never be usable for assistance during a live game (Chess.com, Lichess, over the board, or anywhere else). See `FAIR_PLAY.md`. When designing or building features:

- Do not add anything that takes in an external, in-progress game position and returns moves, evaluations, hints, or threat arrows. This includes FEN/PGN paste-for-analysis on live positions, screen or board capture, browser extensions, overlays on other sites, and public engine APIs.
- Analysis and hints should only apply to positions BlunderProof generates itself (training exercises, games against the tool), or to games that have finished.
- If a requested feature could work as live outside assistance, point that out before building it.

## Plans

- `plans/training-tool-plan.md`: the local board and its training tools (color choice, history navigation, move preview and arrows, attacker counts), auth, phases, and the future `training` campaign.
- `plans/ui-plan.md`: client steps in order (first move and controls, chess.js rules, saving via the API, orientation, the arrow system, attacker counts).
- `plans/chess-data-plan.md`: storage design (Game → Move with FEN per move, no per-piece rows) and the games API.
- `plans/backend-tech-plan.md`: ordered backend work with code requirements (framework upgrade, legacy app removal, auth endpoints, games/moves API, tests, JWT, Google).
- `plans/attack-map-plan.md`: move preview (arrows per direction, capture marks), the attack-count layer, and the "Pieces under attack" list (all done), plus what's next.
- `plans/deploy-plan.md`: run on the existing EC2 box with the docker-scripts, then HTTPS, backups, push-to-deploy, CI-built images, and Terraform (import first, replace later).

## Layout

- `client/`: Quasar app (Vite, TypeScript, `<script setup>`)
  - `src/pages/LoginPage.vue` (`/#/login`): a dev-only username/password box (shown when the server's `PASSWORD_LOGIN_ENABLED`) and a Google sign-in box (Google Identity Services, when `GOOGLE_CLIENT_ID` is set). The page reads both from `GET /api/auth/config/`.
  - `src/router/index.ts`: a guard sends logged-out users to `/login`. Routes are login-only unless `meta.public`.
  - `src/stores/auth/index.ts`: Pinia auth store (`fetchMe`, `login`, `googleLogin`, `logout`); session cookies plus CSRF.
  - Stores live in `src/stores/`, one folder per group (`auth/`, `board/`, ...); read `src/stores/CONTEXT.md` before adding state. Always create distinct, encapsulated groups for parts of the app; never pile unrelated state into one store. `quasar.config.js` sets `sourceFiles.store: 'src/stores/index'`. Without it Quasar 1.x looks for `src/store/` and never installs Pinia. The router guard calls `useAuthStore(store)` with the instance Quasar passes in.
  - `src/pages/IndexPage.vue`: the board plus two control cards: **Moves** (start/back/forward/end, move list, arrow keys) and **Arrows (testing)** (draw by squares, sample set, undo, clear). The page keeps only layout, click-to-move and keyboard shortcuts; each piece is its own component so parallel work doesn't collide in one file.
  - Page pieces in `src/components/`: `PlayerRow.vue`, `MoveControls.vue` (the Moves card; takes the `game` from `useBoardHistory`), `ArrowControls.vue` (`v-model:arrows`), and `PromotionDialog.vue` / `TruncateDialog.vue` (each exposes a promise-returning `ask()` and `open`).
  - `src/settings.ts`: global client settings, set at build time from the root `.env` through `quasar.config.js` `env`. `ENABLE_SAMPLE_GAME_LOAD` starts the board on `src/samples/sample-game.json` (Morphy's Opera Game, one move before White's `Rd8#`). When unset it's on in dev and off in builds; `make e2e` forces it off. Chess facts in sample JSON are generated and checked with python-chess.
  - `src/components/useBoardHistory.ts`: chess.js move history plus a `ply` cursor (`check`, `move`, `back`, `forward`, `goTo`, `status`). Game end matches the server's `board.outcome()` (no claims): threefold and 50-move only mark a draw as claimable.
  - `src/components/ChessPiece.vue` keeps a `fileUrl` / `import.meta.url` reference line on purpose. Don't remove it.
  - `src/components/ChessBoard.vue`: 8x8 CSS grid; takes `position` (`{ e4: 'w_pawn', ... }`, default the starting position), `selected`, `highlights`, `check`, `targets` (preview dots) and `victims` (capture marks), and emits `square-click`
  - `src/components/attackMap.ts`: attack-count layer and threat list logic (`squareCounts`, `exchangeLoss`, `threatsTo`), fed by `useBoardHistory.attackers`. UI in `AttackControls.vue` (Counts / You are dropdowns) and `ThreatList.vue` (left of the board).
  - `src/pages/BattlePage.vue` (`/#/battle?board=<FEN placement>&square=`): a bare, control-less board in its own tab, opened by the eye button on a "Pieces under attack" row. It only draws the board it's given; the board page works out the battle (`battleOn`). Keep it analysis-free.
  - `src/components/movePreview.ts`: `previewArrows(from, moves)` turns `useBoardHistory.previewMoves(from)` into one arrow per direction (one per knight jump).
  - `src/components/BoardPiece.vue`: one board square (PNG background); `ChessPiece.vue`: one piece (PNG `<img>`)
  - `src/components/chessAssets.ts`: piece/position types, `startingPosition()`, and image path helpers
  - `src/components/ChessOverlay.vue`: transparent canvas over the board. Takes an `arrows` prop (`{ from, to, color? }[]`) and redraws from it on every change, never incrementally. Arrows have a `kind` (`test`, `preview`) that sets their style. `data-arrow-count` and `data-arrows` (sorted `from-to-kind` JSON) are for tests.
  - `public/JohnPablok Cburnett Chess set/`: piece and square art (PNGs in several sizes, plus SVGs). The board uses `PNGs/With Shadow/128px` pieces and `PNGs/No shadow/128h` brown squares.
- `server/`: Django project `blunderproof` (settings, root URLs, user/group viewsets)
  - `chess_local/`: local (same-screen) games. `Game` (owner, `user_color`, `start_fen`, status) has many `Move`s (`ply`, `uci`, `san`, `fen_after`).
    - All python-chess rules logic is in `services.py` (`append_move`, `truncate_after`, `board_at`). Views stay thin.
    - `board_at` replays moves from `start_fen` (needed for threefold detection) rather than loading a stored FEN.
    - `manage.py seed_game <user> [--color] [--moves "e2e4 e7e5"]` creates a game.
  - `accounts/`: `BpUser` custom user model (`AUTH_USER_MODEL`), plus the auth endpoints (session and JWT).
  - `training` (future): the long-run solo game: a roguelike campaign against bots of rising difficulty, with achievements and progression (see the training-tool plan). Don't use that name for anything else.
  - Don't name a Django app `chess`; it would shadow the python-chess package (`import chess`).
- `docker-scripts/`: wrappers around `docker compose` (`setup`, `start`, `stop`, `migrate`, `manage`, `lint`, `npm`, `console`, ...). Run with `-h` for usage.
- `dockerfiles/`: `Dockerfile-server` (Python 3.12, Django 5.2 LTS), `Dockerfile-client` (Node 20 + Playwright Chromium), db, nginx.

## Docker Compose files

- `docker-compose.yml`: base services shared by all environments (server, client, db, volumes, network). Never used alone.
- `docker-compose.override.yml`: dev (runserver, `npm run dev`, DEBUG on). `docker compose` loads it automatically.
- `docker-compose.prod.yml`: prod (gunicorn, DEBUG off, one-shot `npm run build` into `client/dist/spa`, nginx serving it and proxying `/api/` to the server).
- Choosing an environment: on the prod server set `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` in `.env`. `PROD=1` / `PROD=0` on any `docker-scripts/*` command forces prod or dev (`docker_compose` in `docker-scripts/utils`).
- Put shared settings in the base file and only differences in the overrides. Compose appends list fields like `ports`, so keep those out of the base.

## URLs and ports

- Client dev server: http://127.0.0.1:8007 (container port 9000)
- Django: http://127.0.0.1:8008 (container port 8000)
- API routes (`server/blunderproof/urls.py`):
  - `/api/games/` and `/api/games/{id}/moves/`: POST `{uci, ply}`; DELETE `?after=<ply>`
  - `/api/auth/{config,csrf,google,register,login,logout,me}/` (session) and `/api/auth/token/{,refresh/,blacklist/}` (JWT)
  - Password endpoints (`login`, `register`, `token`) return 404 unless `PASSWORD_LOGIN_ENABLED`, which defaults to DEBUG.
  - `google` verifies the ID token against `GOOGLE_CLIENT_ID`, finds the user by `BpUser.google_sub` (or links by verified email, or creates one), and starts a session.
  - `/api/accounts/{users,groups,...}/` (staff only), `/admin/`, `/api-auth/`
- Auth: DRF requires login by default (`IsAuthenticated`). Logged-out requests get **401**, because JWT is the first auth class. Querysets are scoped to `request.user`, so other users' objects return 404. Real users sign in with Google; username/password is for dev.
- The client uses the axios `api` instance in `client/src/boot/axios.ts`: same-origin `/api`, cookies, and the CSRF header.

## Commands

Normal development happens in Docker. `make help` lists shortcuts for `docker-scripts/` (`make dev`, `make rebuild-env`, `make logs`, ...); `PROD=1`/`PROD=0` work there too.

```bash
make dev                          # build, (re)start on the new images, follow logs
make update                       # pull + rebuild + restart on new images + migrate; safe while running, keeps data
make rebuild-env                  # rebuild + restart on new images (no pull, no migrate)
make seed                         # DEV: superuser $USER / password `a` + the demo game
make restart-client               # e.g. Vite stuck on newly created files; .env changes need `make up` instead
make migrate / make makemigrations
make ci                           # check + flake8 + pipcheck + test + client lint (in running containers)
make test ARGS="-k stalemate"     # pytest in the server container (separate test database)
make e2e                          # Playwright on a fresh production build in the client container, like CI (auth API mocked in tests/mockApi.ts)
make demo-game                    # ready-made game for you (Sicilian as Black); make create-game for custom
```

Checks (`check`, `flake8`, `pipcheck`, `test`, `lint`, `e2e`) run inside the running containers. After changing `requirements*.in`, `package.json` or a Dockerfile, run `make update` (or `make dev`) before running them. A build alone doesn't change running containers.

Volumes are all named: `christian-hall_db-volume` (mounted at Postgres's data dir, which contains PGDATA), `christian-hall_static-volume`, and `christian-hall_client-node-modules`. After a build, `refresh_client_modules` (in `docker-scripts/utils`; also `make refresh-client-modules`) deletes the client container and its node_modules volume so the next start refills it from the new image. Never let the database live in an anonymous volume.

Don't run Playwright against the Vite dev server from inside the client container. Its HMR socket points at host port 8007, and inside the container that makes Vite reload the page every second.

The host `client/node_modules` is a root-owned stub created by the container's anonymous volume. Don't `npm install` into it on the host. To run client tooling outside Docker, copy `client/` (without `node_modules`/`dist`) somewhere else and run `npm ci` there.

Config comes from the root `.env` (gitignored, loaded via `env_file`). `SECRET_KEY` is required; see `.env.example`.

Server env vars: `SECRET_KEY` and `DATABASE_URL` are required. `DEBUG=true` in dev. `ALLOWED_HOSTS` and `CSRF_TRUSTED_ORIGINS` are comma-separated, with dev defaults when DEBUG is on.

## Dependencies

- Python: edit `server/requirements.in` / `dev-requirements.in` (pinned), then pip-compile. The compiled `.txt` files are not committed.
- Node: `client/package.json` + `package-lock.json`. Node 20 is the target (Docker and CI).

## CI (`.github/workflows/`)

- All workflows live in the repo-root `.github/workflows/`. GitHub ignores workflow files anywhere else, including `client/.github`.
- `server.yml`: `python:3.12` container + Postgres 16 service. Runs `manage.py check`, `makemigrations --check`, flake8 (blocking), and pytest.
- `client.yml`:
  - `build` job: Node 20, `npm ci`, lint, build.
  - `e2e` job: build, then the Playwright smoke test (chromium). Playwright serves `dist/spa` itself unless `BASE_URL` is set.
- Both run on pushes and PRs to `master` and `develop`, filtered by path.

## Conventions

- Work happens on `develop`; `master` is the stable branch.
- Python: flake8 config in `setup.cfg` (max line 99; migrations excluded). Tests use pytest + pytest-django + model-bakery and live in `<app>/tests/test_*.py`.
- Chess facts in tests (mate, stalemate, legality) are asserted with python-chess (`board.is_stalemate()` and so on), not worked out by hand.
- Client: ESLint + Prettier (`client/.eslintrc.cjs`, `.prettierrc`), Composition API with `<script setup lang="ts">`. Components are imported via the `components/` alias.
- Get the user model through `get_user_model()`.
- Keep `makemigrations --check` clean (CI enforces it).
