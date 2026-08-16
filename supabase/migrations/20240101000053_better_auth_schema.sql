-- Better Auth Schema Migration
-- Creates tables required by Better Auth while preserving existing users table

-- =============================================
-- 1. Add email_verified_at to users table
-- =============================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Index for email verification queries
CREATE INDEX IF NOT EXISTS idx_users_email_verified_at ON users(email_verified_at);

-- =============================================
-- 2. Create sessions table for Better Auth
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- =============================================
-- 3. Create accounts table for Better Auth
-- Stores password hashes and OAuth provider data
-- =============================================
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  -- Password hash (for email/password auth)
  password TEXT,
  -- OAuth tokens
  access_token TEXT,
  refresh_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  id_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint: one account per provider per user
  UNIQUE(user_id, provider_id)
);

-- Indexes for account lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider_account ON accounts(provider_id, account_id);

-- =============================================
-- 4. Create verifications table for Better Auth
-- Stores email verification, password reset tokens
-- =============================================
CREATE TABLE IF NOT EXISTS verifications (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for verification lookups
CREATE INDEX IF NOT EXISTS idx_verifications_identifier ON verifications(identifier);
CREATE INDEX IF NOT EXISTS idx_verifications_expires_at ON verifications(expires_at);

-- =============================================
-- 5. Create members table for organization plugin
-- Links users to organizations with roles
-- =============================================
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint: one membership per user per org
  UNIQUE(organization_id, user_id)
);

-- Indexes for member lookups
CREATE INDEX IF NOT EXISTS idx_members_organization_id ON members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- =============================================
-- 6. Create invitations table for organization plugin
-- =============================================
CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  inviter_id UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for invitation lookups
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- =============================================
-- 7. RLS Policies for Better Auth tables
-- =============================================

-- Enable RLS on all Better Auth tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can only see their own sessions
CREATE POLICY sessions_select_own ON sessions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY sessions_insert_own ON sessions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY sessions_delete_own ON sessions
  FOR DELETE USING (user_id = auth.uid());

-- Accounts: Users can only see their own accounts
CREATE POLICY accounts_select_own ON accounts
  FOR SELECT USING (user_id = auth.uid());

-- Verifications: No direct user access (handled by Better Auth)
-- Service role will be used for verification operations

-- Members: Users can see members of their organization
CREATE POLICY members_select_org ON members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Invitations: Users can see invitations for their organization (admins/managers)
CREATE POLICY invitations_select_org ON invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================
-- 8. Helper function for Better Auth session token
-- Used by RLS policies during dual-auth period
-- =============================================
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  -- First try Better Auth session
  SELECT user_id::UUID FROM sessions
  WHERE token = current_setting('app.session_token', true)
  AND expires_at > NOW()
  LIMIT 1
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_current_user_id() TO authenticated;

-- =============================================
-- 9. Cleanup function for expired sessions/verifications
-- =============================================
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired sessions
  DELETE FROM sessions WHERE expires_at < NOW();

  -- Delete expired verifications
  DELETE FROM verifications WHERE expires_at < NOW();
END;
$$;

-- Comment for documentation
COMMENT ON TABLE sessions IS 'Better Auth session storage - stores active user sessions';
COMMENT ON TABLE accounts IS 'Better Auth account storage - stores credentials and OAuth tokens';
COMMENT ON TABLE verifications IS 'Better Auth verification storage - stores email verification and password reset tokens';
COMMENT ON TABLE members IS 'Better Auth organization members - links users to organizations';
COMMENT ON TABLE invitations IS 'Better Auth organization invitations - pending invites to join organizations';
COMMENT ON FUNCTION get_current_user_id() IS 'Returns current user ID from Better Auth session token';
