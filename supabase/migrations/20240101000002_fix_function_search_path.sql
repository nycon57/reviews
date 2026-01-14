-- Fix search_path security warnings for all functions
-- This sets immutable search_path to prevent search path injection attacks

-- Fix update_loan_officer_metrics function
CREATE OR REPLACE FUNCTION update_loan_officer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.loan_officers
  SET
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE loan_officer_id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id)
      AND status = 'approved'
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE loan_officer_id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id)
      AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.loan_officer_id, OLD.loan_officer_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix update_updated_at function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix get_user_organization_id function
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Fix user_has_role function
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = ANY(required_roles)
    AND is_active = TRUE
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;
