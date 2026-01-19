-- Expand users table to unify user data model
-- Deprecates loan_officers table by moving all user profile data to users

-- Contact & Profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS title TEXT;  -- job title, not role
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS personal_website_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS zillow_profile_url TEXT;

-- Location fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;

-- Employment fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hire_date DATE;

-- Aggregated Metrics (moved from loan_officers)
ALTER TABLE users ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nps_score NUMERIC(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(5,2) DEFAULT 0;

-- External Integrations
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_business_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_place_id TEXT;

-- Settings
ALTER TABLE users ADD COLUMN IF NOT EXISTS receive_notifications BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_request_reviews BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_user_id);
CREATE INDEX IF NOT EXISTS idx_users_region ON users(region);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Add comments for documentation
COMMENT ON COLUMN users.phone IS 'Primary contact phone number';
COMMENT ON COLUMN users.title IS 'Job title (e.g. Loan Officer, Branch Manager)';
COMMENT ON COLUMN users.bio IS 'Professional biography for public profile';
COMMENT ON COLUMN users.photo_url IS 'Profile photo URL';
COMMENT ON COLUMN users.personal_website_url IS 'Personal or professional website';
COMMENT ON COLUMN users.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN users.zillow_profile_url IS 'Zillow lender profile URL';
COMMENT ON COLUMN users.branch_id IS 'Associated branch location';
COMMENT ON COLUMN users.region IS 'Geographic region for reporting';
COMMENT ON COLUMN users.address IS 'JSON object with street, city, state, zip, country';
COMMENT ON COLUMN users.manager_user_id IS 'Direct manager user reference';
COMMENT ON COLUMN users.hire_date IS 'Employment start date';
COMMENT ON COLUMN users.average_rating IS 'Average review rating (auto-calculated)';
COMMENT ON COLUMN users.total_reviews IS 'Total approved reviews count (auto-calculated)';
COMMENT ON COLUMN users.nps_score IS 'Net Promoter Score (auto-calculated)';
COMMENT ON COLUMN users.reputation_score IS 'Overall reputation score (auto-calculated)';
COMMENT ON COLUMN users.google_business_id IS 'Google Business Profile ID';
COMMENT ON COLUMN users.google_place_id IS 'Google Places ID for reviews sync';
COMMENT ON COLUMN users.receive_notifications IS 'Receive email/push notifications';
COMMENT ON COLUMN users.auto_request_reviews IS 'Automatically request reviews after milestones';
COMMENT ON COLUMN users.timezone IS 'User timezone for scheduling (e.g. America/Los_Angeles)';
