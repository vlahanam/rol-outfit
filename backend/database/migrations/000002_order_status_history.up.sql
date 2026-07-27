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
