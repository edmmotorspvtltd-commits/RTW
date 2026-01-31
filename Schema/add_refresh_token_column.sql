-- ================================================================================
-- ADD refresh_token COLUMN TO user_sessions TABLE
-- This migration adds the refresh_token column needed for JWT refresh tokens
-- ================================================================================

-- Add refresh_token column to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Create index on refresh_token for faster lookups during logout
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON user_sessions(refresh_token);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_sessions'
AND column_name = 'refresh_token';

-- Success message
SELECT '✅ refresh_token column added successfully!' as status;
