---
name: admin-order-orderer-column
status: complete
created: 2026-05-28
mode: fast
---

# Admin Order Orderer Column

Add orderer info (name, email, phone) to admin orders list page and enhance order detail page.

## Summary

| Aspect | Detail |
|--------|--------|
| Scope | Admin orders list + detail pages |
| Effort | ~1 hour |
| Risk | Low - additive changes only |

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | [Backend + Frontend Implementation](./phase-01-implementation.md) | pending |

## Files to Modify

**Backend:**
- `backend/src/internal/dto/order_dto.go` - Add AdminOrderDTO with user info
- `backend/src/internal/controllers/order_controller.go` - Fetch user info for admin orders
- `frontend/types/api.ts` - Add user fields to Order type

**Frontend:**
- `frontend/app/admin/(protected)/orders/page.tsx` - Add orderer column
- `frontend/app/admin/(protected)/orders/[id]/page.tsx` - Show user name/email

## Success Criteria

- [x] Admin orders list shows orderer column (name, email, phone)
- [x] Admin order detail shows full user info
- [x] Backend compiles without errors
- [x] Frontend builds without errors
