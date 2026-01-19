-- Create user_credentials table for flexible credential management
-- Supports NMLS, state licenses, certifications, etc.

CREATE TABLE user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  credential_type TEXT NOT NULL,  -- 'nmls', 'state_real_estate', 'insurance', 'cpa', 'series_7', etc.
  credential_number TEXT NOT NULL,
  issuing_authority TEXT,  -- 'CA', 'FINRA', 'State Bar of California', etc.

  issued_date DATE,
  expiry_date DATE,

  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT TRUE,  -- show on public profile

  metadata JSONB DEFAULT '{}',  -- escape hatch for additional fields

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, credential_type, issuing_authority)
);

-- Indexes
CREATE INDEX idx_user_credentials_user ON user_credentials(user_id);
CREATE INDEX idx_user_credentials_org ON user_credentials(organization_id);
CREATE INDEX idx_user_credentials_type ON user_credentials(credential_type);
CREATE INDEX idx_user_credentials_expiry ON user_credentials(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_user_credentials_verified ON user_credentials(is_verified) WHERE is_verified = TRUE;

-- Enable RLS
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own credentials
CREATE POLICY "users_view_own_credentials" ON user_credentials
  FOR SELECT USING (user_id = auth.uid());

-- Users can manage their own credentials
CREATE POLICY "users_manage_own_credentials" ON user_credentials
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins and managers can view credentials in their organization
CREATE POLICY "org_admins_view_credentials" ON user_credentials
  FOR SELECT USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Admins can manage credentials in their organization
CREATE POLICY "org_admins_manage_credentials" ON user_credentials
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin'])
  );

-- Public can view public credentials for active users
CREATE POLICY "public_view_credentials" ON user_credentials
  FOR SELECT USING (
    is_public = TRUE
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = user_credentials.user_id
      AND u.is_active = TRUE
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_user_credentials_updated_at
  BEFORE UPDATE ON user_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON TABLE user_credentials IS 'Professional credentials and licenses for users';
COMMENT ON COLUMN user_credentials.credential_type IS 'Type of credential: nmls, state_real_estate, insurance, cpa, series_7, etc.';
COMMENT ON COLUMN user_credentials.credential_number IS 'License or credential number';
COMMENT ON COLUMN user_credentials.issuing_authority IS 'Authority that issued the credential (state, FINRA, etc.)';
COMMENT ON COLUMN user_credentials.is_verified IS 'Whether credential has been verified by organization';
COMMENT ON COLUMN user_credentials.is_public IS 'Whether to display on public profile';
COMMENT ON COLUMN user_credentials.metadata IS 'Additional credential-specific data';
