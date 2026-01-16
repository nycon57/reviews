-- Onboarding Flow Schema
-- Adds onboarding status tracking to organizations and step completion table

-- Add onboarding columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  onboarding_status TEXT DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending', 'plan_selected', 'payment_complete', 'profile_complete', 'completed'));

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  selected_plan TEXT;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  selected_billing_cycle TEXT CHECK (selected_billing_cycle IN ('month', 'year'));

-- Add invited_by column to users to track who invited them (for enterprise invite flows)
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  invite_accepted_at TIMESTAMPTZ;

-- Track individual onboarding steps
CREATE TABLE IF NOT EXISTS onboarding_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, step_name)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_org ON onboarding_steps(organization_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_name ON onboarding_steps(step_name);

-- Enable RLS
ALTER TABLE onboarding_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for onboarding_steps
CREATE POLICY "users_view_own_org_onboarding_steps" ON onboarding_steps
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "admins_manage_onboarding_steps" ON onboarding_steps
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Function to get current onboarding step for redirect
CREATE OR REPLACE FUNCTION get_onboarding_redirect_step(p_organization_id UUID)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status TEXT;
  v_plan TEXT;
BEGIN
  -- Get organization onboarding status
  SELECT onboarding_status, selected_plan
  INTO v_status, v_plan
  FROM organizations
  WHERE id = p_organization_id;

  -- Return the appropriate redirect path based on status
  CASE v_status
    WHEN 'pending' THEN RETURN '/onboarding/plan';
    WHEN 'plan_selected' THEN
      -- If free plan, skip to profile
      IF v_plan = 'free' THEN
        RETURN '/onboarding/profile';
      ELSE
        RETURN '/onboarding/payment';
      END IF;
    WHEN 'payment_complete' THEN RETURN '/onboarding/profile';
    WHEN 'profile_complete' THEN RETURN '/onboarding/complete';
    WHEN 'completed' THEN RETURN '/dashboard';
    ELSE RETURN '/onboarding/plan';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to update onboarding status
CREATE OR REPLACE FUNCTION update_onboarding_status(
  p_organization_id UUID,
  p_status TEXT,
  p_plan TEXT DEFAULT NULL,
  p_billing_cycle TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE organizations
  SET
    onboarding_status = p_status,
    selected_plan = COALESCE(p_plan, selected_plan),
    selected_billing_cycle = COALESCE(p_billing_cycle, selected_billing_cycle),
    onboarding_completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE onboarding_completed_at END,
    updated_at = NOW()
  WHERE id = p_organization_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user should skip onboarding (invited users)
CREATE OR REPLACE FUNCTION should_skip_onboarding(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invited_by UUID;
  v_org_status TEXT;
  v_org_type TEXT;
BEGIN
  -- Get user's invite status and organization info
  SELECT
    u.invited_by,
    o.onboarding_status,
    COALESCE(o.settings->>'org_type', 'individual') as org_type
  INTO v_invited_by, v_org_status, v_org_type
  FROM users u
  JOIN organizations o ON o.id = u.organization_id
  WHERE u.id = p_user_id;

  -- If user was invited and org already completed onboarding, skip
  IF v_invited_by IS NOT NULL AND v_org_status = 'completed' THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE TRIGGER update_onboarding_steps_updated_at
  BEFORE UPDATE ON onboarding_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE onboarding_steps IS 'Tracks completion of individual onboarding steps per organization';
COMMENT ON COLUMN organizations.onboarding_status IS 'Current status in onboarding flow: pending, plan_selected, payment_complete, profile_complete, completed';
COMMENT ON COLUMN organizations.selected_plan IS 'Plan selected during onboarding: free, starter, professional, enterprise';
COMMENT ON COLUMN organizations.selected_billing_cycle IS 'Billing cycle selected during onboarding: month, year';
