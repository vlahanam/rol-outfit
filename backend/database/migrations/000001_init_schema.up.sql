-- =============================================================================
-- ROL-OUTFIT CONSOLIDATED SCHEMA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------
CREATE TYPE widget_type AS ENUM (
    'banner-slider',
    'collection-grid',
    'new-product',
    'trend-hot'
);

-- -----------------------------------------------------------------------------
-- USERS
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name  TEXT        NOT NULL,
    email      TEXT        NOT NULL,
    password   TEXT,
    phone      TEXT        NOT NULL DEFAULT '',
    role       SMALLINT    NOT NULL DEFAULT 2,
    status     SMALLINT    NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT users_phone_check CHECK (phone = '' OR (length(phone) >= 10 AND length(phone) <= 15))
);

COMMENT ON COLUMN users.role   IS '1: admin, 2: customer';
COMMENT ON COLUMN users.status IS '1: active, 2: blocked';

CREATE UNIQUE INDEX idx_users_email   ON users (email);
CREATE UNIQUE INDEX idx_users_phone   ON users (phone) WHERE phone != '';
CREATE INDEX        idx_users_status  ON users (status);
CREATE INDEX        idx_users_role    ON users (role);
CREATE INDEX        idx_users_deleted ON users (deleted_at);

-- -----------------------------------------------------------------------------
-- USER OAUTH PROVIDERS
-- -----------------------------------------------------------------------------
CREATE TABLE user_oauth_providers (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider         VARCHAR(20)  NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id VARCHAR(255) NOT NULL,
    email            VARCHAR(255),
    name             VARCHAR(255),
    avatar_url       TEXT,
    created_at       TIMESTAMPTZ  DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
);

CREATE INDEX idx_oauth_provider_user ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX idx_oauth_user_id       ON user_oauth_providers(user_id);

-- -----------------------------------------------------------------------------
-- USER ADDRESSES
-- -----------------------------------------------------------------------------
CREATE TABLE user_addresses (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_name VARCHAR(100) NOT NULL,
    phone          VARCHAR(15)  NOT NULL,
    address        TEXT         NOT NULL,
    is_default     BOOLEAN      DEFAULT false,
    created_at     TIMESTAMPTZ  DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

CREATE INDEX idx_user_addresses_user    ON user_addresses(user_id, deleted_at);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE deleted_at IS NULL;

-- -----------------------------------------------------------------------------
-- REFRESH TOKENS
-- -----------------------------------------------------------------------------
CREATE TABLE refresh_tokens (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT        NOT NULL,
    token_family UUID        NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_refresh_tokens_token_hash  ON refresh_tokens (token_hash);
CREATE INDEX        idx_refresh_tokens_user_revoked ON refresh_tokens (user_id, revoked_at);
CREATE INDEX        idx_refresh_tokens_family       ON refresh_tokens (token_family);
CREATE INDEX        idx_refresh_tokens_expires      ON refresh_tokens (expires_at);

-- -----------------------------------------------------------------------------
-- CATEGORIES
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name           TEXT        NOT NULL,
    name_ja        VARCHAR(255),
    slug           TEXT        NOT NULL,
    status         SMALLINT    NOT NULL DEFAULT 1,
    description    TEXT,
    description_ja TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ
);

COMMENT ON COLUMN categories.status IS '1: visible, 2: hidden';

CREATE UNIQUE INDEX idx_categories_slug    ON categories (slug);
CREATE INDEX        idx_categories_status  ON categories (status);
CREATE INDEX        idx_categories_deleted ON categories (deleted_at);

-- -----------------------------------------------------------------------------
-- TAGS
-- -----------------------------------------------------------------------------
CREATE TABLE tags (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    name_ja    VARCHAR(255),
    slug       TEXT        NOT NULL,
    start_at   TIMESTAMPTZ,
    end_at     TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN tags.start_at IS 'Display start (NULL = no limit)';
COMMENT ON COLUMN tags.end_at   IS 'Display end (NULL = no limit)';

CREATE UNIQUE INDEX idx_tags_slug   ON tags (slug);
CREATE INDEX        idx_tags_window ON tags (start_at, end_at);

-- -----------------------------------------------------------------------------
-- PRODUCTS
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id       UUID           NOT NULL REFERENCES categories (id),
    name              TEXT           NOT NULL,
    name_ja           VARCHAR(255),
    slug              TEXT           NOT NULL,
    default_price     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    description       TEXT,
    description_ja    TEXT,
    avatar            TEXT,
    status            SMALLINT       NOT NULL DEFAULT 1,
    attribute_names   TEXT[]         NOT NULL DEFAULT '{}',
    discount_percent  NUMERIC(5,2)   NOT NULL DEFAULT 0,
    discount_start_at TIMESTAMPTZ,
    discount_end_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

COMMENT ON COLUMN products.status           IS '1: active, 2: hidden';
COMMENT ON COLUMN products.attribute_names  IS 'Variant attribute names (e.g., {Size, Color})';
COMMENT ON COLUMN products.discount_percent IS '0-100, 0 = no discount';

CREATE INDEX        idx_products_category_id ON products (category_id);
CREATE UNIQUE INDEX idx_products_slug        ON products (slug);
CREATE INDEX        idx_products_status      ON products (status);
CREATE INDEX        idx_products_deleted     ON products (deleted_at);
CREATE INDEX        idx_products_attr_names  ON products USING GIN (attribute_names);
CREATE INDEX        idx_products_discount    ON products (discount_percent) WHERE discount_percent > 0;

-- -----------------------------------------------------------------------------
-- PRODUCT VARIANTS
-- -----------------------------------------------------------------------------
CREATE TABLE product_variants (
    id                UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID           NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    name              VARCHAR(255),
    name_ja           VARCHAR(255),
    attributes        JSONB          NOT NULL DEFAULT '{}',
    price             NUMERIC(12, 2) NOT NULL DEFAULT 0,
    stock             INTEGER        NOT NULL DEFAULT 0,
    sold              INTEGER        NOT NULL DEFAULT 0,
    avatar            TEXT,
    status            SMALLINT       NOT NULL DEFAULT 1,
    discount_percent  NUMERIC(5,2)   NOT NULL DEFAULT 0,
    discount_start_at TIMESTAMPTZ,
    discount_end_at   TIMESTAMPTZ,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN product_variants.status           IS '1: visible, 2: hidden';
COMMENT ON COLUMN product_variants.attributes       IS 'Attribute values (e.g., {"Size": "39", "Color": "Black"})';
COMMENT ON COLUMN product_variants.discount_percent IS '0 = use product discount';

CREATE INDEX idx_variants_product_id ON product_variants (product_id);
CREATE INDEX idx_variants_attributes ON product_variants USING GIN (attributes);

-- -----------------------------------------------------------------------------
-- PRODUCT TAGS
-- -----------------------------------------------------------------------------
CREATE TABLE product_tags (
    product_id UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    tag_id     UUID        NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (product_id, tag_id)
);

CREATE INDEX idx_product_tags_tag     ON product_tags (tag_id);
CREATE INDEX idx_product_tags_product ON product_tags (product_id);

-- -----------------------------------------------------------------------------
-- CARTS
-- -----------------------------------------------------------------------------
CREATE TABLE carts (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_carts_user_id ON carts (user_id);

-- -----------------------------------------------------------------------------
-- CART ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE cart_item (
    id           UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id      UUID           NOT NULL REFERENCES carts (id),
    product_id   UUID           NOT NULL REFERENCES products (id),
    attr_id      UUID,
    price_at_add NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity     INTEGER        NOT NULL DEFAULT 1,
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cart_item_cart_id    ON cart_item (cart_id);
CREATE INDEX idx_cart_item_product_id ON cart_item (product_id);
CREATE INDEX idx_cart_item_attr_id    ON cart_item (attr_id);

-- -----------------------------------------------------------------------------
-- ORDERS
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL REFERENCES users (id),
    order_code       VARCHAR(16),
    shipping_address TEXT           NOT NULL,
    phone            TEXT           NOT NULL,
    total_price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    status           SMALLINT       NOT NULL DEFAULT 1,
    note             TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMPTZ
);

COMMENT ON COLUMN orders.status IS '1: pending, 2: confirmed, 3: shipping, 4: delivered, 5: paid, 6: cancelled';

CREATE        INDEX idx_orders_user_id    ON orders (user_id);
CREATE UNIQUE INDEX idx_orders_order_code ON orders (order_code) WHERE order_code IS NOT NULL;
CREATE        INDEX idx_orders_status     ON orders (status);
CREATE        INDEX idx_orders_created_at ON orders (created_at);
CREATE        INDEX idx_orders_deleted    ON orders (deleted_at);

-- -----------------------------------------------------------------------------
-- ORDER ITEMS
-- -----------------------------------------------------------------------------
CREATE TABLE order_item (
    id         UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id   UUID           NOT NULL REFERENCES orders (id),
    product_id UUID           NOT NULL REFERENCES products (id),
    attr_id    UUID,
    price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    quantity   INTEGER        NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_item_order_id   ON order_item (order_id);
CREATE INDEX idx_order_item_product_id ON order_item (product_id);
CREATE INDEX idx_order_item_attr_id    ON order_item (attr_id);

-- -----------------------------------------------------------------------------
-- ORDER CODE SEQUENCES
-- -----------------------------------------------------------------------------
CREATE TABLE order_code_sequences (
    date_key      VARCHAR(6) PRIMARY KEY,
    last_sequence INT        NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- WIDGETS
-- -----------------------------------------------------------------------------
CREATE TABLE widgets (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id     UUID         REFERENCES widgets(id) ON DELETE CASCADE,
    name          VARCHAR(255) NOT NULL,
    name_ja       VARCHAR(255),
    type          widget_type  NOT NULL,
    display_order INTEGER      NOT NULL,
    depth         INTEGER      DEFAULT 0,
    status        SMALLINT     NOT NULL DEFAULT 1,
    settings      JSONB        DEFAULT '{}'::jsonb,
    metadata      JSONB        DEFAULT '{}'::jsonb,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

COMMENT ON COLUMN widgets.status IS '1: hidden, 2: visible';

CREATE INDEX idx_widgets_parent_order ON widgets(parent_id, display_order);

-- -----------------------------------------------------------------------------
-- SEED DATA: DEFAULT WIDGETS
-- -----------------------------------------------------------------------------
INSERT INTO widgets (id, parent_id, name, name_ja, type, display_order, depth, status, settings, metadata) VALUES
    (gen_random_uuid(), NULL, 'Banner Slider',        'バナースライダー',   'banner-slider',   1, 0, 2, '{}'::jsonb, '{}'::jsonb),
    (gen_random_uuid(), NULL, 'Bộ Sưu Tập Đặc Biệt', '特別コレクション',   'collection-grid', 2, 0, 2, '{}'::jsonb, '{}'::jsonb),
    (gen_random_uuid(), NULL, 'Hàng Mới Về',          '新着商品',           'new-product',     3, 0, 2, '{}'::jsonb, '{}'::jsonb),
    (gen_random_uuid(), NULL, 'Xu Hướng Hot',         '人気トレンド',       'trend-hot',       4, 0, 2, '{}'::jsonb, '{}'::jsonb);
