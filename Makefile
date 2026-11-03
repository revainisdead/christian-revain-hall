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
.PHONY: help dev rebuild-env setup up start stop down cleanup logs migrate makemigrations superuser create-game console shell lint \
        check flake8 pipcheck test e2e ci

help: ## List targets
	@grep -E '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

dev: ## Build images, start everything in the background, follow the last 20 log lines
	$(SCRIPTS)/setup --skip-install
	$(SCRIPTS)/start -d
	$(COMPOSE) logs -f --tail 20

rebuild-env: ## Rebuild images only (setup --skip-install --skip-db)
	$(SCRIPTS)/setup --skip-install --skip-db

setup: ## First-time machine setup: installs Docker via apt/sudo, then builds
	$(SCRIPTS)/setup

up: ## Start everything in the background
	$(SCRIPTS)/start -d

start: ## Start everything and follow logs in the foreground
	$(SCRIPTS)/start

stop: ## Stop all containers (they still exist and hold their volumes)
	$(SCRIPTS)/stop

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

# `make create-game` options. GAME_USER defaults to your shell username.
GAME_USER  ?= $(USER)
GAME_COLOR ?= white
GAME_MOVES ?=

create-game: ## Create a local game: GAME_USER, GAME_COLOR=white|black, GAME_MOVES="e2e4 e7e5"
	$(SCRIPTS)/manage seed_game $(GAME_USER) --color $(GAME_COLOR) $(if $(GAME_MOVES),--moves "$(GAME_MOVES)")

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

e2e: ## Playwright smoke test (chromium) against the running dev client
	$(COMPOSE) exec -e BASE_URL=http://localhost:9000 client npx playwright test --project=chromium $(ARGS)

ci: check flake8 pipcheck test lint ## Everything CI runs for the server, plus client lint
