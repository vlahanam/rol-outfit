CREATE TABLE IF NOT EXISTS product_tags (
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     UUID        NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_tag     ON product_tags (tag_id);
CREATE INDEX idx_product_tags_product ON product_tags (product_id);
