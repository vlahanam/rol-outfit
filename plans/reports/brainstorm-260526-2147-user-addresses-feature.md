# Brainstorm: User Addresses Feature

**Date:** 2026-05-26
**Status:** Approved → Planning

## Problem Statement
Add "Địa chỉ của tôi" menu item to user dropdown. Users need multiple delivery addresses with 1 default address for checkout auto-fill.

## Requirements
- **Address fields:** Recipient name + Phone + Address text (minimal)
- **Checkout:** Auto-fill default address, user can override
- **Limit:** Max 5 addresses per user
- **Default:** Exactly 1 default address per user

## Proposed Solution

### Database Schema
```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id, deleted_at);
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/addresses` | List user's addresses |
| POST | `/api/v1/addresses` | Create address (max 5 check) |
| PUT | `/api/v1/addresses/:id` | Update address |
| DELETE | `/api/v1/addresses/:id` | Soft delete |
| PUT | `/api/v1/addresses/:id/default` | Set as default |

### Business Rules
1. First address auto-becomes default
2. Setting new default → unset previous default (transaction)
3. Cannot delete default if other addresses exist → must set new default first
4. Max 5 addresses per user → return 400 if exceeded

### Frontend Components
1. **UserDropdown.tsx** - Add menu item with MapPin icon
2. **addresses/page.tsx** - List + CRUD + set default
3. **checkout/page.tsx** - Auto-fill default, allow edit/select

### i18n Keys
- `Header.myAddresses` → "Địa chỉ của tôi"
- Address form labels: recipientName, phone, address, setDefault, etc.

## Trade-offs
| Choice | Pros | Cons |
|--------|------|------|
| Minimal fields | Simple UI, faster implementation | Less structured for future shipping integration |
| Max 5 limit | Prevents abuse, simple | May need increase later |
| Soft delete | Data recovery, audit trail | Extra deleted_at checks |

## Risk Assessment
- **Low:** Straightforward CRUD, follows existing patterns
- **Migration:** New table, no existing data migration needed
- **Breaking change:** None - additive feature

## Files to Create/Modify

### Backend (Create)
- `backend/database/migrations/000XXX_create_user_addresses.up.sql`
- `backend/database/migrations/000XXX_create_user_addresses.down.sql`
- `backend/src/internal/models/user_address.go`
- `backend/src/internal/dto/user_address_dto.go`
- `backend/src/internal/requests/user_address_request.go`
- `backend/src/internal/repositories/user_address_repo.go`
- `backend/src/internal/services/user_address_service.go`
- `backend/src/internal/controllers/user_address_controller.go`

### Backend (Modify)
- `backend/src/internal/initialize/route.go` - Add routes

### Frontend (Create)
- `frontend/app/[locale]/(main)/addresses/page.tsx`

### Frontend (Modify)
- `frontend/components/user-dropdown.tsx` - Add menu item
- `frontend/app/[locale]/(main)/checkout/page.tsx` - Auto-fill logic
- `frontend/types/api.ts` - Add Address interface
- `frontend/lib/api.ts` or `api-resources.ts` - Add API functions
- `frontend/messages/en.json` - Add i18n keys
- `frontend/messages/vn.json` - Add Vietnamese translations

## Next Steps
1. Create implementation plan with phases
2. Implement backend (migration → model → repo → service → controller → routes)
3. Implement frontend (types → API → page → dropdown → checkout integration)
4. Test and review
