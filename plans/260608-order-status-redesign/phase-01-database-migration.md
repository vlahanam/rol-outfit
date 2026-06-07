# Phase 1: Database Migration

## Overview
Create migration for `order_status_history` table and document status enum values.

**Priority:** High | **Status:** pending | **Effort:** 0.5h

## Files to Create

- `backend/database/migrations/000002_order_status_history.up.sql`
- `backend/database/migrations/000002_order_status_history.down.sql`

## Implementation

### Migration Up

```sql
-- Order status history for audit trail
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status SMALLINT,
    to_status SMALLINT NOT NULL,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_status_history_created ON order_status_history(created_at DESC);

-- Document status values
COMMENT ON COLUMN orders.status IS 'Status: 1=AWAITING_PAYMENT, 2=PAYMENT_SUBMITTED, 3=CONFIRMED, 4=SHIPPING, 5=COMPLETED, 6=CANCELLED, 7=REFUND_REQUESTED, 8=REFUNDED';
```

### Migration Down

```sql
DROP TABLE IF EXISTS order_status_history;
```

## Database Reset Note

User confirmed DB can be reset. After migration:
1. Run `make db-shell`
2. Execute: `TRUNCATE orders, order_item, carts, cart_item CASCADE;`
3. Or recreate database entirely

## Todo

- [ ] Create migration files
- [ ] Run migration locally
- [ ] Verify table structure with `\d order_status_history`

## Success Criteria

- `order_status_history` table exists with correct schema
- Indexes created for query performance
- Foreign key constraints in place
