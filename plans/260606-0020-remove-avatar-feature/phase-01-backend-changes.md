# Phase 1: Backend Changes

## Overview
Remove all avatar-related code from backend before running migration.

## Tasks

### 1.1 Create Migration Files
Create `backend/database/migrations/000027_remove_avatar.up.sql`:
```sql
ALTER TABLE users DROP COLUMN IF EXISTS avatar;
```

Create `backend/database/migrations/000027_remove_avatar.down.sql`:
```sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
```

### 1.2 Remove OAuth Avatar Handling
File: `backend/src/internal/services/oauth_service.go`

**Step A:** Remove `AvatarURL` from `OAuthUserInfo` struct (line 34):
```go
// BEFORE
type OAuthUserInfo struct {
    ID        string
    Email     string
    Name      string
    AvatarURL string  // DELETE THIS LINE
}

// AFTER
type OAuthUserInfo struct {
    ID    string
    Email string
    Name  string
}
```

**Step B:** In `fetchGoogleUserInfo()` (~line 168-182):
- Remove `Picture string` from response struct
- Remove `AvatarURL: data.Picture` from return

**Step C:** In `fetchFacebookUserInfo()` (~line 195-213):
- Remove Picture struct from response
- Remove `AvatarURL: data.Picture.Data.URL` from return

**Step D:** In `findOrCreateUser()` (~line 249, 266-268):
- Remove `AvatarURL: &info.AvatarURL` from oauth create
- Remove avatar assignment to newUser

### 1.3 Remove Upload Controller
File: `backend/src/internal/controllers/user_controller.go`

Delete entire `UploadMeAvatar` function (lines 18-55).

### 1.4 Remove Route
File: `backend/src/internal/initialize/route.go`

Delete line 185:
```go
me.Post("/me/avatar", controllers.UploadMeAvatar(uploadSvc, cfg.UploadMaxSize))
```

### 1.5 Update Model
File: `backend/src/internal/models/user.go`

Remove line 29:
```go
Avatar    *string        `gorm:"column:avatar;type:varchar(500)"`
```

### 1.6 Update DTO
File: `backend/src/internal/dto/user_dto.go`

Remove Avatar field from UserDTO and ToUserDTO mapping.

### 1.7 Update Request
File: `backend/src/internal/requests/user_request.go`

Remove Avatar from `UpdateMeRequest` struct and validation.

### 1.8 Verify Compilation
```bash
cd backend && go build ./src/cmd/main.go
```

## Checklist
- [x] Migration files created
- [x] OAuth avatar handling removed
- [x] UploadMeAvatar controller deleted
- [x] Route removed
- [x] Model updated
- [x] DTO updated
- [x] Request updated
- [x] Compiles without errors
