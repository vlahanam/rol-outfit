# Phase 1: Database Migrations

## Overview
- **Priority:** High
- **Status:** complete
- **Effort:** 30m

## Files to Create
- `backend/database/migrations/000022_add_order_code_column.up.sql`
- `backend/database/migrations/000022_add_order_code_column.down.sql`
- `backend/database/migrations/000023_create_order_code_sequences.up.sql`
- `backend/database/migrations/000023_create_order_code_sequences.down.sql`

## Implementation

### Migration 000022: Add order_code column

**Up:**
```sql
ALTER TABLE orders ADD COLUMN order_code VARCHAR(15);
CREATE UNIQUE INDEX idx_orders_order_code ON orders(order_code) WHERE order_code IS NOT NULL;
```

**Down:**
```sql
DROP INDEX IF EXISTS idx_orders_order_code;
ALTER TABLE orders DROP COLUMN IF EXISTS order_code;
```

### Migration 000023: Create sequence table

**Up:**
```sql
CREATE TABLE order_code_sequences (
    date_key VARCHAR(6) PRIMARY KEY,
    last_sequence INT NOT NULL DEFAULT 0
);
```

**Down:**
```sql
DROP TABLE IF EXISTS order_code_sequences;
```

## Todo
- [ ] Create migration 000022 files
- [ ] Create migration 000023 files
- [ ] Run migrations locally
- [ ] Verify table structure

## Notes
- `order_code` starts nullable for backfill compatibility
- Unique index uses partial index (WHERE NOT NULL) to allow NULL during migration
- After backfill complete, can alter to NOT NULL if desired
