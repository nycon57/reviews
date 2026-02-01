-- S132 Pass 2: Fix widget RLS policies to use codebase helper functions
-- Replaces inline subqueries with get_user_organization_id() and user_has_role()
-- for consistency and better performance (SECURITY DEFINER + STABLE caching).

------------------------------------------------------------------------
-- widget_configs: Replace policies
------------------------------------------------------------------------

DROP POLICY IF EXISTS "Org members can view their widgets" ON widget_configs;
DROP POLICY IF EXISTS "Admins and managers can manage widgets" ON widget_configs;

CREATE POLICY "Org members can view their widgets"
  ON widget_configs FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage widgets"
  ON widget_configs FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );

------------------------------------------------------------------------
-- widget_events: Replace SELECT policy
------------------------------------------------------------------------

DROP POLICY IF EXISTS "Org members can read widget events" ON widget_events;

CREATE POLICY "Org members can read widget events"
  ON widget_events FOR SELECT TO authenticated
  USING (
    widget_id IN (
      SELECT wc.widget_id FROM widget_configs wc
      WHERE wc.organization_id = get_user_organization_id()
    )
  );

------------------------------------------------------------------------
-- social_proof_graphics: Replace policies
------------------------------------------------------------------------

DROP POLICY IF EXISTS "Org members can view their graphics" ON social_proof_graphics;
DROP POLICY IF EXISTS "Admins and managers can manage graphics" ON social_proof_graphics;

CREATE POLICY "Org members can view their graphics"
  ON social_proof_graphics FOR SELECT TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Admins and managers can manage graphics"
  ON social_proof_graphics FOR ALL TO authenticated
  USING (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  )
  WITH CHECK (
    organization_id = get_user_organization_id()
    AND user_has_role(ARRAY['admin', 'manager'])
  );
