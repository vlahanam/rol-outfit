# Brainstorm Report: User Profile Feature

**Date:** 2026-05-31
**Status:** Approved

## Problem Statement

Add user profile management feature to frontend:
- Add "Thông tin tài khoản" menu item in user dropdown at homepage (http://localhost/)
- Create profile page at `/profile` showing logged-in user info
- Allow updating: name, phone, avatar, password

## Selected Approach

**Phương án A: Full implementation** - requires both backend and frontend changes.

## Backend Changes

### 1. User Model Update
Add `avatar` field (VARCHAR 500) to store avatar URL.

### 2. Migration
```sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
```

### 3. UpdateMeRequest Update
Add `avatar` field to UpdateMeRequest struct.

### 4. New Endpoint: Change Password
```
PUT /api/v1/users/me/password
Request: { current_password, new_password }
Response: 204 No Content
```

### 5. Files to Modify
- `backend/src/internal/models/user.go`
- `backend/src/internal/dto/user_dto.go`
- `backend/src/internal/requests/user_request.go`
- `backend/src/internal/services/user_service.go`
- `backend/src/internal/controllers/user_controller.go`
- `backend/src/internal/initialize/route.go`

## Frontend Changes

### 1. UserDropdown Update
Add "Thông tin tài khoản" menu item linking to `/profile`.

### 2. Profile Page
```
frontend/app/[locale]/(main)/profile/page.tsx
```

Layout:
- Avatar section with upload
- Personal info section (name, phone editable; email read-only)
- Password change section (current, new, confirm)

### 3. Files to Modify
- `frontend/components/user-dropdown.tsx`
- `frontend/app/[locale]/(main)/profile/page.tsx` (new)
- `frontend/lib/api-resources.ts`
- `frontend/types/api.ts`
- `frontend/messages/vn.json`
- `frontend/messages/jp.json`

## Security Considerations
- Password change requires current password verification
- Avatar URL sanitization (only /uploads/* paths)

## Success Criteria
- [ ] Menu item "Thông tin tài khoản" in dropdown
- [ ] Profile page displays logged-in user
- [ ] Can update name and phone
- [ ] Can upload avatar
- [ ] Can change password with current password verification
