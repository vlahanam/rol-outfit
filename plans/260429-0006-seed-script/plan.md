---
title: "Database Seed Script"
description: "Standalone Go command to seed Users, Categories, Products idempotently"
status: completed
priority: P2
effort: 2h
branch: develop
tags: [backend, seeder, dx, makefile]
created: 2026-04-29
---

# Database Seed Script — Overview

Standalone, idempotent Go seeder for Users, Categories, Products. One phase — work is tightly coupled (shared DB connection, shared file structure, single Makefile target).

## Goal

Provide repeatable demo data for local dev. Re-running `make seed` must NOT duplicate rows or fail on existing data.

## Scope

- IN: Users (1 admin + 2 customers), Categories (4), Products (12)
- OUT (YAGNI): Carts, Orders, Faker libs, CLI flags, partial-seed selectors

## Phases

| # | Phase | Status | File |
|---|-------|--------|------|
| 01 | Seed script + Makefile target | completed | [phase-01-seed-script.md](./phase-01-seed-script.md) |

## File Ownership

```
backend/src/cmd/seed/main.go               (new)
backend/src/internal/seeder/seeder.go      (new)
backend/src/internal/seeder/seed_users.go  (new)
backend/src/internal/seeder/seed_categories.go (new)
backend/src/internal/seeder/seed_products.go   (new)
Makefile                                   (edit — add `seed` target)
```

## Key Dependencies

- Models exist: `User`, `Category`, `Product` in `backend/src/internal/models/`
- DB init reusable: `initialize.LoadConfig()` + `initialize.InitDB(cfg)`
- Slug util: `common.Slugify`
- `bcrypt`, `uuid` already in `go.mod`
- DB schema must be migrated (run `make up` so backend container migrates on boot)

## Success Criteria

- `go build ./src/...` passes
- `make seed` populates 3 users, 4 categories, 12 products on fresh DB
- Re-running `make seed` logs "skip (exists)" for each row, exits 0
- No duplicate rows in DB after multiple runs (verified via `make db-shell` count queries)

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Race on parallel seed runs | Low | Low | Single-user dev tool; document "run once at a time" |
| FK violation (product before category) | Medium | High | Seed order enforced in `RunAll`: users → categories → products; lookup category by slug before insert |
| Bcrypt cost too slow | Low | Low | Use `bcrypt.DefaultCost` (10) — 3 users only |
| Schema drift (column renamed) | Low | High | `go build` catches at compile time; phase requires successful build |

## Rollback

Delete seeded rows manually via `make db-shell`:
```sql
DELETE FROM products WHERE slug LIKE 'ao-nam-%' OR ...; -- seed slugs are stable
DELETE FROM categories WHERE slug IN ('ao-nam','quan-nam','ao-nu','quan-nu');
DELETE FROM users WHERE email LIKE '%@rol-outfit.com';
```
Seeder code is additive — removing seed files + Makefile target reverts feature without touching app code.
