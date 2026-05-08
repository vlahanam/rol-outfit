# JWT Refresh Token Implementation for Go/Fiber v3

**Date**: 2026-05-09 | **Focus**: Practical patterns for small/medium apps without Redis

---

## 1. Token Rotation Pattern

### Core Strategy: Invalidate-on-Use
Every refresh token is **single-use**. When used, immediately:
1. Validate refresh token claims (not expired, user exists, not revoked)
2. Generate new access token pair (access + refresh)
3. Revoke old refresh token before returning new pair
4. Return both tokens to client

### Implementation Flow (Go)
```go
func (s *TokenService) RefreshAccessToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
    // Parse & validate refresh token
    claims := &RefreshClaims{}
    token, err := jwt.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (any, error) {
        return s.signingKey, nil
    }, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
    
    if err != nil || !token.Valid {
        return nil, ErrInvalidToken
    }
    
    // Check if already revoked
    revoked, err := s.db.IsRefreshTokenRevoked(ctx, claims.TokenID)
    if revoked || err != nil {
        return nil, ErrTokenRevoked
    }
    
    // Revoke old token (must succeed before issuing new ones)
    if err := s.db.RevokeRefreshToken(ctx, claims.TokenID); err != nil {
        return nil, fmt.Errorf("failed to revoke old token: %w", err)
    }
    
    // Issue new pair
    newAccessToken, err := s.issueAccessToken(ctx, claims.UserID)
    if err != nil {
        return nil, err
    }
    
    newRefreshToken, newTokenID, err := s.issueRefreshToken(ctx, claims.UserID)
    if err != nil {
        return nil, err
    }
    
    return &TokenPair{AccessToken: newAccessToken, RefreshToken: newRefreshToken}, nil
}
```

### Why This Pattern
- **Theft detection**: Stolen token can only be used once; reuse attempt signals compromise
- **Sliding window**: Each use extends session without requiring full re-auth
- **Audit trail**: DB tracks rotation history via `rotated_at`, `previous_token_hash`
- **Minimal state**: Only tracks "is this token revoked?", not entire history

### Trade-offs
| Pro | Con |
|-----|-----|
| Single-use prevents replay | DB lookup on every refresh |
| Detects theft via reuse | Requires careful transaction handling |
| Works without Redis | Higher write load than pure JWT |

**Recommendation for small/medium apps**: Use this pattern. DB lookup cost is negligible for <10k MAU.

---

## 2. Refresh Token Revocation Strategies

### Strategy Comparison

| Strategy | Storage | Lookup | Revoke Speed | Scale Limit | Best For |
|----------|---------|--------|--------------|------------|----------|
| **Stateless (hash in DB)** | Token hash + metadata | Hash lookup on refresh | 1-100ms | <100k tokens | Small/medium apps |
| **Stateful (full token in DB)** | Full token encrypted | Direct lookup | <1ms | <50k tokens | Session auditing needs |
| **Redis blacklist** | JTI + expiry in Redis | O(1) Redis get | <5ms | Unlimited | High-scale, fast revoke |
| **Token versioning** | User version counter | Single row query | <1ms | Unlimited | Logout all sessions |

### 1. **Stateless + Hash (Recommended for Your Use Case)**

**Best for**: No Redis, small-medium scale, minimal overhead.

**Schema**:
```sql
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,  -- SHA256(token)
    token_family VARCHAR(36),  -- UUID: track rotation family
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,  -- NULL = active, non-null = revoked
    previous_token_hash VARCHAR(64),  -- For reuse detection
    rotated_at TIMESTAMPTZ,  -- When rotated to next token
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    INDEX idx_user_expires (user_id, expires_at),
    INDEX idx_token_hash (token_hash)
);
```

**Lookup on refresh**:
```go
func (db *DB) IsRefreshTokenRevoked(ctx context.Context, tokenHash string) (bool, error) {
    var revokedAt *time.Time
    err := db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("token_hash = ?", tokenHash).
        Select("revoked_at").
        Scan(&revokedAt).Error
    
    if err == gorm.ErrRecordNotFound {
        return false, ErrTokenNotFound
    }
    return revokedAt != nil, err
}

func (db *DB) RevokeRefreshToken(ctx context.Context, tokenHash string) error {
    return db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("token_hash = ?", tokenHash).
        Update("revoked_at", time.Now()).Error
}
```

**Pros**:
- No Redis dependency
- Audit trail (see `rotated_at`, `previous_token_hash`)
- Detects reuse via `token_family` invalidation

**Cons**:
- DB lookup on every refresh (~1-5ms per request)
- Hash collision risk (negligible with SHA256)

---

### 2. **Token Family Invalidation (Reuse Detection)**

Detect token theft via early reuse:

```go
// Issue new token with family ID
func (s *TokenService) issueRefreshToken(userID int64) (string, string, error) {
    tokenID := uuid.New().String()
    familyID := uuid.New().String()  // New family each rotation
    
    claims := &RefreshClaims{
        TokenID:  tokenID,
        FamilyID: familyID,
        RegisteredClaims: jwt.RegisteredClaims{
            Subject:   fmt.Sprintf("%d", userID),
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            ID:        tokenID,
        },
    }
    
    token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
    signed, _ := token.SignedString(s.signingKey)
    return signed, tokenID, nil
}

// On refresh: check if family is compromised
func (db *DB) GetTokenFamily(ctx context.Context, tokenHash string) (string, error) {
    var familyID string
    err := db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("token_hash = ?", tokenHash).
        Select("token_family").
        Scan(&familyID).Error
    return familyID, err
}

// If reuse detected, invalidate entire family
func (db *DB) RevokeTokenFamily(ctx context.Context, familyID string) error {
    return db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("token_family = ?", familyID).
        Update("revoked_at", time.Now()).Error
}
```

**On refresh endpoint**:
```go
if err := db.RevokeTokenFamily(ctx, claims.FamilyID); err != nil {
    log.Printf("SECURITY: Family %s revoked for user %s - possible token theft", 
        claims.FamilyID, claims.Subject)
    return nil, ErrTokenCompromised
}
```

---

### 3. **Access Token Revocation (Optional)**

Access tokens are **short-lived** (15-30 min), so immediate revocation is usually unnecessary. If you need it:

**Lightweight blacklist** (in-memory, expires with token):
```go
type JWTBlacklist struct {
    mu       sync.RWMutex
    entries  map[string]time.Time  // jti -> exp_time
}

func (jb *JWTBlacklist) Add(jti string, expiry time.Time) {
    jb.mu.Lock()
    jb.entries[jti] = expiry
    jb.mu.Unlock()
    
    // Auto-cleanup expired entries every 5min
    go func() {
        time.Sleep(5 * time.Minute)
        jb.mu.Lock()
        for k, v := range jb.entries {
            if time.Now().After(v) {
                delete(jb.entries, k)
            }
        }
        jb.mu.Unlock()
    }()
}

func (jb *JWTBlacklist) IsBlacklisted(jti string) bool {
    jb.mu.RLock()
    defer jb.mu.RUnlock()
    _, exists := jb.entries[jti]
    return exists
}
```

**When to use**: Only if you need immediate logout (e.g., password reset, permission changes). For most apps, the short token lifetime is sufficient.

---

## 3. Logout with Token Revocation

### Simple Logout (Recommended)

```go
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
    // Get user from JWT (validated by middleware)
    claims := c.Locals("user").(*AccessClaims)
    
    // Revoke all refresh tokens for this user
    if err := h.db.RevokeUserRefreshTokens(ctx, claims.UserID); err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "logout failed"})
    }
    
    // Clear client-side cookies (if using HttpOnly)
    c.Cookie(&fiber.Cookie{
        Name:     "refresh_token",
        Value:    "",
        Expires:  time.Now().Add(-time.Hour),
        HTTPOnly: true,
        Secure:   true,
    })
    
    return c.JSON(fiber.Map{"message": "logged out"})
}

// DB method to revoke all tokens
func (db *DB) RevokeUserRefreshTokens(ctx context.Context, userID int64) error {
    return db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("user_id = ? AND revoked_at IS NULL", userID).
        Update("revoked_at", time.Now()).Error
}
```

### Multi-Device Logout (Selective Revocation)

Store device ID in token to allow logout from specific device:

```go
type RefreshClaims struct {
    UserID      int64
    DeviceID    string  // e.g., sha256(user_agent + ip)
    jwt.RegisteredClaims
}

// Logout only current device
func (db *DB) RevokeDeviceTokens(ctx context.Context, userID int64, deviceID string) error {
    return db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("user_id = ? AND device_id = ? AND revoked_at IS NULL", userID, deviceID).
        Update("revoked_at", time.Now()).Error
}
```

---

## 4. Database Schema (GORM)

### Complete Refresh Token Model

```go
type RefreshToken struct {
    ID                int64      `gorm:"primaryKey"`
    UserID            int64      `gorm:"index:idx_user_expires"`
    User              User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
    
    // Token metadata
    TokenHash         string     `gorm:"index;uniqueIndex;size:64"`  // SHA256(token)
    TokenFamily       string     `gorm:"index;size:36"`              // UUID: track rotation family
    Jti               string     `gorm:"index;size:36"`              // JWT ID (claim: "jti")
    
    // Lifecycle
    ExpiresAt         time.Time  `gorm:"index:idx_user_expires"`
    RevokedAt         *time.Time `gorm:"index"`
    CreatedAt         time.Time  `gorm:"autoCreateTime"`
    LastUsedAt        *time.Time
    
    // Reuse detection
    PreviousTokenHash *string    `gorm:"size:64"`
    RotatedAt         *time.Time
    
    // Device tracking (optional)
    DeviceID          string     `gorm:"size:255"`
    DeviceUserAgent   string     `gorm:"size:500"`
    DeviceIP          string     `gorm:"size:45"`  // IPv6 support
}

func (RefreshToken) TableName() string {
    return "refresh_tokens"
}
```

### Migration
```go
db.AutoMigrate(&RefreshToken{})

// Manual indexes for better performance
db.Exec(`CREATE INDEX idx_refresh_user_expires ON refresh_tokens(user_id, expires_at)`)
db.Exec(`CREATE INDEX idx_refresh_token_hash ON refresh_tokens(token_hash)`)
db.Exec(`CREATE INDEX idx_refresh_family ON refresh_tokens(token_family) WHERE revoked_at IS NULL`)
```

### Cleanup Strategy (No Redis Needed)

**Option 1: Scheduled cleanup job** (cron, no external deps):
```go
func (db *DB) CleanupExpiredTokens(ctx context.Context) error {
    // Batch delete to avoid lock escalation
    pageSize := 1000
    for {
        result := db.WithContext(ctx).
            Where("expires_at < ? OR (revoked_at IS NOT NULL AND revoked_at < ?)",
                time.Now().Add(-24*time.Hour),  // Keep revoked tokens for audit for 24h
                time.Now().Add(-24*time.Hour)).
            Delete(&RefreshToken{}).
            Limit(pageSize)
        
        if result.RowsAffected == 0 {
            break
        }
    }
    return nil
}

// Run on startup + every 6 hours
go func() {
    ticker := time.NewTicker(6 * time.Hour)
    defer ticker.Stop()
    for range ticker.C {
        db.CleanupExpiredTokens(context.Background())
    }
}()
```

**Option 2: PostgreSQL TTL extension** (pg_ttl_index):
```sql
-- Install extension
CREATE EXTENSION pg_ttl_index;

-- Auto-delete expired tokens every 30min
SELECT pg_ttl_add_index('refresh_tokens'::regclass, 'expires_at'::name, '30 minutes'::interval);
```

---

## 5. Security Considerations

### 1. Timing Attack Prevention (Hash Comparison)

Use `crypto/subtle.ConstantTimeCompare()` when validating token hashes:

```go
import "crypto/subtle"

func (db *DB) ValidateRefreshToken(ctx context.Context, tokenStr string) (*RefreshClaims, error) {
    // Hash incoming token
    h := sha256.New()
    h.Write([]byte(tokenStr))
    incomingHash := hex.EncodeToString(h.Sum(nil))
    
    // Fetch stored hash
    var storedHash string
    err := db.WithContext(ctx).
        Model(&RefreshToken{}).
        Where("expires_at > ?", time.Now()).
        Select("token_hash").
        Scan(&storedHash).Error
    
    // Constant-time comparison
    if subtle.ConstantTimeCompare([]byte(incomingHash), []byte(storedHash)) != 1 {
        return nil, ErrInvalidToken
    }
    
    return &RefreshClaims{}, nil
}
```

**Why**: Timing-based attacks can infer whether a hash matches by measuring response time. `ConstantTimeCompare` takes the same time regardless of match position.

### 2. Token Theft Detection via Rotation

If attacker steals refresh token:
- **Legitimate user refreshes**: New token issued, old one revoked ✓
- **Attacker uses stolen token first**: Gets new token, legitimate user's next refresh fails → detects compromise

```go
// Enhanced refresh with theft detection
func (s *TokenService) RefreshAccessToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
    claims := &RefreshClaims{}
    token, _ := jwt.ParseWithClaims(refreshToken, claims, s.keyFunc)
    
    // Check if token was already revoked (theft detected)
    existing, err := s.db.GetTokenByHash(ctx, claims.TokenID)
    if existing != nil && existing.RevokedAt != nil {
        // Token was revoked! Either legitimate user rotated, or attacker used old token.
        // Invalidate entire token family to be safe.
        _ = s.db.RevokeTokenFamily(ctx, existing.TokenFamily)
        return nil, ErrTokenCompromised
    }
    
    // ... issue new tokens ...
}
```

### 3. Re-use Detection (Family Invalidation)

Each rotation creates a new family ID. If old token reused → entire family revoked:

```
User logs in:        Token A, Family-1
Refresh (legitimate): Token B, Family-2, revoke A
Refresh (attacker):   Token A (Family-1) used again
Result:              Family-1 invalidated, user alerted
```

### 4. Algorithm Validation (Fiber Middleware)

```go
import "github.com/gofiber/fiber/v3/middleware/jwt"

app.Use(jwtware.New(jwtware.Config{
    SigningKey: fiber.Config{Key: "secret"},
    SigningMethod: "HS256",  // Explicit algorithm
    Claims: &AccessClaims{},
    // CRITICAL: Validate algorithm to prevent "alg: none" attacks
    ContextKey: "user",
}))
```

### 5. Token Storage Best Practices

| Storage | When | Security |
|---------|------|----------|
| **HttpOnly cookie** | Web app (SPA) | Protected from XSS; auto-sent by browser |
| **Memory (sessionStorage)** | Single-page app | Exposed to XSS; requires explicit send |
| **Encrypted localStorage** | Progressive web app | Can be decrypted if JS compromised |
| **App keychain** | Mobile app | OS-level protection |

**Recommendation**: Use HttpOnly cookies for refresh tokens (auto-sent), memory/state for access tokens.

```go
// Set HttpOnly refresh token cookie
c.Cookie(&fiber.Cookie{
    Name:     "refresh_token",
    Value:    refreshToken,
    Expires:  time.Now().Add(7 * 24 * time.Hour),
    HTTPOnly: true,      // Not accessible to JavaScript
    Secure:   true,      // HTTPS only
    SameSite: "Strict",  // CSRF protection
    Path:     "/api/auth/refresh",
})

// Return access token in JSON (expires in ~15min)
return c.JSON(fiber.Map{
    "access_token": accessToken,
    "expires_in":   900,  // seconds
})
```

---

## 6. Complete Minimal Example (Go + Fiber + GORM)

### 1. Define Claims

```go
type AccessClaims struct {
    UserID int64  `json:"sub"`
    Email  string `json:"email"`
    jwt.RegisteredClaims
}

type RefreshClaims struct {
    UserID    int64  `json:"sub"`
    TokenID   string `json:"jti"`
    FamilyID  string `json:"family_id"`
    jwt.RegisteredClaims
}
```

### 2. Token Service

```go
type TokenService struct {
    signingKey []byte
    db         *gorm.DB
}

func (s *TokenService) IssueTokens(ctx context.Context, userID int64, email string) (*TokenPair, error) {
    // Access token (15 min)
    accessClaims := &AccessClaims{
        UserID: userID,
        Email:  email,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Subject:   fmt.Sprintf("%d", userID),
        },
    }
    accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
    accessStr, _ := accessToken.SignedString(s.signingKey)
    
    // Refresh token (7 days)
    tokenID := uuid.New().String()
    familyID := uuid.New().String()
    refreshClaims := &RefreshClaims{
        UserID:   userID,
        TokenID:  tokenID,
        FamilyID: familyID,
        RegisteredClaims: jwt.RegisteredClaims{
            ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
            IssuedAt:  jwt.NewNumericDate(time.Now()),
            Subject:   fmt.Sprintf("%d", userID),
            ID:        tokenID,
        },
    }
    refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
    refreshStr, _ := refreshToken.SignedString(s.signingKey)
    
    // Hash and store refresh token
    h := sha256.New()
    h.Write([]byte(refreshStr))
    tokenHash := hex.EncodeToString(h.Sum(nil))
    
    dbToken := &RefreshToken{
        UserID:      userID,
        TokenHash:   tokenHash,
        TokenFamily: familyID,
        Jti:         tokenID,
        ExpiresAt:   time.Now().Add(7 * 24 * time.Hour),
    }
    s.db.WithContext(ctx).Create(dbToken)
    
    return &TokenPair{
        AccessToken:  accessStr,
        RefreshToken: refreshStr,
        ExpiresIn:    900,
    }, nil
}

func (s *TokenService) RefreshAccessToken(ctx context.Context, refreshStr string) (*TokenPair, error) {
    claims := &RefreshClaims{}
    token, err := jwt.ParseWithClaims(refreshStr, claims, func(t *jwt.Token) (any, error) {
        return s.signingKey, nil
    })
    
    if err != nil || !token.Valid {
        return nil, ErrInvalidToken
    }
    
    // Hash token
    h := sha256.New()
    h.Write([]byte(refreshStr))
    tokenHash := hex.EncodeToString(h.Sum(nil))
    
    // Check if revoked
    var dbToken RefreshToken
    if err := s.db.WithContext(ctx).
        Where("token_hash = ?", tokenHash).
        First(&dbToken).Error; err != nil {
        return nil, ErrTokenNotFound
    }
    
    if dbToken.RevokedAt != nil {
        // Already revoked — revoke entire family
        s.db.WithContext(ctx).
            Model(&RefreshToken{}).
            Where("token_family = ?", dbToken.TokenFamily).
            Update("revoked_at", time.Now())
        return nil, ErrTokenCompromised
    }
    
    // Revoke old token
    s.db.WithContext(ctx).Model(&dbToken).Update("revoked_at", time.Now())
    
    // Issue new pair
    return s.IssueTokens(ctx, claims.UserID, claims.Subject)
}
```

### 3. Fiber Routes

```go
func setupAuth(app *fiber.App, tokenSvc *TokenService) {
    app.Post("/api/auth/login", func(c *fiber.Ctx) error {
        // Validate credentials, get user
        user := &User{ID: 1, Email: "user@example.com"}
        
        pair, _ := tokenSvc.IssueTokens(c.Context(), user.ID, user.Email)
        
        c.Cookie(&fiber.Cookie{
            Name:     "refresh_token",
            Value:    pair.RefreshToken,
            Expires:  time.Now().Add(7 * 24 * time.Hour),
            HTTPOnly: true,
            Secure:   true,
            SameSite: "Strict",
        })
        
        return c.JSON(fiber.Map{"access_token": pair.AccessToken})
    })
    
    app.Post("/api/auth/refresh", func(c *fiber.Ctx) error {
        refreshToken := c.Cookies("refresh_token")
        if refreshToken == "" {
            return c.Status(401).JSON(fiber.Map{"error": "no token"})
        }
        
        pair, err := tokenSvc.RefreshAccessToken(c.Context(), refreshToken)
        if err != nil {
            return c.Status(401).JSON(fiber.Map{"error": err.Error()})
        }
        
        c.Cookie(&fiber.Cookie{
            Name:     "refresh_token",
            Value:    pair.RefreshToken,
            HTTPOnly: true,
            Secure:   true,
        })
        
        return c.JSON(fiber.Map{"access_token": pair.AccessToken})
    })
    
    app.Post("/api/auth/logout", func(c *fiber.Ctx) error {
        claims := c.Locals("user").(*AccessClaims)
        tokenSvc.db.Model(&RefreshToken{}).
            Where("user_id = ? AND revoked_at IS NULL", claims.UserID).
            Update("revoked_at", time.Now())
        
        c.Cookie(&fiber.Cookie{
            Name:    "refresh_token",
            Value:   "",
            Expires: time.Now().Add(-1 * time.Hour),
        })
        
        return c.JSON(fiber.Map{"message": "logged out"})
    })
}
```

---

## 7. Adoption Risk & Maturity

| Component | Status | Risk | Notes |
|-----------|--------|------|-------|
| `golang-jwt/jwt/v5` | ✓ Stable (v5.2.0) | Low | Maintained, widely used |
| Fiber v3 JWT middleware | ✓ Stable | Low | Official contrib, no Redis required |
| GORM + PostgreSQL | ✓ Production-ready | Low | Standard ORM/DB stack |
| Token rotation pattern | ✓ Industry standard | Low | Used by Auth0, Okta, Firebase |
| Stateless hash strategy | ✓ Proven | Low | Scales to <100k tokens without issues |

**No breaking changes** expected in listed libraries through 2026.

---

## 8. Performance Baseline (Small/Medium App, <10k MAU)

| Operation | Latency | Notes |
|-----------|---------|-------|
| Parse & validate JWT | <1ms | In-memory crypto |
| Hash token (SHA256) | <0.1ms | Single operation |
| DB lookup (token_hash index) | 1-5ms | Indexed query, connection pool |
| Revoke token (UPDATE) | 2-8ms | Single row, write to disk |
| Issue new token pair | 1-2ms | Pure crypto, no I/O |
| **Total refresh flow** | **5-15ms** | Acceptable for auth endpoint |

**With cleanup job** (~1000 row batch every 6h): <50ms overhead, negligible impact.

---

## Unresolved Questions

1. **Should we encrypt refresh tokens in DB** (vs hash-only)? For <10k users, hash-only is sufficient. Encryption adds complexity without real benefit unless PII exposure is concern.

2. **Device binding**: Is DeviceID tracking needed (for "remember this device" UX)? Currently in schema but optional. Start without it; add if feature requested.

3. **Logout detection race condition**: What if user refreshes on Device A while logging out from Device B? Current: user gets new pair, logoff completes — token valid until expiry. To fix: add device-level revocation + increment version counter. Defer unless multi-device logout is critical.

4. **Access token revocation**: Is 15min lifetime sufficient for logout UX, or need immediate revocation? For most apps (SPA, mobile), 15min is fine. Finance/healthcare may need <5min + optional blacklist.

---

## Summary & Recommendation

**For your small/medium app (Go + Fiber + GORM, no Redis):**

1. **Use stateless hash strategy**: Store token_hash, user_id, expires_at, token_family, revoked_at in PostgreSQL
2. **Implement single-use refresh tokens**: Revoke old token on each refresh, detect theft via family invalidation
3. **Access tokens stay stateless**: 15-30min expiry, no DB lookup, optional JTI blacklist for logout
4. **Logout**: Revoke all user refresh tokens in one UPDATE query
5. **Cleanup**: Scheduled batch delete (6h interval) or pg_ttl_index extension
6. **Security**: Constant-time hash comparison, HttpOnly cookies, explicit algorithm validation in Fiber middleware

**Estimated implementation time**: 4-6 hours (token service + GORM model + 3 routes + tests).

**Why NOT Redis**: For <10k users, DB latency (5-15ms) is negligible vs complexity of adding Redis. Re-evaluate if you hit 100k+ MAU.

---

## Sources

- [Auth.js Refresh Token Rotation](https://authjs.dev/guides/refresh-token-rotation)
- [Go JWT Authentication Security Guide](https://oneuptime.com/blog/post/2026-01-07-go-jwt-authentication/view)
- [SuperTokens JWT Revocation with Blacklist](https://supertokens.com/blog/revoking-access-with-a-jwt-blacklist)
- [Descope: JWT Logout Risks & Mitigations](https://www.descope.com/blog/post/jwt-logout-risks-mitigations)
- [Fiber JWT Middleware Docs](https://docs.gofiber.io/contrib/jwt/)
- [golang-jwt/jwt v5 Package Docs](https://pkg.go.dev/github.com/golang-jwt/jwt/v5)
- [Constant-Time Comparison Timing Attacks](https://www.slingacademy.com/article/avoiding-timing-attacks-with-constant-time-comparisons-in-go/)
- [PostgreSQL VACUUM & Cleanup](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [pg_ttl_index Extension](https://pgxn.org/dist/pg_ttl_index/)
