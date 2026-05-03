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

db-logs:
	$(COMPOSE) logs -f db

db-dump:
	$(COMPOSE) exec db pg_dump -U $${DB_USER} $${DB_NAME} > docker/backup_$$(date +%Y%m%d_%H%M%S).sql

db-restore:
	$(COMPOSE) exec -T db psql -U $${DB_USER} -d $${DB_NAME} < $(FILE)

db-migrate:
	$(COMPOSE) restart backend

db-reset:
	@echo "⚠️  Xóa toàn bộ dữ liệu và chạy lại migration. Nhấn Ctrl+C để hủy..." && sleep 5
	$(COMPOSE) exec db psql -U $${DB_USER} -d $${DB_NAME} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(COMPOSE) restart backend

backend-shell:
	$(COMPOSE) exec backend sh

frontend-shell:
	$(COMPOSE) exec frontend sh

seed:
	$(COMPOSE) exec backend go run ./src/cmd/seed/main.go

.PHONY: up down logs build rebuild ps db-shell db-logs db-dump db-restore db-migrate db-reset backend-shell frontend-shell seed
