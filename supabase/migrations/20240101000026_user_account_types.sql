-- User Account Types Migration
-- Adds account_type to organizations and is_owner to users for three-tier permission system

-- 1. Update subscription_tier constraint (remove 'free', use basic/pro/enterprise)
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

-- Note: We allow both old and new values during transition
-- Old: free, starter, professional, enterprise
-- New: basic, pro, enterprise
ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'starter', 'professional', 'basic', 'pro', 'enterprise'));

-- 2. Add account_type to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'enterprise'
  CHECK (account_type IN ('individual', 'enterprise'));

COMMENT ON COLUMN organizations.account_type IS 'individual = B2C single-user (Basic/Pro), enterprise = B2B multi-user';

-- 3. Add is_owner to users table (marks billing contact for enterprise orgs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN users.is_owner IS 'For enterprise orgs, marks the original creator/billing contact';

-- 4. Backfill: Detect single-user orgs and mark as individual
UPDATE organizations o
SET account_type = 'individual'
WHERE (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) = 1;

-- 5. Mark first admin of each enterprise org as owner
UPDATE users u
SET is_owner = TRUE
WHERE u.id IN (
  SELECT DISTINCT ON (u2.organization_id) u2.id
  FROM users u2
  JOIN organizations o ON o.id = u2.organization_id
  WHERE u2.role = 'admin'
    AND o.account_type = 'enterprise'
  ORDER BY u2.organization_id, u2.created_at ASC
);

-- 6. For individual accounts, mark the single user as owner
UPDATE users u
SET is_owner = TRUE
WHERE u.organization_id IN (
  SELECT id FROM organizations WHERE account_type = 'individual'
);

-- 7. Migrate old subscription tiers to new naming
-- free -> basic (since there's no free tier anymore)
-- starter -> basic
-- professional -> pro
UPDATE organizations SET subscription_tier = 'basic' WHERE subscription_tier IN ('free', 'starter');
UPDATE organizations SET subscription_tier = 'pro' WHERE subscription_tier = 'professional';

-- 8. Create indexes for efficient permission queries
CREATE INDEX IF NOT EXISTS idx_organizations_account_type ON organizations(account_type);
CREATE INDEX IF NOT EXISTS idx_users_is_owner ON users(is_owner) WHERE is_owner = TRUE;

-- 9. Create a helper function to check if user has manager+ access
CREATE OR REPLACE FUNCTION user_has_manager_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  org_account_type TEXT;
BEGIN
  SELECT u.role, o.account_type
  INTO user_role, org_account_type
  FROM users u
  JOIN organizations o ON o.id = u.organization_id
  WHERE u.id = user_id;

  -- Individual users always have full access to their own org
  IF org_account_type = 'individual' THEN
    RETURN TRUE;
  END IF;

  -- Enterprise users need manager or admin role
  RETURN user_role IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create a helper function to check if user is enterprise admin
CREATE OR REPLACE FUNCTION user_is_enterprise_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  org_account_type TEXT;
BEGIN
  SELECT u.role, o.account_type
  INTO user_role, org_account_type
  FROM users u
  JOIN organizations o ON o.id = u.organization_id
  WHERE u.id = user_id;

  -- Must be enterprise account with admin role
  RETURN org_account_type = 'enterprise' AND user_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
