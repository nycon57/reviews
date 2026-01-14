-- Branches table for public branch profiles
-- Stores branch locations with aggregated data from loan officers

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  address JSONB DEFAULT '{}',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  hours_of_operation JSONB DEFAULT '{}',
  manager_name TEXT,
  manager_email TEXT,
  google_place_id TEXT,
  google_maps_url TEXT,
  photo_url TEXT,
  cover_image_url TEXT,
  region TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  average_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_loan_officers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, slug)
);

-- Indexes for branches
CREATE INDEX IF NOT EXISTS idx_branches_organization ON branches(organization_id);
CREATE INDEX IF NOT EXISTS idx_branches_slug ON branches(slug);
CREATE INDEX IF NOT EXISTS idx_branches_region ON branches(region);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_branches_is_public ON branches(is_public) WHERE is_public = TRUE;

-- Add branch_id column to loan_officers to link to proper branch records
ALTER TABLE loan_officers
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_loan_officers_branch_id ON loan_officers(branch_id);

-- Enable Row Level Security
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for branches
-- Public can view active public branches
CREATE POLICY "public_view_active_branches" ON branches
  FOR SELECT USING (is_active = TRUE AND is_public = TRUE);

-- Authenticated users can view all branches in their organization
CREATE POLICY "org_users_view_branches" ON branches
  FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

-- Admins and managers can manage branches in their organization
CREATE POLICY "admins_manage_branches" ON branches
  FOR ALL USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

-- Function to update branch metrics when reviews change
CREATE OR REPLACE FUNCTION update_branch_metrics()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_branch_id UUID;
BEGIN
  -- Get the branch_id from the loan officer
  SELECT branch_id INTO v_branch_id
  FROM loan_officers
  WHERE id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id);

  -- If loan officer has a branch, update branch metrics
  IF v_branch_id IS NOT NULL THEN
    UPDATE branches
    SET
      average_rating = (
        SELECT COALESCE(AVG(r.rating), 0)
        FROM reviews r
        JOIN loan_officers lo ON r.loan_officer_id = lo.id
        WHERE lo.branch_id = v_branch_id
        AND r.status = 'approved'
        AND lo.is_active = TRUE
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM reviews r
        JOIN loan_officers lo ON r.loan_officer_id = lo.id
        WHERE lo.branch_id = v_branch_id
        AND r.status = 'approved'
        AND lo.is_active = TRUE
      ),
      updated_at = NOW()
    WHERE id = v_branch_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update branch metrics when reviews change
CREATE TRIGGER trigger_update_branch_metrics
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_metrics();

-- Function to update branch loan officer count
CREATE OR REPLACE FUNCTION update_branch_lo_count()
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
        FROM loan_officers
        WHERE branch_id = OLD.branch_id
        AND is_active = TRUE
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
        FROM loan_officers
        WHERE branch_id = NEW.branch_id
        AND is_active = TRUE
      ),
      updated_at = NOW()
    WHERE id = NEW.branch_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update branch LO count when loan officers change
CREATE TRIGGER trigger_update_branch_lo_count
  AFTER INSERT OR UPDATE OR DELETE ON loan_officers
  FOR EACH ROW
  EXECUTE FUNCTION update_branch_lo_count();

-- Apply updated_at trigger to branches
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comment for documentation
COMMENT ON TABLE branches IS 'Branch locations for organizations with aggregated review metrics';
COMMENT ON COLUMN branches.slug IS 'URL-friendly identifier unique within organization';
COMMENT ON COLUMN branches.hours_of_operation IS 'JSON object with day keys and open/close times';
COMMENT ON COLUMN branches.address IS 'JSON object with street, city, state, zip, country fields';
