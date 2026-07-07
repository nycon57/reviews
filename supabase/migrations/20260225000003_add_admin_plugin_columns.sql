-- Add columns required by Better Auth admin plugin
-- The admin() plugin expects: banned, ban_reason, ban_expires on users
-- and impersonated_by on sessions

-- =============================================
-- 1. Users table: admin plugin columns
-- =============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS ban_expires TIMESTAMPTZ;

-- =============================================
-- 2. Sessions table: impersonation tracking
-- =============================================
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS impersonated_by TEXT;
