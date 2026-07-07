-- Remove Action Plans feature from EX Surveys
-- This feature is being removed as organizations use external tools for follow-up actions

-- Drop triggers first
DROP TRIGGER IF EXISTS update_ex_action_plans_updated_at ON ex_action_plans;

-- Drop RLS policies
DROP POLICY IF EXISTS org_users_view_action_plans ON ex_action_plans;
DROP POLICY IF EXISTS admins_managers_manage_action_plans ON ex_action_plans;

-- Drop indexes
DROP INDEX IF EXISTS idx_ex_action_plans_organization;
DROP INDEX IF EXISTS idx_ex_action_plans_survey;
DROP INDEX IF EXISTS idx_ex_action_plans_department;
DROP INDEX IF EXISTS idx_ex_action_plans_status;
DROP INDEX IF EXISTS idx_ex_action_plans_owner;

-- Drop table
DROP TABLE IF EXISTS ex_action_plans;
