# Phase 1: Database Migration

**Priority:** High | **Status:** completed | **Effort:** S

## Overview

Create `user_oauth_providers` table and make `users.password` nullable for OAuth-only users.

## Files

| Action | Path |
|--------|------|
| Create | `backend/database/migrations/000025_add_oauth_providers.up.sql` |
| Create | `backend/database/migrations/000025_add_oauth_providers.down.sql` |
| Create | `backend/src/internal/models/user_oauth_provider.go` |
| Modify | `backend/src/internal/models/user.go` |

## Implementation

### 1. Migration Up (`000025_add_oauth_providers.up.sql`)

```sql
-- Create user_oauth_providers table
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

-- Indexes for efficient lookups
CREATE INDEX idx_oauth_provider_user ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX idx_oauth_user_id ON user_oauth_providers(user_id);

-- Make password nullable for OAuth-only users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
```

### 2. Migration Down (`000025_add_oauth_providers.down.sql`)

```sql
-- Restore password NOT NULL (will fail if OAuth-only users exist)
-- UPDATE users SET password = '' WHERE password IS NULL;
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Drop indexes
DROP INDEX IF EXISTS idx_oauth_user_id;
DROP INDEX IF EXISTS idx_oauth_provider_user;

-- Drop table
DROP TABLE IF EXISTS user_oauth_providers;
```

### 3. Model (`user_oauth_provider.go`)

```go
package models

import "time"

type UserOAuthProvider struct {
    ID             string    `gorm:"type:uuid;primaryKey"`
    UserID         string    `gorm:"column:user_id;type:uuid;not null"`
    Provider       string    `gorm:"column:provider;type:varchar(20);not null"`
    ProviderUserID string    `gorm:"column:provider_user_id;type:varchar(255);not null"`
    Email          *string   `gorm:"column:email;type:varchar(255)"`
    Name           *string   `gorm:"column:name;type:varchar(255)"`
    AvatarURL      *string   `gorm:"column:avatar_url;type:text"`
    CreatedAt      time.Time `gorm:"column:created_at"`
    UpdatedAt      time.Time `gorm:"column:updated_at"`

    User User `gorm:"foreignKey:UserID"`
}

func (UserOAuthProvider) TableName() string {
    return "user_oauth_providers"
}

const (
    OAuthProviderGoogle   = "google"
    OAuthProviderFacebook = "facebook"
)
```

### 4. Modify User Model (`user.go`)

Change `Password string` to `Password *string` (pointer for nullable):

```go
type User struct {
    // ... other fields
    Password  *string  `gorm:"column:password"` // nullable for OAuth users
    // ... other fields
}
```

## Todo

- [ ] Create migration up file
- [ ] Create migration down file
- [ ] Create UserOAuthProvider model
- [ ] Update User model (Password → *string)
- [ ] Run migration: `make migrate-up`
- [ ] Verify table created in DB

## Verification

```bash
# Run migration
cd backend && go run ./src/cmd/main.go migrate up

# Verify in psql
psql -d rol_outfit -c "\d user_oauth_providers"
psql -d rol_outfit -c "\d users" | grep password
```

## Risk

- Down migration will fail if OAuth-only users exist (password IS NULL)
- Solution: Document that down migration requires manual cleanup
