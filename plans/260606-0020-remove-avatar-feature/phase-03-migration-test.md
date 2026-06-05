# Phase 3: Migration & Test

## Overview
Run migration and verify all changes work correctly.

## Tasks

### 3.1 Run Migration
```bash
# From project root with Docker running
make migrate-up
# Or manually:
# docker exec -it rol-outfit-backend migrate -path /app/database/migrations -database "postgres://..." up
```

### 3.2 Verify Database
```bash
make db-shell
# Then run:
\d users
# Confirm avatar column is gone
```

### 3.3 Test Backend
```bash
cd backend && go test ./...
```

### 3.4 Test Frontend
```bash
cd frontend && npm run build
```

### 3.5 Manual Testing

**Test 1: Profile page**
1. Login as customer
2. Go to /profile
3. Verify: initials displayed, no upload button, no camera icon

**Test 2: Google OAuth (if available)**
1. Logout
2. Login with Google
3. Verify: user created without avatar
4. Check database: `SELECT id, email, avatar FROM users WHERE email='...'`

**Test 3: API endpoint**
```bash
curl -X POST http://localhost/api/v1/users/me/avatar \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.jpg"
# Should return 404
```

## Checklist
- [x] Migration files created (not run - will deploy)
- [x] Backend tests pass
- [x] Frontend builds
- [x] Profile page shows initials only
- [x] OAuth creates user without avatar
- [x] Upload endpoint implementation removed
- [ ] Migration will run on deploy
