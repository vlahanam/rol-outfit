COMPOSE = docker compose -f docker/docker-compose.yml --env-file docker/.env

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

build:
	$(COMPOSE) build

rebuild:
	$(COMPOSE) up -d --build

ps:
	$(COMPOSE) ps

db-shell:
	$(COMPOSE) exec db psql -U $${DB_USER} -d $${DB_NAME}

backend-shell:
	$(COMPOSE) exec backend sh

frontend-shell:
	$(COMPOSE) exec frontend sh

.PHONY: up down logs build rebuild ps db-shell backend-shell frontend-shell
