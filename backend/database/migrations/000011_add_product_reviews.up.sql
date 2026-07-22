-- Product reviews table
CREATE TABLE product_reviews (
    id          UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID           NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id     UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id    UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    rating      SMALLINT       NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT           NOT NULL DEFAULT '',
    status      SMALLINT       NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_user_product_review UNIQUE (user_id, product_id)
);

COMMENT ON COLUMN product_reviews.status IS '1: pending, 2: approved, 3: rejected';

CREATE INDEX idx_reviews_product_status ON product_reviews(product_id, status);
CREATE INDEX idx_reviews_user ON product_reviews(user_id);
CREATE INDEX idx_reviews_status ON product_reviews(status);
CREATE INDEX idx_reviews_created ON product_reviews(created_at DESC);
