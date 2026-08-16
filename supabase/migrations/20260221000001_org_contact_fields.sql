-- Add contact and social fields to organizations table
-- These complement the existing billing_email (which is internal)

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS facebook_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS headquarters_branch_id uuid REFERENCES branches(id) ON DELETE SET NULL;

-- Migrate website_url from settings JSON where it exists
UPDATE organizations
SET website_url = (settings->>'website_url')
WHERE settings->>'website_url' IS NOT NULL
  AND website_url IS NULL;

-- Add index on headquarters_branch_id for FK lookups
CREATE INDEX IF NOT EXISTS idx_organizations_headquarters_branch_id
  ON organizations(headquarters_branch_id)
  WHERE headquarters_branch_id IS NOT NULL;

COMMENT ON COLUMN organizations.email IS 'Public-facing contact email (distinct from billing_email)';
COMMENT ON COLUMN organizations.headquarters_branch_id IS 'FK to branches table - the designated HQ/main branch';
