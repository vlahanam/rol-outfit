---
title: User Addresses Feature
status: completed
priority: medium
created: 2026-05-26
completed: 2026-05-26
blockedBy: []
blocks: []
---

# User Addresses Feature

Add multi-address management for users with default address auto-fill at checkout.

## Context
- Brainstorm: `plans/reports/brainstorm-260526-2147-user-addresses-feature.md`

## Scope
- Max 5 addresses per user
- Minimal fields: recipient_name, phone, address (text)
- 1 default address per user
- Auto-fill default address at checkout

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Database Migration](phase-01-database-migration.md) | complete | 15min |
| 2 | [Backend Implementation](phase-02-backend-implementation.md) | complete | 45min |
| 3 | [Frontend Implementation](phase-03-frontend-implementation.md) | complete | 45min |
| 4 | [Checkout Integration](phase-04-checkout-integration.md) | complete | 30min |

## Key Files

### Backend (Create)
- `backend/database/migrations/000020_create_user_addresses.{up,down}.sql`
- `backend/src/internal/models/user_address.go`
- `backend/src/internal/dto/user_address_dto.go`
- `backend/src/internal/requests/user_address_request.go`
- `backend/src/internal/repositories/user_address_repo.go`
- `backend/src/internal/services/user_address_service.go`
- `backend/src/internal/controllers/user_address_controller.go`

### Backend (Modify)
- `backend/src/internal/initialize/route.go`
- `backend/src/internal/initialize/db.go` (register model)

### Frontend (Create)
- `frontend/app/[locale]/(main)/addresses/page.tsx`

### Frontend (Modify)
- `frontend/components/user-dropdown.tsx`
- `frontend/app/[locale]/(main)/checkout/page.tsx`
- `frontend/types/api.ts`
- `frontend/lib/api-resources.ts`
- `frontend/messages/en.json`
- `frontend/messages/vn.json`

## Success Criteria
- [x] User can add/edit/delete addresses (max 5)
- [x] User can set default address
- [x] Default address auto-fills checkout form
- [x] "Địa chỉ của tôi" appears in user dropdown
