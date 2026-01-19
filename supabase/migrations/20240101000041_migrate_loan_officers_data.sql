-- Migrate data from loan_officers table to users table
-- This migration moves profile data and updates foreign key references

-- Step 1: Migrate loan_officers data to users (only those with user_id)
UPDATE users u SET
  phone = lo.phone,
  title = COALESCE(lo.title, 'Loan Officer'),
  bio = lo.bio,
  photo_url = lo.photo_url,
  branch_id = lo.branch_id,
  region = lo.region,
  address = lo.address,
  linkedin_url = lo.linkedin_url,
  zillow_profile_url = lo.zillow_profile_url,
  average_rating = lo.average_rating,
  total_reviews = lo.total_reviews,
  nps_score = lo.nps_score,
  reputation_score = lo.reputation_score,
  google_business_id = lo.google_business_id,
  google_place_id = lo.google_place_id,
  receive_notifications = lo.receive_notifications,
  auto_request_reviews = lo.auto_request_reviews
FROM loan_officers lo
WHERE lo.user_id = u.id;

-- Step 2: Migrate NMLS IDs to credentials
INSERT INTO user_credentials (user_id, organization_id, credential_type, credential_number, is_public)
SELECT lo.user_id, lo.organization_id, 'nmls', lo.nmls_id, true
FROM loan_officers lo
WHERE lo.user_id IS NOT NULL
  AND lo.nmls_id IS NOT NULL
  AND lo.nmls_id != ''
ON CONFLICT (user_id, credential_type, issuing_authority) DO NOTHING;

-- Step 3: Add user_id columns to tables that reference loan_officers

-- Reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
UPDATE reviews r SET user_id = lo.user_id
FROM loan_officers lo
WHERE r.loan_officer_id = lo.id AND lo.user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Surveys table
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
UPDATE surveys s SET user_id = lo.user_id
FROM loan_officers lo
WHERE s.loan_officer_id = lo.id AND lo.user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_surveys_user ON surveys(user_id);

-- Metrics snapshots table
ALTER TABLE metrics_snapshots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
UPDATE metrics_snapshots ms SET user_id = lo.user_id
FROM loan_officers lo
WHERE ms.loan_officer_id = lo.id AND lo.user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_user ON metrics_snapshots(user_id);

-- Step 4: Create or replace trigger function to update user metrics instead of loan_officer metrics
CREATE OR REPLACE FUNCTION update_user_metrics()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from the review
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  IF v_user_id IS NOT NULL THEN
    -- Update user metrics
    UPDATE users
    SET
      average_rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM reviews
        WHERE user_id = v_user_id
        AND status = 'approved'
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews
        WHERE user_id = v_user_id
        AND status = 'approved'
      ),
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user metrics update
DROP TRIGGER IF EXISTS trigger_update_user_metrics ON reviews;
CREATE TRIGGER trigger_update_user_metrics
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metrics();

-- Step 5: Update branch metrics function to use users table
CREATE OR REPLACE FUNCTION update_branch_metrics()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get the branch_id from the user
  SELECT branch_id INTO v_branch_id
  FROM users
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- If user has a branch, update branch metrics
  IF v_branch_id IS NOT NULL THEN
    UPDATE branches
    SET
      average_rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE u.branch_id = v_branch_id
        AND r.status = 'approved'
        AND u.is_active = TRUE
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews r
        JOIN users u ON r.user_id = u.id
        WHERE u.branch_id = v_branch_id
        AND r.status = 'approved'
        AND u.is_active = TRUE
      ),
      updated_at = NOW()
    WHERE id = v_branch_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update branch LO count function to use users table
CREATE OR REPLACE FUNCTION update_branch_user_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update old branch count if branch changed
  IF OLD.branch_id IS NOT NULL AND (OLD.branch_id IS DISTINCT FROM NEW.branch_id OR TG_OP = 'DELETE') THEN
    UPDATE branches
    SET
      total_loan_officers = (
        SELECT COUNT(*)
        FROM users
        WHERE branch_id = OLD.branch_id
        AND is_active = TRUE
        AND role = 'loan_officer'
      ),
      updated_at = NOW()
    WHERE id = OLD.branch_id;
  END IF;

  -- Update new branch count
  IF NEW.branch_id IS NOT NULL THEN
    UPDATE branches
    SET
      total_loan_officers = (
        SELECT COUNT(*)
        FROM users
        WHERE branch_id = NEW.branch_id
        AND is_active = TRUE
        AND role = 'loan_officer'
      ),
      updated_at = NOW()
    WHERE id = NEW.branch_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Replace trigger to use new function
DROP TRIGGER IF EXISTS trigger_update_branch_lo_count ON loan_officers;
DROP TRIGGER IF EXISTS trigger_update_branch_user_count ON users;
CREATE TRIGGER trigger_update_branch_user_count
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_user_count();

-- Step 7: Mark loan_officers table as deprecated (keep for rollback safety)
COMMENT ON TABLE loan_officers IS 'DEPRECATED: Use users table instead. Kept for migration rollback safety.';

-- Step 8: Create a view for backward compatibility during transition
CREATE OR REPLACE VIEW loan_officers_compat AS
SELECT
  u.id,
  u.organization_id,
  u.id AS user_id,
  u.full_name,
  u.email,
  u.phone,
  u.title,
  uc.credential_number AS nmls_id,
  u.bio,
  u.photo_url,
  b.name AS branch,
  u.branch_id,
  u.region,
  u.address,
  u.google_business_id,
  u.google_place_id,
  u.zillow_profile_url,
  u.linkedin_url,
  u.average_rating,
  u.total_reviews,
  u.nps_score::INTEGER,
  u.reputation_score::INTEGER,
  u.is_active,
  u.receive_notifications,
  u.auto_request_reviews,
  u.created_at,
  u.updated_at
FROM users u
LEFT JOIN user_credentials uc ON uc.user_id = u.id AND uc.credential_type = 'nmls'
LEFT JOIN branches b ON b.id = u.branch_id
WHERE u.role = 'loan_officer';

COMMENT ON VIEW loan_officers_compat IS 'Backward compatibility view mapping users table to old loan_officers schema';
