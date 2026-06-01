# Brainstorm Report: OAuth Login (Facebook + Google)

**Date:** 2026-05-31
**Status:** Approved

---

## Problem Statement

Implement social login with Facebook and Google for the rol-outfit e-commerce platform.

**Current State:**
- JWT-based email/password auth with access/refresh token rotation
- Token family theft detection
- No OAuth implementation

---

## Requirements

| Requirement | Decision |
|-------------|----------|
| Providers | Facebook + Google (both simultaneously) |
| Account linking | Auto-link if OAuth email matches existing account |
| Password setting | OAuth users can set password later via profile |
| Admin OAuth | Disabled (admin email/password only for security) |
| OAuth UX | Full page redirect (not popup) |

---

## Chosen Approach: Backend-Driven OAuth (Authorization Code Flow)

### Rationale
- OAuth secrets remain on backend only (more secure)
- Centralized auth logic, easier to maintain
- Consistent handling for both providers
- No frontend SDK dependencies

### Trade-offs
- Slightly more redirects vs SDK approach
- Acceptable for security benefits

---

## OAuth Flow

```
Frontend → Backend /oauth/google → Google OAuth → Backend /callback → Frontend with JWT tokens
```

1. User clicks "Login with Google" → redirect to backend OAuth endpoint
2. Backend stores state in cookie, redirects to Google
3. User authenticates with Google
4. Google redirects to backend callback with authorization code
5. Backend exchanges code for tokens, fetches user info
6. Backend creates/links user account, issues JWT tokens
7. Backend redirects to frontend with tokens in URL params
8. Frontend extracts tokens, stores in localStorage, clears URL

---

## Account Linking Logic

```
1. OAuth link exists? → Login (block if admin)
2. Email matches existing user? → Auto-link (block if admin)
3. Otherwise → Create new user (no password, role=customer)
```

---

## Security Measures

| Threat | Mitigation |
|--------|------------|
| CSRF | State parameter in HttpOnly cookie |
| Token URL leakage | Frontend clears URL immediately |
| Open redirect | Whitelist allowed redirect URIs |
| Admin bypass | Role check before login/link |

---

## Database Schema

```sql
CREATE TABLE user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Make users.password nullable for OAuth-only users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/oauth/google` | Initiate Google OAuth |
| GET | `/api/v1/auth/oauth/google/callback` | Google OAuth callback |
| GET | `/api/v1/auth/oauth/facebook` | Initiate Facebook OAuth |
| GET | `/api/v1/auth/oauth/facebook/callback` | Facebook OAuth callback |
| GET | `/api/v1/users/me/oauth-providers` | List linked providers |
| DELETE | `/api/v1/users/me/oauth-providers/:provider` | Unlink provider |

---

## Dependencies

```go
// Go packages
golang.org/x/oauth2
google.golang.org/api/oauth2/v2
```

---

## Environment Variables

```bash
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/login/callback
```

---

## Files to Change

### Backend (Create)
- `migrations/000XXX_add_oauth_providers.up.sql`
- `models/user_oauth_provider.go`
- `repositories/oauth_repo.go`
- `services/oauth_service.go`
- `controllers/oauth_controller.go`
- `requests/oauth_request.go`
- `dto/oauth_dto.go`

### Backend (Modify)
- `models/user.go` - password nullable
- `services/auth_service.go` - integrate OAuth
- `controllers/auth_controller.go` - error messages
- `initialize/route.go` - new routes
- `config/config.go` - OAuth config

### Frontend (Create)
- `app/[locale]/login/callback/page.tsx`
- `components/oauth-buttons.tsx`

### Frontend (Modify)
- `app/[locale]/login/page.tsx` - add OAuth buttons
- `lib/api.ts` - OAuth types

---

## Success Criteria

- [ ] Google OAuth login works end-to-end
- [ ] Facebook OAuth login works end-to-end
- [ ] Auto-link works when email matches
- [ ] New users created without password for OAuth-only
- [ ] OAuth users can set password in profile
- [ ] Admin accounts blocked from OAuth
- [ ] CSRF protection via state parameter
- [ ] Allowed redirect URIs validated

---

## Next Steps

Create detailed implementation plan with phases:
1. Database migration
2. Backend OAuth service
3. Backend controllers/routes
4. Frontend OAuth callback page
5. Frontend OAuth buttons
6. Integration testing
