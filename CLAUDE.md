# CLAUDE.md

BlunderProof: a chess training tool. Vue 3 + Quasar client, Django REST Framework server, PostgreSQL, all run through Docker Compose.

## Product rule: no cheating vector (hard constraint)

BlunderProof must never be usable for assistance during a live game (Chess.com, Lichess, over the board, or anywhere else). See `FAIR_PLAY.md`. When designing or building features:

- Do not add anything that takes in an external, in-progress game position and returns moves, evaluations, hints, or threat arrows. This includes FEN/PGN paste-for-analysis on live positions, screen or board capture, browser extensions, overlays on other sites, and public engine APIs.
- Analysis and hints should only apply to positions BlunderProof generates itself (training exercises, games against the tool), or to games that have finished.
- If a requested feature could work as live outside assistance, point that out before building it.

## Plans

- `docs/training-tool-plan.md`: the local board and its training tools (color choice, history navigation, move preview and arrows, attacker counts), auth, phases, and the future `training` campaign.
- `docs/chess-data-plan.md`: storage design (Game → Move with FEN per move, no per-piece rows) and the games API.

## Layout

- `client/`: Quasar app (Vite, TypeScript, `<script setup>`)
  - `src/pages/IndexPage.vue`: currently hosts the board
  - `src/components/ChessPiece.vue` keeps a `fileUrl` / `import.meta.url` reference line on purpose. Don't remove it.
  - `src/components/ChessBoard.vue`: 8x8 CSS grid; takes a `position` prop (`{ e4: 'w_pawn', ... }`), defaulting to the starting position
  - `src/components/BoardPiece.vue`: one board square (PNG background); `ChessPiece.vue`: one piece (PNG `<img>`)
  - `src/components/chessAssets.ts`: piece/position types, `startingPosition()`, and image path helpers
  - `src/components/ChessOverlay.vue`: transparent canvas over the board for arrows (`drawArrow('e2', 'e4')`)
  - `public/JohnPablok Cburnett Chess set/`: piece and square art (PNGs in several sizes, plus SVGs). The board uses `PNGs/With Shadow/128px` pieces and `PNGs/No shadow/128h` brown squares.
- `server/`: Django project `blunderproof` (settings, root URLs, user/group viewsets)
  - `chess_local/`: local (same-screen) chess games. Current models are `ChPiece`, `ChPlayer`, `ChGame`, `TrainingGrounds`; `docs/chess-data-plan.md` replaces them with `Game`/`Move`. `manage.py create_chess_game <username>` seeds a starting-position game.
  - `accounts/`: `BpUser` custom user model (`AUTH_USER_MODEL`)
  - `api/`: app shell
  - `training` (future): roguelike campaign against AI with achievements. Don't use that name for anything else.
  - Don't name a Django app `chess`; it would shadow the python-chess package (`import chess`).
  - `bank/`, `blog/`: unused by BlunderProof and slated for removal. Don't build on them.
- `docker-scripts/`: wrappers around `docker compose` (`setup`, `start`, `stop`, `migrate`, `manage`, `lint`, `npm`, `console`, ...). Run with `-h` for usage.
- `dockerfiles/`: `Dockerfile-server` (Python 3.8), `Dockerfile-client` (Node 20 + Playwright Chromium), db, nginx.

## Docker Compose files

- `docker-compose.yml`: base services shared by all environments (server, client, db, volumes, network). Never used alone.
- `docker-compose.override.yml`: dev (runserver, `npm run dev`, DEBUG on). `docker compose` loads it automatically.
- `docker-compose.prod.yml`: prod (gunicorn, DEBUG off, one-shot `npm run build` into `client/dist/spa`, nginx serving it and proxying `/api/` to the server).
- Choosing an environment: on the prod server set `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml` in `.env`. `PROD=1` / `PROD=0` on any `docker-scripts/*` command forces prod or dev (`docker_compose` in `docker-scripts/utils`).
- Put shared settings in the base file and only differences in the overrides. Compose appends list fields like `ports`, so keep those out of the base.

## URLs and ports

- Client dev server: http://127.0.0.1:8007 (container port 9000)
- Django: http://127.0.0.1:8008 (container port 8000)
- API routes (`server/blunderproof/urls.py`): `/api/training_grounds/`, `/api/accounts/{users,groups,...}/`, `/admin/`, `/api-auth/`
- Auth: DRF requires login by default (`IsAuthenticated`). In dev, log in with a Django session via `/api-auth/login/` or `/admin/`. JWT and Google sign-in are planned.

## Commands

Normal development happens in Docker. `make help` lists shortcuts for `docker-scripts/` (`make dev`, `make rebuild-env`, `make logs`, ...); `PROD=1`/`PROD=0` work there too.

```bash
make dev                          # setup --skip-install, start -d, follow logs
docker-scripts/start              # docker compose up + follow logs (-d to detach)
docker-scripts/migrate            # migrate; `migrate make` / `migrate show`
docker compose exec server ./manage.py test
docker compose exec client npm run lint
```

The host `client/node_modules` is a root-owned stub created by the container's anonymous volume. Don't `npm install` into it on the host. To run client tooling outside Docker, copy `client/` (without `node_modules`/`dist`) somewhere else and run `npm ci` there.

Config comes from the root `.env` (gitignored, loaded via `env_file`). `SECRET_KEY` is required; see `.env.example`.

Server without Docker (what CI does): `SECRET_KEY` and `DATABASE_URL` are required, and sqlite works for quick checks:

```bash
cd server
pip-compile requirements.in -o requirements.txt && pip-compile dev-requirements.in -o dev-requirements.txt
pip-sync requirements.txt dev-requirements.txt
SECRET_KEY=dev DATABASE_URL=sqlite:////tmp/bp.sqlite3 python manage.py test
```

## Dependencies

- Python: edit `server/requirements.in` / `dev-requirements.in` (pinned), then pip-compile. The compiled `.txt` files are not committed.
- Node: `client/package.json` + `package-lock.json`. Node 20 is the target (Docker and CI).

## CI (`.github/workflows/`)

- `server.yml`: `python:3.8` container + Postgres 16 service. Runs `manage.py check`, `makemigrations --check`, and tests. Flake8 is report-only for now.
- `client.yml`: Node 20, `npm ci`, `npm run lint`, `npm run build`.
- Both run on pushes and PRs to `master` and `develop`, filtered by path.

## Conventions

- Work happens on `develop`; `master` is the stable branch.
- Python: flake8 config in `setup.cfg` (max line 99; migrations excluded).
- Client: ESLint + Prettier (`client/.eslintrc.cjs`, `.prettierrc`), Composition API with `<script setup lang="ts">`. Components are imported via the `components/` alias.
- Get the user model through `get_user_model()`.
- Keep `makemigrations --check` clean (CI enforces it).
