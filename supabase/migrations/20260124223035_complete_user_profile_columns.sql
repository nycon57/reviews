-- Add remaining profile customization columns to users table
-- loan_officers table was already dropped, this adds columns that were missing

-- Profile customization columns (for public profile pages)
ALTER TABLE users ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS cta_button_text VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cta_button_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_testimonial_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_thumbnail_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS featured_review_ids TEXT[];

-- Public profile settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS accepts_public_reviews BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_enabled BOOLEAN DEFAULT FALSE;

-- Geo coordinates for directory/map features
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Branch name (text field, separate from branch_id FK)
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT;

-- License/NMLS ID directly on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS nmls_id VARCHAR(50);

-- Add indexes for commonly queried columns
CREATE INDEX IF NOT EXISTS idx_users_geo ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_nmls ON users(nmls_id) WHERE nmls_id IS NOT NULL;

-- Add column comments
COMMENT ON COLUMN users.banner_url IS 'Banner image URL for public profile page';
COMMENT ON COLUMN users.cta_button_text IS 'Custom CTA button text on public profile';
COMMENT ON COLUMN users.cta_button_url IS 'Custom CTA button URL on public profile';
COMMENT ON COLUMN users.video_testimonial_url IS 'Featured video testimonial URL';
COMMENT ON COLUMN users.video_thumbnail_url IS 'Thumbnail image for video testimonial';
COMMENT ON COLUMN users.featured_review_ids IS 'Array of review IDs to feature on public profile';
COMMENT ON COLUMN users.accepts_public_reviews IS 'Allow public to submit reviews via profile page';
COMMENT ON COLUMN users.referral_enabled IS 'Enable referral form on public profile';
COMMENT ON COLUMN users.latitude IS 'Geographic latitude for directory/map features';
COMMENT ON COLUMN users.longitude IS 'Geographic longitude for directory/map features';
COMMENT ON COLUMN users.branch IS 'Branch name text (may differ from branches table name)';
COMMENT ON COLUMN users.nmls_id IS 'NMLS license number or other professional license ID';
