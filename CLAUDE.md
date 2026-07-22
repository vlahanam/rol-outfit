# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**rol-outfit** is a full-stack application with a Go/Fiber backend, planned frontend, Nginx reverse proxy, and Docker containerization. The project is in early development.

## Monorepo Structure

```
backend/     — Go + Fiber v3 API server (entry: backend/src/cmd/main.go)
frontend/    — Frontend app (TBD)
nginx/       — Nginx reverse proxy config
docker/      — Docker Compose and Dockerfiles
docs/        — Architecture, standards, roadmap, changelog
plans/       — Implementation plans and reports
```

## Docker Dev Environment

**Compose root**: `docker/docker-compose.yml` (requires `docker/.env`)

**Setup**: Define DB credentials in `docker/.env`, then run:

```bash
make up         # Start all services (Go/Fiber, Next.js, PostgreSQL, Nginx)
make down       # Stop all services
make rebuild    # Rebuild and start
make logs       # Tail compose logs
make ps         # Show running containers
```

**Access**:
- Frontend: http://localhost (proxied to 3000)
- Backend API: http://localhost/api (proxied to 8080)
- PostgreSQL shell: `make db-shell`
- Backend shell: `make backend-shell`
- Frontend shell: `make frontend-shell`

**Hot reload**:
- Backend: Air watches `backend/src/` (see `.air.toml`)
- Frontend: Next.js HMR enabled

## Backend Commands

```bash
# Run standalone (not via Docker)
cd backend && go run ./src/cmd/main.go

# Build
cd backend && go build -o bin/server ./src/cmd/main.go

# Test
cd backend && go test ./...

# Test single package
cd backend && go test ./src/.../<package>

# Lint (requires golangci-lint)
cd backend && golangci-lint run

# Tidy dependencies
cd backend && go mod tidy
```

## Tech Stack

- **Backend**: Go 1.26, [Fiber v3](https://github.com/gofiber/fiber) (`github.com/gofiber/fiber/v3`)
- **Module**: `github.com/vlahanam/rol-outfit`
- **Reverse proxy**: Nginx
- **Containerization**: Docker

## Architecture Notes

- Backend source lives under `backend/src/`, entry point at `backend/src/cmd/main.go`
- Keep code files under 200 lines; split into focused packages under `backend/src/`
- Follow standard Go project layout: `cmd/` for entrypoints, `internal/` for private packages, etc.

## Branching

- `master` — main/production branch (PRs target here)
- `develop` — active development branch

## Docs & Plans

- Plans go in `plans/` with naming `{YYMMDD-HHmm}-{issue}-{slug}/`
- Docs go in `docs/` — update `docs/development-roadmap.md` and `docs/project-changelog.md` after features
- Do not create markdown files outside `plans/` or `docs/` unless explicitly requested
