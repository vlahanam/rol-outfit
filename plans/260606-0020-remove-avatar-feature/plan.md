---
title: Remove Avatar Feature
status: done
priority: medium
created: 2026-06-06
completed: 2026-06-06
blockedBy: []
blocks: []
---

# Remove Avatar Feature

Remove user avatar functionality completely from the system.

## Context

- **Brainstorm:** `plans/reports/brainstorm-260606-0020-remove-avatar-feature.md`
- **Branch:** develop
- **Scope:** Backend + Frontend

## Summary

| Aspect | Details |
|--------|---------|
| Goal | Remove avatar upload, OAuth avatar fetch, avatar display |
| Keep | Initials display in profile page |
| Data | DROP avatar column (irreversible) |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Backend Changes](phase-01-backend-changes.md) | complete | 30min |
| 2 | [Frontend Changes](phase-02-frontend-changes.md) | complete | 15min |
| 3 | [Migration & Test](phase-03-migration-test.md) | complete | 10min |

## Files to Modify

### Backend
- `database/migrations/000027_remove_avatar.{up,down}.sql` (create)
- `src/internal/models/user.go` (remove Avatar field)
- `src/internal/dto/user_dto.go` (remove Avatar)
- `src/internal/requests/user_request.go` (remove Avatar)
- `src/internal/controllers/user_controller.go` (delete UploadMeAvatar)
- `src/internal/initialize/route.go` (remove /me/avatar route)
- `src/internal/services/oauth_service.go` (remove AvatarURL handling)

### Frontend
- `types/api.ts` (remove avatar from User)
- `lib/api-resources.ts` (delete uploadAvatar)
- `app/[locale]/(main)/profile/page.tsx` (remove upload UI)

## Success Criteria

- [x] `POST /api/v1/users/me/avatar` returns 404
- [x] OAuth login creates user without avatar
- [x] Profile page shows initials only
- [x] `users` table has no `avatar` column (migration files created)
- [x] No compilation errors (backend tests pass)

## Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss | Avatar URLs permanently deleted | User acknowledged |
