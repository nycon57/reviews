-- Add slug column to users table for SEO-friendly URLs
-- Slugs are globally unique (not org-scoped) since /pro is at root path

-- Add slug column (nullable initially for backfill)
ALTER TABLE users ADD COLUMN IF NOT EXISTS slug VARCHAR(150);

-- Create unique index for slug (only on non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_slug_unique ON users(slug) WHERE slug IS NOT NULL;

-- Create index for active users with slug (for profile lookups)
CREATE INDEX IF NOT EXISTS idx_users_slug_active ON users(slug) WHERE is_active = true AND slug IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.slug IS 'SEO-friendly URL slug (e.g., john-smith). Globally unique. Used in /pro/[slug] routes.';
