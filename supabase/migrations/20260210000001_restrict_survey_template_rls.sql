-- Restrict survey template write access to admins only (managers no longer manage templates)
-- Managers can still READ templates via the existing org_members_view_templates SELECT policy

DROP POLICY IF EXISTS "managers_manage_templates" ON survey_templates;

CREATE POLICY "admins_manage_templates" ON survey_templates
  FOR ALL USING (
    organization_id = get_user_organization_id() AND user_has_role(ARRAY['admin'])
  );
