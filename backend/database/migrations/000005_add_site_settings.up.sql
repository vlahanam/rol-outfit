-- Site settings table for configurable site-wide values
CREATE TABLE site_settings (
    key         VARCHAR(50) PRIMARY KEY,
    value       TEXT        NOT NULL DEFAULT '',
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default social link settings
INSERT INTO site_settings (key, value, description) VALUES
    ('social_facebook_url', '', 'Facebook page URL'),
    ('social_zalo_url', '', 'Zalo contact URL');
