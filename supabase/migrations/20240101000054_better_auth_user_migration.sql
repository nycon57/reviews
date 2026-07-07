-- Better Auth User Migration
-- Migrates existing Supabase Auth users to Better Auth accounts table

-- =============================================
-- 1. Migrate password hashes from auth.users to accounts table
-- Supabase uses bcrypt, Better Auth uses bcrypt - direct copy compatible
-- =============================================

-- Insert credential accounts for all existing users with passwords
INSERT INTO accounts (id, user_id, account_id, provider_id, password, created_at, updated_at)
SELECT
  gen_random_uuid()::text,
  u.id,
  u.id::text,
  'credential',
  au.encrypted_password,
  u.created_at,
  NOW()
FROM users u
JOIN auth.users au ON au.id = u.id
WHERE au.encrypted_password IS NOT NULL
  AND au.encrypted_password != ''
  AND NOT EXISTS (
    SELECT 1 FROM accounts a
    WHERE a.user_id = u.id AND a.provider_id = 'credential'
  );

-- =============================================
-- 2. Migrate email verification status
-- =============================================
UPDATE users u
SET email_verified_at = au.email_confirmed_at
FROM auth.users au
WHERE au.id = u.id
  AND au.email_confirmed_at IS NOT NULL
  AND u.email_verified_at IS NULL;

-- =============================================
-- 3. Create organization members for existing users
-- All existing users should be members of their organization
-- =============================================
INSERT INTO members (id, organization_id, user_id, role, created_at)
SELECT
  gen_random_uuid()::text,
  u.organization_id,
  u.id,
  CASE
    WHEN u.role = 'admin' AND u.is_owner = true THEN 'owner'
    WHEN u.role = 'admin' THEN 'admin'
    ELSE 'member'
  END,
  u.created_at
FROM users u
WHERE u.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM members m
    WHERE m.user_id = u.id AND m.organization_id = u.organization_id
  );

-- =============================================
-- 4. Validation queries (run manually to verify)
-- =============================================

-- Count users vs accounts
-- SELECT
--   (SELECT COUNT(*) FROM users) as total_users,
--   (SELECT COUNT(*) FROM accounts WHERE provider_id = 'credential') as migrated_accounts;

-- Check email verification migration
-- SELECT
--   (SELECT COUNT(*) FROM users WHERE email_verified_at IS NOT NULL) as verified_users,
--   (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as supabase_verified;

-- Check members creation
-- SELECT
--   (SELECT COUNT(*) FROM users WHERE organization_id IS NOT NULL) as users_with_org,
--   (SELECT COUNT(*) FROM members) as total_members;

-- =============================================
-- 5. Add comment for documentation
-- =============================================
COMMENT ON TABLE accounts IS 'Better Auth accounts - password hashes migrated from Supabase auth.users';
