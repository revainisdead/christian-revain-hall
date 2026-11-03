# Shortcuts for docker-scripts/. The scripts do the real work; run them directly for more options.
#
# Environment selection works the same as the scripts:
#   make dev            dev (or whatever COMPOSE_FILE in .env says)
#   make dev PROD=1     force prod     make dev PROD=0     force dev

SCRIPTS := ./docker-scripts

# Pass PROD through to the scripts (empty = let COMPOSE_FILE / defaults decide).
export PROD

# Plain `docker compose` for commands that have no script, matching docker-scripts/utils.
COMPOSE_1 := docker compose -f docker-compose.yml -f docker-compose.prod.yml
COMPOSE_0 := docker compose -f docker-compose.yml -f docker-compose.override.yml
COMPOSE   := $(or $(COMPOSE_$(PROD)),docker compose)

.DEFAULT_GOAL := help
.PHONY: help dev rebuild-env refresh-client-modules update setup up start stop restart restart-client restart-server down cleanup logs migrate makemigrations superuser seed create-game demo-game console shell lint \
        check flake8 pipcheck test e2e ci

help: ## List targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

# After a build, refresh-client-modules drops the client container + its node_modules volume so the
# start that follows refills it from the new image. Data volumes (database, static) are never touched.

dev: ## Build images, (re)start everything on them in the background, follow the last 20 log lines
	$(SCRIPTS)/setup --skip-install
	@$(MAKE) --no-print-directory refresh-client-modules
	$(SCRIPTS)/start -d
	$(COMPOSE) logs -f --tail 20

rebuild-env: ## Rebuild images and restart containers on them (setup --skip-install --skip-db)
	$(SCRIPTS)/setup --skip-install --skip-db
	@$(MAKE) --no-print-directory refresh-client-modules
	$(SCRIPTS)/start -d

refresh-client-modules: ## Drop the client container + node_modules volume (refilled from the image on next start)
	bash -c 'source $(SCRIPTS)/utils && refresh_client_modules'

update: ## Pull newer base images, rebuild, restart on them, migrate. Safe while running; keeps data
	$(SCRIPTS)/update --skip-cleanup

setup: ## First-time machine setup: installs Docker via apt/sudo, then builds
	$(SCRIPTS)/setup

up: ## Start everything in the background (recreates containers whose image or .env changed)
	$(SCRIPTS)/start -d

start: ## Start everything and follow logs in the foreground
	$(SCRIPTS)/start

stop: ## Stop all containers (they still exist and hold their volumes)
	$(SCRIPTS)/stop

restart: ## Restart all containers as-is (after editing .env use `make up`, which recreates them)
	$(COMPOSE) restart

restart-client: ## Restart the client dev server (e.g. Vite gets stuck on new files)
	$(COMPOSE) restart client

restart-server: ## Restart the Django server
	$(COMPOSE) restart server

down: ## Stop and remove containers + network (named volumes are kept)
	$(COMPOSE) down --remove-orphans

cleanup: ## Remove this project's containers, unused volumes (not the db) and dangling images; asks first
	$(SCRIPTS)/cleanup

logs: ## Follow logs (last 20 lines)
	$(COMPOSE) logs -f --tail 20

migrate: ## Run Django migrations
	$(SCRIPTS)/migrate

makemigrations: ## Generate Django migrations
	$(SCRIPTS)/migrate make

superuser: ## Create a Django superuser (interactive; run `make migrate` first)
	$(SCRIPTS)/manage -u

seed: ## DEV: superuser $(USER) / password 'a' (or $$DEV_USER_PASSWORD) + the demo game
	$(SCRIPTS)/manage seed_dev_user $(GAME_USER) --email $(GAME_USER)@example.com
	$(MAKE) demo-game

# `make create-game` options. GAME_USER defaults to your shell username.
GAME_USER  ?= $(USER)
GAME_COLOR ?= white
GAME_MOVES ?=

create-game: ## Create a local game: GAME_USER, GAME_COLOR=white|black, GAME_MOVES="e2e4 e7e5"
	$(SCRIPTS)/manage seed_game $(GAME_USER) --color $(GAME_COLOR) $(if $(GAME_MOVES),--moves "$(GAME_MOVES)")

demo-game: ## Create a ready-made game for you: Sicilian as Black (1.e4 c5 2.Nf3 d6)
	$(SCRIPTS)/manage seed_game $(GAME_USER) --color black --moves "e2e4 c7c5 g1f3 d7d6" --title "Sicilian demo"

console: ## Bash shell in the server container
	$(SCRIPTS)/console

shell: ## Django shell in the server container
	$(SCRIPTS)/console py

lint: ## ESLint the client
	$(SCRIPTS)/lint

# --- Checks: run inside the running containers (start them with `make up` / `make dev`) ---

SERVER := $(COMPOSE) exec server

check: ## Django system check + fail on model changes without migrations
	$(SERVER) ./manage.py check
	$(SERVER) ./manage.py makemigrations --check --dry-run

flake8: ## Lint the server (flake8, setup.cfg rules)
	$(COMPOSE) exec -w /srv/app server flake8 server --config setup.cfg

pipcheck: ## Verify installed Python packages have compatible dependencies
	$(SERVER) pip check

test: ## Server tests (pytest; uses a separate test database). Extra args: make test ARGS="-k stalemate"
	$(SERVER) pytest $(ARGS)

e2e: ## Playwright tests (chromium) against a fresh production build, like CI. Extra args: ARGS=...
	$(COMPOSE) exec client sh -c "npm run build && npx playwright test --project=chromium $(ARGS)"

ci: check flake8 pipcheck test lint ## Everything CI runs for the server, plus client lint
