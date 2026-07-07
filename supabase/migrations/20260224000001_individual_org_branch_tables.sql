-- Individual Organizations & Branches
-- Separate tables for self-serve (individual) users so their self-reported
-- company info is never conflated with verified enterprise data.

-- 1a. individual_organizations table (simplified — no billing/subscription/team fields)
CREATE TABLE IF NOT EXISTS individual_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  website_url TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  address JSONB,
  industry TEXT,
  onboarding_status TEXT DEFAULT 'payment_complete',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1b. individual_branches table (simplified — no manager/aggregation fields)
CREATE TABLE IF NOT EXISTS individual_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  individual_organization_id UUID NOT NULL REFERENCES individual_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address JSONB,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  region TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (individual_organization_id, slug)
);

-- 1c. Users table — add FKs
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS individual_organization_id UUID REFERENCES individual_organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS individual_branch_id UUID REFERENCES individual_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_individual_organization_id ON users(individual_organization_id);
CREATE INDEX IF NOT EXISTS idx_users_individual_branch_id ON users(individual_branch_id);

-- 1d. RLS policies

-- individual_organizations
ALTER TABLE individual_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on individual_organizations"
  ON individual_organizations FOR SELECT
  USING (true);

CREATE POLICY "Owner write access on individual_organizations"
  ON individual_organizations FOR ALL
  USING (
    id IN (SELECT individual_organization_id FROM users WHERE id = auth.uid())
  );

-- individual_branches
ALTER TABLE individual_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on individual_branches"
  ON individual_branches FOR SELECT
  USING (true);

CREATE POLICY "Owner write access on individual_branches"
  ON individual_branches FOR ALL
  USING (
    individual_organization_id IN (SELECT individual_organization_id FROM users WHERE id = auth.uid())
  );

-- 1e. Data migration — copy existing individual orgs into new table
INSERT INTO individual_organizations (id, name, slug, website_url, phone, email, logo_url, created_at, updated_at)
SELECT id, name, slug, website_url, phone, email, logo_url, created_at, updated_at
FROM organizations
WHERE account_type = 'individual'
ON CONFLICT (id) DO NOTHING;

-- Link users to individual orgs
UPDATE users
SET individual_organization_id = organization_id
WHERE organization_id IN (SELECT id FROM organizations WHERE account_type = 'individual');

-- NOTE: We intentionally keep organization_id populated for backward compat
-- (reviews table has organization_id NOT NULL FK, etc.)

-- 1f. Triggers — update_updated_at on both new tables
CREATE OR REPLACE FUNCTION update_individual_org_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_individual_organizations_updated_at
  BEFORE UPDATE ON individual_organizations
  FOR EACH ROW EXECUTE FUNCTION update_individual_org_updated_at();

CREATE TRIGGER set_individual_branches_updated_at
  BEFORE UPDATE ON individual_branches
  FOR EACH ROW EXECUTE FUNCTION update_individual_org_updated_at();
