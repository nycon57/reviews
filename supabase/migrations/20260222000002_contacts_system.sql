-- contacts table: org employee directory for EX survey targeting
-- Replaces department-based user targeting with a broader contacts system
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  branch_id UUID REFERENCES branches(id),
  title TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_user ON contacts(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_contacts_department ON contacts(organization_id, department) WHERE department IS NOT NULL;

-- RLS: org members can read/write their own org's contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_org_read" ON contacts
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "contacts_org_write" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- updated_at trigger
CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ex_survey_invitations: support contact-based invitations
ALTER TABLE ex_survey_invitations
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
  ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- Make user_id nullable for contact-only invitations
ALTER TABLE ex_survey_invitations
  ALTER COLUMN user_id DROP NOT NULL;
