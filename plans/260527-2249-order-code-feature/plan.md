---
name: order-code-feature
status: complete
created: 2026-05-27
branch: develop
blockedBy: []
blocks: []
---

# Order Code Feature Implementation Plan

## Overview
Add human-readable order code (`ROL-YYMMDD-XXX`) to orders table, replacing UUID display for users.

## Context
- Brainstorm: `plans/reports/brainstorm-260527-2249-order-code-feature.md`
- Format: `ROL-YYMMDD-XXX` (daily reset sequence 001-999)
- Approach: DB-level sequence with row lock for concurrency safety

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](phase-01-database-migrations.md) | Database migrations | done | 30m |
| [Phase 2](phase-02-backend-model-repository.md) | Backend model + repository | done | 45m |
| [Phase 3](phase-03-backend-service-integration.md) | Service integration + backfill | done | 30m |
| [Phase 4](phase-04-frontend-display.md) | Frontend display updates | done | 30m |

## Key Files
**Backend:**
- `backend/src/internal/models/order.go`
- `backend/src/internal/models/order_code_sequence.go` (new)
- `backend/src/internal/repositories/order_code_repo.go` (new)
- `backend/src/internal/services/order_service.go`
- `backend/src/internal/dto/order_dto.go`
- `backend/database/migrations/000022_*.sql` (new)
- `backend/database/migrations/000023_*.sql` (new)

**Frontend:**
- `frontend/types/api.ts`
- `frontend/app/[locale]/(main)/orders/page.tsx`
- `frontend/app/[locale]/(main)/orders/[id]/page.tsx`
- `frontend/app/admin/(protected)/orders/page.tsx`
- `frontend/app/admin/(protected)/orders/[id]/page.tsx`

## Success Criteria
- [ ] All orders have unique order_code
- [ ] New orders auto-generate code on creation
- [ ] Order list pages show "Mã đơn hàng" column
- [ ] Order detail shows order code
- [ ] Search by order_code works in admin
- [ ] No duplicate codes under concurrent load

## Dependencies
- Go + GORM
- PostgreSQL
- Next.js frontend

## Risk
- Race condition → mitigated by DB transaction + row lock
- Migration failure → test on staging first
