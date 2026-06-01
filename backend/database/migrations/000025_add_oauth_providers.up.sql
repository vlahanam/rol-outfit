-- Create user_oauth_providers table
CREATE TABLE user_oauth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('google', 'facebook')),
    provider_user_id VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Indexes for efficient lookups
CREATE INDEX idx_oauth_provider_user ON user_oauth_providers(provider, provider_user_id);
CREATE INDEX idx_oauth_user_id ON user_oauth_providers(user_id);

-- Make password nullable for OAuth-only users
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
