CREATE TABLE IF NOT EXISTS tags (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT        NOT NULL,
    slug       TEXT        NOT NULL,
    start_at   TIMESTAMPTZ,
    end_at     TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_tags_slug   ON tags (slug);
CREATE INDEX        idx_tags_window ON tags (start_at, end_at);

COMMENT ON COLUMN tags.start_at IS 'Bắt đầu hiển thị (NULL = không giới hạn)';
COMMENT ON COLUMN tags.end_at   IS 'Kết thúc hiển thị (NULL = không giới hạn)';
