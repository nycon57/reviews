-- Finalize Subscription Tier Names
-- Removes legacy tier names and enforces basic/pro/enterprise only

-- 1. Remove old constraint and add strict one for organizations
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;
ALTER TABLE organizations ADD CONSTRAINT organizations_subscription_tier_check
  CHECK (subscription_tier IN ('basic', 'pro', 'enterprise'));

-- 2. Update subscriptions table plan_tier constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_tier_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_tier_check
  CHECK (plan_tier IN ('basic', 'pro', 'enterprise'));

-- 3. Migrate any remaining old tier values (just in case)
UPDATE organizations SET subscription_tier = 'basic' WHERE subscription_tier IN ('free', 'starter');
UPDATE organizations SET subscription_tier = 'pro' WHERE subscription_tier = 'professional';
UPDATE subscriptions SET plan_tier = 'basic' WHERE plan_tier IN ('free', 'starter');
UPDATE subscriptions SET plan_tier = 'pro' WHERE plan_tier = 'professional';

-- 4. Create helper function to get organization subscription tier
CREATE OR REPLACE FUNCTION get_org_subscription_tier(p_org_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT subscription_tier
  FROM organizations
  WHERE id = COALESCE(p_org_id, get_user_organization_id())
$$;

-- 5. Create helper function to check if org has Pro access (pro or enterprise tier)
CREATE OR REPLACE FUNCTION org_has_pro_access(p_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT get_org_subscription_tier(p_org_id) IN ('pro', 'enterprise')
$$;

-- 6. Create helper function to check if org is enterprise account type
CREATE OR REPLACE FUNCTION org_is_enterprise_account(p_org_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT account_type = 'enterprise'
  FROM organizations
  WHERE id = COALESCE(p_org_id, get_user_organization_id())
$$;

COMMENT ON FUNCTION get_org_subscription_tier IS 'Returns the subscription tier for an organization (basic, pro, or enterprise)';
COMMENT ON FUNCTION org_has_pro_access IS 'Returns true if organization has Pro or Enterprise tier';
COMMENT ON FUNCTION org_is_enterprise_account IS 'Returns true if organization is enterprise account type (not individual)';
