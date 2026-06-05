# Brainstorm: Remove Avatar Feature

## Problem Statement
Remove user avatar functionality completely:
- No avatar upload for users
- No avatar fetching from Google/Facebook OAuth
- Keep initials display as fallback UI

## Scope

### Backend (Go/Fiber)
| Component | Action |
|-----------|--------|
| Database | Create migration to DROP `avatar` column from `users` table |
| `models/user.go:29` | Remove `Avatar *string` field |
| `dto/user_dto.go:10-20` | Remove `Avatar` field and mapping in `ToUserDTO()` |
| `requests/user_request.go:117-146` | Remove `Avatar` from `UpdateMeRequest` struct |
| `controllers/user_controller.go:18-55` | Delete `UploadMeAvatar()` function |
| `initialize/route.go:185` | Remove `POST /me/avatar` route |
| `services/oauth_service.go:160-184` | Remove `picture` extraction in `fetchGoogleUserInfo()` |
| `services/oauth_service.go:186-215` | Remove `picture.data.url` extraction in `fetchFacebookUserInfo()` |
| `services/oauth_service.go:266-268` | Remove `newUser.Avatar = &info.AvatarURL` |

### Frontend (Next.js/TypeScript)
| Component | Action |
|-----------|--------|
| `types/api.ts:189-199` | Remove `avatar?: string` from `User` interface |
| `lib/api-resources.ts:249-275` | Delete `uploadAvatar()` function |
| `app/[locale]/(main)/profile/page.tsx` | Remove avatar upload UI, keep initials circle |

## Decision Rationale
- User requested removal to simplify the system
- No external avatar storage needed
- OAuth flow simplified
- Initials fallback already exists and will be kept

## Risks
| Risk | Mitigation |
|------|------------|
| Data loss (existing avatar URLs) | Irreversible once migration runs; user acknowledged |
| Rollback complexity | down.sql can restore column but not data |

## Implementation Order
1. Backend: Migration (create but don't run yet)
2. Backend: Remove OAuth avatar fetching
3. Backend: Remove upload controller/route
4. Backend: Update model, dto, request
5. Frontend: Remove upload function and UI
6. Run migration
7. Test end-to-end

## Success Criteria
- [ ] `POST /api/v1/users/me/avatar` returns 404
- [ ] Google/Facebook OAuth creates user without avatar
- [ ] Profile page shows initials only, no upload button
- [ ] `users` table has no `avatar` column
- [ ] No TypeScript/Go compilation errors
