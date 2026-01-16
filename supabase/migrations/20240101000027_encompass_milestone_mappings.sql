-- Encompass Milestone Survey Mappings Migration
-- Adds tables for mapping Encompass loan milestones to survey templates

-- Milestone Survey Mappings table
-- Stores configuration for triggering surveys based on Encompass milestones
CREATE TABLE milestone_survey_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  template_id UUID REFERENCES survey_templates(id) ON DELETE SET NULL,
  delay_hours INTEGER DEFAULT 24 CHECK (delay_hours >= 0 AND delay_hours <= 168),
  is_active BOOLEAN DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, milestone_name)
);

CREATE INDEX idx_milestone_mappings_org ON milestone_survey_mappings(organization_id);
CREATE INDEX idx_milestone_mappings_active ON milestone_survey_mappings(organization_id, is_active) WHERE is_active = TRUE;

-- Add trigger for updated_at
CREATE TRIGGER update_milestone_mappings_updated_at
  BEFORE UPDATE ON milestone_survey_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable RLS
ALTER TABLE milestone_survey_mappings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's milestone mappings"
  ON milestone_survey_mappings FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins can manage milestone mappings"
  ON milestone_survey_mappings FOR ALL
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Insert default milestone mappings for existing organizations
-- These are the most common Encompass milestones
INSERT INTO milestone_survey_mappings (organization_id, milestone_name, delay_hours, is_active, description)
SELECT
  o.id as organization_id,
  m.milestone_name,
  m.delay_hours,
  m.is_active,
  m.description
FROM organizations o
CROSS JOIN (
  VALUES
    ('Funded', 24, TRUE, 'Loan has been funded - primary trigger for NPS surveys'),
    ('Clear to Close', 0, FALSE, 'Loan is cleared for closing - optional pre-close survey'),
    ('Loan Submitted', 48, FALSE, 'Application submitted for processing'),
    ('Underwriting Approved', 0, FALSE, 'Loan approved by underwriting'),
    ('Closing Scheduled', 0, FALSE, 'Closing date has been scheduled')
) AS m(milestone_name, delay_hours, is_active, description)
ON CONFLICT (organization_id, milestone_name) DO NOTHING;

-- Add column to webhook_configs for Encompass-specific settings
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS integration_type TEXT DEFAULT 'generic';
ALTER TABLE webhook_configs ADD COLUMN IF NOT EXISTS integration_settings JSONB DEFAULT '{}';

-- Create index for integration_type
CREATE INDEX IF NOT EXISTS idx_webhook_configs_integration ON webhook_configs(organization_id, integration_type);

COMMENT ON TABLE milestone_survey_mappings IS 'Maps Encompass loan milestones to survey templates for automated survey triggering';
COMMENT ON COLUMN milestone_survey_mappings.milestone_name IS 'Encompass milestone name (e.g., Funded, Clear to Close)';
COMMENT ON COLUMN milestone_survey_mappings.delay_hours IS 'Hours to wait after milestone before sending survey (0-168)';
COMMENT ON COLUMN webhook_configs.integration_type IS 'Type of integration: generic, encompass, salesforce, etc.';
COMMENT ON COLUMN webhook_configs.integration_settings IS 'Integration-specific configuration settings';
