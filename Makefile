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
.PHONY: help dev rebuild-env setup up start stop logs migrate makemigrations console shell lint

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

stop: ## Stop all containers
	$(SCRIPTS)/stop

logs: ## Follow logs (last 20 lines)
	$(COMPOSE) logs -f --tail 20

migrate: ## Run Django migrations
	$(SCRIPTS)/migrate

makemigrations: ## Generate Django migrations
	$(SCRIPTS)/migrate make

console: ## Bash shell in the server container
	$(SCRIPTS)/console

shell: ## Django shell in the server container
	$(SCRIPTS)/console py

lint: ## ESLint the client
	$(SCRIPTS)/lint
