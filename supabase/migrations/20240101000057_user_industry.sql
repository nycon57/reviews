-- Add industry column to users table for industry context
-- This allows customization beyond mortgage-specific terminology

ALTER TABLE users ADD COLUMN IF NOT EXISTS industry TEXT;

-- Create index for filtering by industry
CREATE INDEX IF NOT EXISTS idx_users_industry ON users(industry);

-- Add documentation
COMMENT ON COLUMN users.industry IS 'Industry context (e.g. mortgage, real_estate, insurance, finance, other)';
