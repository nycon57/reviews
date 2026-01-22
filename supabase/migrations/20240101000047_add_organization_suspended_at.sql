-- Add suspended_at column to organizations table
-- Required for the dunning sequence to track when accounts are suspended

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- Create index for querying suspended organizations
CREATE INDEX IF NOT EXISTS idx_organizations_suspended ON organizations(suspended_at)
WHERE suspended_at IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN organizations.suspended_at IS 'Timestamp when the organization account was suspended due to failed payments. NULL if not suspended.';
