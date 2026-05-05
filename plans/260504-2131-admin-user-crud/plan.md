---
title: Admin User CRUD - Frontend Integration
status: completed
priority: high
created: 2026-05-04
completedOn: 2026-05-04
blockedBy: []
blocks: []
---

# Admin User CRUD - Frontend Integration

Hoàn thiện chức năng CRUD User cho trang Admin bằng cách:
1. Thêm backend endpoint `POST /api/v1/admin/users` (tạo user mới từ admin)
2. Thay thế mock data ở frontend bằng real API calls tới các endpoints hiện có

## Context

### Backend APIs (đã có)
- `GET    /api/v1/admin/users?page=&limit=` — ListUsers (phân trang)
- `GET    /api/v1/admin/users/:id`          — GetUser
- `PUT    /api/v1/admin/users/:id`          — UpdateUser
- `DELETE /api/v1/admin/users/:id`          — DeleteUser
- **Thiếu:** `POST /api/v1/admin/users`     — CreateUser (cần thêm)

### UserDTO (backend trả về)
```json
{ "id": "uuid", "full_name": "str", "email": "str", "address": "str",
  "phone": "str", "role": 1|2, "status": 0|1, "created_at": "RFC3339", "updated_at": "RFC3339" }
```

### Role/Status mapping
- `role`:   1 = Admin, 2 = Khách hàng
- `status`: 1 = Hoạt động, 0 = Bị khóa

### Frontend files hiện tại
- `frontend/app/admin/(protected)/users/page.tsx`       — dùng mockUsers
- `frontend/app/admin/(protected)/users/add/page.tsx`    — console.log only
- `frontend/app/admin/(protected)/users/[id]/edit/page.tsx` — hardcoded data
- `frontend/lib/api.ts`   — api client (get/post/put/delete)
- `frontend/types/api.ts` — types (chưa có User type)

## Phases

| # | Phase | Status | Est. |
|---|-------|--------|------|
| 1 | [Backend: CreateUser Admin Endpoint](./phase-01-backend-create-user.md) | completed | 20 min |
| 2 | [Frontend: Types & API Client](./phase-02-frontend-types-api.md) | completed | 15 min |
| 3 | [Frontend: List, Add, Edit Pages](./phase-03-frontend-pages.md) | completed | 45 min |

## Key Files

**Modify:**
- `backend/src/internal/models/user.go` — add status constants
- `backend/src/internal/requests/user_request.go` — add CreateAdminUserRequest
- `backend/src/internal/services/user_service.go` — add Create method
- `backend/src/internal/controllers/user_controller.go` — add CreateUser handler
- `backend/src/internal/initialize/route.go` — register POST /admin/users
- `frontend/types/api.ts` — add User type
- `frontend/lib/api.ts` — add user admin API functions
- `frontend/app/admin/(protected)/users/page.tsx`
- `frontend/app/admin/(protected)/users/add/page.tsx`
- `frontend/app/admin/(protected)/users/[id]/edit/page.tsx`
