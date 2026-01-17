-- Migration: Industry System
-- Description: Add industry support to organizations for multi-vertical capabilities

-- Phase 1: Add industry column to organizations (non-breaking)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'mortgage';

-- Add industry_config for custom overrides
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS industry_config JSONB DEFAULT '{}';

-- Create enum-like constraint for valid industries
ALTER TABLE organizations
ADD CONSTRAINT organizations_industry_check
CHECK (industry IN (
  'mortgage',
  'real_estate',
  'insurance',
  'financial_advisory',
  'healthcare',
  'home_services',
  'legal',
  'consulting'
));

-- Create professional_credentials table for industry-specific credentials
CREATE TABLE IF NOT EXISTS professional_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES loan_officers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL,
  credential_value TEXT NOT NULL,
  verified_at TIMESTAMPTZ,
  verification_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique constraint per professional per credential type
  CONSTRAINT professional_credentials_unique UNIQUE (professional_id, credential_type)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_credentials_professional
ON professional_credentials(professional_id);

CREATE INDEX IF NOT EXISTS idx_professional_credentials_organization
ON professional_credentials(organization_id);

CREATE INDEX IF NOT EXISTS idx_organizations_industry
ON organizations(industry);

-- Enable RLS on professional_credentials
ALTER TABLE professional_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies for professional_credentials
CREATE POLICY "Users can view credentials in their organization"
ON professional_credentials
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins and managers can insert credentials"
ON professional_credentials
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update credentials"
ON professional_credentials
FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can delete credentials"
ON professional_credentials
FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Add updated_at trigger for professional_credentials
CREATE TRIGGER set_professional_credentials_updated_at
  BEFORE UPDATE ON professional_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add flexible credentials JSONB to loan_officers for industry-specific data
ALTER TABLE loan_officers
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}';

-- Add external_profiles JSONB for industry-specific profile URLs
ALTER TABLE loan_officers
ADD COLUMN IF NOT EXISTS external_profiles JSONB DEFAULT '{}';

-- Comment on new columns
COMMENT ON COLUMN organizations.industry IS 'Industry vertical for the organization (mortgage, real_estate, insurance, etc.)';
COMMENT ON COLUMN organizations.industry_config IS 'Custom industry-specific configuration overrides';
COMMENT ON COLUMN loan_officers.credentials IS 'Industry-specific credentials stored as JSONB (e.g., nmls_id, bar_number, npi)';
COMMENT ON COLUMN loan_officers.external_profiles IS 'Industry-specific external profile URLs (e.g., zillow_url, healthgrades_url)';
COMMENT ON TABLE professional_credentials IS 'Verified professional credentials with optional verification tracking';
