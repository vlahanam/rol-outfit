# Phase 7: Integration Testing

**Priority:** Medium | **Status:** completed | **Effort:** M

## Overview

End-to-end testing of OAuth flows for both Google and Facebook providers.

## Test Scenarios

### 1. Happy Path - New User (Google)

```
1. User clicks "Continue with Google" on login page
2. → Redirects to backend /api/v1/auth/oauth/google
3. → Backend sets state cookie, redirects to Google
4. User authenticates with Google
5. → Google redirects to backend callback
6. → Backend creates new user (no password), links OAuth
7. → Backend redirects to frontend with tokens
8. → Frontend stores tokens, redirects to home
9. ✓ User is logged in, can access protected routes
```

### 2. Happy Path - Existing User Auto-Link

```
1. User with email user@example.com exists (password auth)
2. User clicks "Continue with Google" (same email)
3. → OAuth flow completes
4. → Backend finds existing user by email
5. → Backend links OAuth to existing account
6. → User is logged in
7. ✓ User can now login via email/password OR Google
```

### 3. Admin Block

```
1. Admin user exists with email admin@example.com
2. Admin clicks "Continue with Google" (same email)
3. → OAuth flow reaches callback
4. → Backend detects admin role
5. → Backend rejects with error
6. → Frontend shows "Admin cannot use OAuth" error
7. ✓ Admin must use email/password
```

### 4. State Mismatch Attack

```
1. Attacker crafts callback URL with different state
2. → Backend checks state cookie vs query
3. → State doesn't match
4. → Rejects with "state_mismatch" error
5. ✓ CSRF attack prevented
```

### 5. Invalid Redirect URI

```
1. Attacker calls /oauth/google?redirect_uri=http://evil.com
2. → Backend validates against whitelist
3. → Rejects with 400 "invalid_redirect_uri"
4. ✓ Open redirect prevented
```

### 6. OAuth User Sets Password

```
1. User signs up via Google (no password)
2. → User goes to profile settings
3. → User sets password via /users/me/password
4. ✓ User can now login via email/password OR Google
```

### 7. Unlink Provider - Has Password

```
1. User has Google OAuth + password
2. → User unlinks Google via DELETE /users/me/oauth-providers/google
3. ✓ Success - can still login via password
```

### 8. Unlink Provider - No Password

```
1. User has only Google OAuth (no password)
2. → User tries to unlink Google
3. → Backend rejects "cannot unlink last login method"
4. ✓ User must set password first
```

## Manual Test Checklist

### Backend

- [ ] GET /oauth/google with valid redirect_uri → redirects to Google
- [ ] GET /oauth/google with invalid redirect_uri → 400 error
- [ ] GET /oauth/google/callback with valid code → redirects with tokens
- [ ] GET /oauth/google/callback with missing state → error redirect
- [ ] GET /oauth/google/callback with mismatched state → error redirect
- [ ] GET /oauth/facebook (same tests as Google)
- [ ] GET /users/me/oauth-providers → returns linked providers
- [ ] DELETE /users/me/oauth-providers/google → unlinks if allowed

### Frontend

- [ ] OAuth buttons visible on login page
- [ ] OAuth buttons visible on register page
- [ ] Click Google → redirects to backend
- [ ] Callback page extracts tokens successfully
- [ ] Callback page shows error on failure
- [ ] URL cleared after token extraction
- [ ] User session established after OAuth login

### Database

- [ ] New OAuth user created with null password
- [ ] user_oauth_providers row created
- [ ] Existing user linked (new oauth row, same user)

## Automated Tests (Optional)

### Backend Unit Tests

```go
// oauth_service_test.go
func TestGenerateState(t *testing.T) {
    svc := NewOAuthService(...)
    state := svc.GenerateState()
    assert.Len(t, state, 44) // base64(32 bytes)
}

func TestValidateRedirectURI(t *testing.T) {
    svc := NewOAuthService(..., []string{"http://localhost:3000/login/callback"}, ...)
    assert.True(t, svc.ValidateRedirectURI("http://localhost:3000/login/callback"))
    assert.False(t, svc.ValidateRedirectURI("http://evil.com/callback"))
}

func TestFindOrCreateUser_NewUser(t *testing.T) {
    // Mock repos, test new user creation
}

func TestFindOrCreateUser_ExistingEmail(t *testing.T) {
    // Mock repos, test auto-linking
}

func TestFindOrCreateUser_AdminBlocked(t *testing.T) {
    // Mock repos, test admin rejection
}
```

### Backend Integration Tests

```go
// oauth_controller_test.go
func TestOAuthInitiate_InvalidRedirect(t *testing.T) {
    app := setupTestApp()
    req := httptest.NewRequest("GET", "/api/v1/auth/oauth/google?redirect_uri=http://evil.com", nil)
    resp, _ := app.Test(req)
    assert.Equal(t, 400, resp.StatusCode)
}

func TestOAuthCallback_StateMismatch(t *testing.T) {
    // Set state cookie, call callback with different state
}
```

## Test Environment Setup

### Google OAuth (Test Mode)

1. In Google Cloud Console, add test users
2. App in "Testing" mode only allows whitelisted users
3. For full testing, publish app or use whitelisted accounts

### Facebook OAuth (Test Mode)

1. In Facebook Developer Console, app is in Development mode
2. Only app admins/testers can test
3. Add test users or use admin account

### Local Testing Tips

```bash
# Use ngrok for HTTPS callbacks (required by some providers)
ngrok http 8080

# Update .env with ngrok URL
OAUTH_CALLBACK_BASE_URL=https://xxxx.ngrok.io
OAUTH_ALLOWED_REDIRECT_URIS=http://localhost:3000/login/callback
```

## Todo

- [ ] Test Google OAuth happy path
- [ ] Test Facebook OAuth happy path
- [ ] Test auto-link with existing email
- [ ] Test admin block
- [ ] Test state validation
- [ ] Test redirect URI validation
- [ ] Test password setting for OAuth user
- [ ] Test provider unlinking
- [ ] Write unit tests (optional)
- [ ] Write integration tests (optional)

## Success Criteria

All manual test scenarios pass:
- [ ] New user registration via Google
- [ ] New user registration via Facebook
- [ ] Auto-link existing user
- [ ] Admin cannot use OAuth
- [ ] Security checks (state, redirect) working
- [ ] OAuth user can set password
- [ ] Provider unlink works correctly
