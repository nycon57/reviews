-- Multi-tenant Organization Support
-- Enhanced organization settings for SaaS offering

-- Add expanded branding columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#1E40AF',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS company_email TEXT,
ADD COLUMN IF NOT EXISTS company_phone TEXT,
ADD COLUMN IF NOT EXISTS company_address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY',
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_address JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{"max_users": 10, "max_loan_officers": 50, "max_surveys_per_month": 1000, "max_api_calls_per_day": 10000}',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Organization invitations table for inviting new users
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'loan_officer')),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON organization_invitations(token);

-- Enable RLS on invitations
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage invitations in their org
CREATE POLICY "admins_manage_invitations" ON organization_invitations
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- Anyone can view their own invitation (for accepting)
CREATE POLICY "users_view_own_invitation" ON organization_invitations
  FOR SELECT USING (
    email = (SELECT email FROM users WHERE id = auth.uid())
  );

-- Organization audit log for tracking important changes
CREATE TABLE IF NOT EXISTS organization_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON organization_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON organization_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON organization_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON organization_audit_logs(action);

-- Enable RLS on audit logs
ALTER TABLE organization_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "admins_view_audit_logs" ON organization_audit_logs
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- System can insert audit logs
CREATE POLICY "system_insert_audit_logs" ON organization_audit_logs
  FOR INSERT WITH CHECK (true);

-- Function to log organization changes
CREATE OR REPLACE FUNCTION log_organization_change()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO organization_audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  )
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'create'
      WHEN TG_OP = 'UPDATE' THEN 'update'
      WHEN TG_OP = 'DELETE' THEN 'delete'
    END,
    'organization',
    COALESCE(NEW.id, OLD.id)::TEXT,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for organization audit logging
DROP TRIGGER IF EXISTS trigger_log_org_changes ON organizations;
CREATE TRIGGER trigger_log_org_changes
  AFTER INSERT OR UPDATE OR DELETE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION log_organization_change();

-- Helper function to get organization statistics
CREATE OR REPLACE FUNCTION get_organization_stats(p_organization_id UUID)
RETURNS TABLE (
  total_users BIGINT,
  total_loan_officers BIGINT,
  total_reviews BIGINT,
  total_surveys BIGINT,
  active_surveys BIGINT,
  pending_reviews BIGINT
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM users WHERE organization_id = p_organization_id AND is_active = TRUE)::BIGINT,
    (SELECT COUNT(*) FROM loan_officers WHERE organization_id = p_organization_id AND is_active = TRUE)::BIGINT,
    (SELECT COUNT(*) FROM reviews WHERE organization_id = p_organization_id)::BIGINT,
    (SELECT COUNT(*) FROM surveys WHERE organization_id = p_organization_id)::BIGINT,
    (SELECT COUNT(*) FROM surveys WHERE organization_id = p_organization_id AND status IN ('pending', 'sent'))::BIGINT,
    (SELECT COUNT(*) FROM reviews WHERE organization_id = p_organization_id AND status = 'pending')::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- Add subscription tiers as a comment for reference
COMMENT ON COLUMN organizations.subscription_tier IS 'Subscription tier: free, starter, professional, enterprise';
COMMENT ON COLUMN organizations.subscription_status IS 'Subscription status: active, trialing, past_due, cancelled, paused';
COMMENT ON COLUMN organizations.features IS 'Feature flags enabled for this organization';
COMMENT ON COLUMN organizations.limits IS 'Usage limits based on subscription tier';
