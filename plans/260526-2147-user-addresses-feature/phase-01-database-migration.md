# Phase 1: Database Migration

**Status:** pending | **Effort:** 15min | **Priority:** critical

## Overview
Create PostgreSQL migration for `user_addresses` table.

## Files to Create
- `backend/database/migrations/000020_create_user_addresses.up.sql`
- `backend/database/migrations/000020_create_user_addresses.down.sql`

## Implementation

### Up Migration
```sql
CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  address TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_user_addresses_user ON user_addresses(user_id, deleted_at);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE deleted_at IS NULL;
```

### Down Migration
```sql
DROP TABLE IF EXISTS user_addresses;
```

## Validation
- Run `make migrate-up` or equivalent
- Check table exists in PostgreSQL

## Todo
- [ ] Create up migration file
- [ ] Create down migration file
- [ ] Run migration
- [ ] Verify table structure
