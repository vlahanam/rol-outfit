-- Restore password NOT NULL (will fail if OAuth-only users exist)
-- Run: UPDATE users SET password = '' WHERE password IS NULL; first if needed
ALTER TABLE users ALTER COLUMN password SET NOT NULL;

-- Drop indexes
DROP INDEX IF EXISTS idx_oauth_user_id;
DROP INDEX IF EXISTS idx_oauth_provider_user;

-- Drop table
DROP TABLE IF EXISTS user_oauth_providers;
