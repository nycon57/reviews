-- Organization Settings Migration
-- Creates a flexible key-value settings table for organization-level configuration
-- S070: Video Testimonial Distribution Queue & Reminders

-- ===========================================
-- ORGANIZATION SETTINGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure unique key per organization
  CONSTRAINT unique_org_setting UNIQUE (organization_id, key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_organization_settings_org ON organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_settings_key ON organization_settings(key);

-- ===========================================
-- RLS POLICIES
-- ===========================================

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Managers and admins can view settings for their organization
CREATE POLICY "managers_view_org_settings" ON organization_settings
  FOR SELECT USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Admins can manage settings for their organization
CREATE POLICY "admins_manage_org_settings" ON organization_settings
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Update timestamps trigger
CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON organization_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- COMMENTS
-- ===========================================

COMMENT ON TABLE organization_settings IS 'Flexible key-value settings for organization-level configuration';
COMMENT ON COLUMN organization_settings.key IS 'Setting identifier (e.g., video_testimonial_queue_paused)';
COMMENT ON COLUMN organization_settings.value IS 'Setting value (stored as text, can be parsed as needed)';

-- ===========================================
-- HELPER FUNCTION
-- ===========================================

-- Function to get a setting value with a default
CREATE OR REPLACE FUNCTION get_org_setting(
  p_organization_id UUID,
  p_key TEXT,
  p_default TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_value TEXT;
BEGIN
  SELECT value INTO v_value
  FROM organization_settings
  WHERE organization_id = p_organization_id
    AND key = p_key;

  RETURN COALESCE(v_value, p_default);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION get_org_setting(UUID, TEXT, TEXT) IS 'Get an organization setting value with optional default';
