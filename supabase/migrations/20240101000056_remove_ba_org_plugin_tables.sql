-- Remove Better Auth Organization Plugin Tables
-- These tables (members, invitations) are redundant since we use:
--   - users.organization_id FK for org membership
--   - organization_invitations table for invites
--   - users.role for role management
--   - RLS policies via get_user_organization_id()

-- =============================================
-- 1. Drop RLS policies on members table
-- =============================================
DROP POLICY IF EXISTS members_select_org ON members;

-- =============================================
-- 2. Drop RLS policies on invitations table
-- =============================================
DROP POLICY IF EXISTS invitations_select_org ON invitations;

-- =============================================
-- 3. Drop members table (BA org plugin)
-- =============================================
DROP TABLE IF EXISTS members;

-- =============================================
-- 4. Drop invitations table (BA org plugin)
-- Note: We keep organization_invitations (our custom table)
-- =============================================
DROP TABLE IF EXISTS invitations;

-- =============================================
-- Documentation
-- =============================================
COMMENT ON TABLE organization_invitations IS 'Custom invitation system for RepWell - stores pending team invites';
