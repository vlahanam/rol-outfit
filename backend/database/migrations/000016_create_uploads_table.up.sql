CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL DEFAULT '',
    model_type TEXT NOT NULL DEFAULT '',
    model_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_uploads_model ON uploads (model_type, model_id);
CREATE INDEX idx_uploads_deleted_at ON uploads (deleted_at);
