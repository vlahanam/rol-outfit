---
title: Product Variants CRUD API
status: completed
priority: high
created: 2026-05-06
blockedBy: []
blocks: []
---

# Product Variants CRUD API

Implement full CRUD API for `product_variants` table, nested under products.

## Schema Summary

```sql
product_variants (
  id          UUID PK,
  product_id  UUID NOT NULL → products(id) CASCADE,
  attributes  JSONB NOT NULL DEFAULT '{}',  -- e.g. {"Size":"39","Color":"Black"}
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  sold        INTEGER NOT NULL DEFAULT 0,
  avatar      TEXT,
  status      SMALLINT NOT NULL DEFAULT 1,  -- 1=shown, 2=hidden
  created_at  TIMESTAMPTZ,
  updated_at  TIMESTAMPTZ
)
```

No `deleted_at` → hard delete.

## API Endpoints

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET    | `/api/v1/products/:productID/variants` | public | List variants |
| GET    | `/api/v1/products/:productID/variants/:id` | public | Get variant |
| POST   | `/api/v1/products/:productID/variants` | admin | Create variant |
| PUT    | `/api/v1/products/:productID/variants/:id` | admin | Update variant |
| DELETE | `/api/v1/products/:productID/variants/:id` | admin | Delete variant |

## Phases

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Model & Repository](./phase-01-model-repository.md) | pending | 20 min |
| 2 | [Service, Request, DTO](./phase-02-service-request-dto.md) | pending | 20 min |
| 3 | [Controller & Routes](./phase-03-controller-routes.md) | pending | 20 min |
| 4 | [i18n & Compile Check](./phase-04-i18n-compile.md) | pending | 10 min |

## Key Files

**Create:**
- `backend/src/internal/models/product_variant.go`
- `backend/src/internal/repositories/product_variant_repo.go`
- `backend/src/internal/services/product_variant_service.go`
- `backend/src/internal/requests/product_variant_request.go`
- `backend/src/internal/dto/product_variant_dto.go`
- `backend/src/internal/controllers/product_variant_controller.go`

**Modify:**
- `backend/src/internal/models/product.go` — add `AttributeNames []string`
- `backend/src/internal/initialize/route.go` — register variant routes
- `backend/src/internal/i18n/locales/vi.json` — add variant error keys
- `backend/src/internal/i18n/locales/ja.json` — add variant error keys
