-- Consolidate lo_review + branch_review + company_review → review_profile
-- Old enum values remain (Postgres can't remove them) but become unused.

ALTER TYPE widget_type ADD VALUE IF NOT EXISTS 'review_profile';

UPDATE widget_configs
SET widget_type = 'review_profile'
WHERE widget_type IN ('lo_review', 'branch_review', 'company_review');
