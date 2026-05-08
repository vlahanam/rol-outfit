---
title: Admin Category Management
status: in_progress
priority: high
created: 2026-05-08
blockedBy: []
blocks: []
---

# Admin Category Management

Add full CRUD admin UI for categories, backed by admin-specific API endpoints.

## Summary

Backend has public category CRUD (`/api/v1/categories`) but:
- Filters `status = active` on reads → admin can't view/update hidden categories
- No `/api/v1/admin/categories` endpoints (pattern used by products/users)

Frontend has no category management section at all.

## Phases

| Phase | Title | Status |
|-------|-------|--------|
| [01](phase-01-backend-admin-endpoints.md) | Backend: Admin Category Endpoints | todo |
| [02](phase-02-frontend-admin-ui.md) | Frontend: Admin Category UI | todo |

## Files Changed

**Backend:**
- `backend/src/internal/repositories/category_repo.go` — add admin repo methods
- `backend/src/internal/controllers/category_controller.go` — add admin controllers
- `backend/src/internal/initialize/route.go` — register admin routes

**Frontend:**
- `frontend/types/api.ts` — add category payload types
- `frontend/lib/api.ts` — add adminCategories API client
- `frontend/lib/validations.ts` — add category schemas
- `frontend/components/admin/AdminSidebar.tsx` — add Danh Mục link
- `frontend/app/admin/(protected)/categories/page.tsx` — list page (new)
- `frontend/app/admin/(protected)/categories/add/page.tsx` — add page (new)
- `frontend/app/admin/(protected)/categories/[id]/edit/page.tsx` — edit page (new)
