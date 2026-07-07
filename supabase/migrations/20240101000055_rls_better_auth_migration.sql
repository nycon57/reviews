-- =============================================================================
-- RLS Migration to Better Auth
-- Replaces all auth.uid() (Supabase Auth) with get_current_user_id() (Better Auth)
-- Only includes tables that currently exist in the database
-- =============================================================================

-- =============================================================================
-- 1. UPDATE CORE HELPER FUNCTIONS
-- =============================================================================

-- Update get_user_organization_id to use Better Auth session
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.users WHERE id = get_current_user_id()
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Update user_has_role to use Better Auth session
CREATE OR REPLACE FUNCTION user_has_role(required_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = get_current_user_id()
    AND role = ANY(required_roles)
    AND is_active = TRUE
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- =============================================================================
-- 2. BETTER AUTH TABLES (sessions, accounts, members, invitations)
-- =============================================================================

-- Sessions
DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
DROP POLICY IF EXISTS "sessions_insert_own" ON sessions;
DROP POLICY IF EXISTS "sessions_delete_own" ON sessions;

CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (user_id = get_current_user_id());

CREATE POLICY "sessions_delete_own" ON sessions
  FOR DELETE USING (user_id = get_current_user_id());

-- Accounts
DROP POLICY IF EXISTS "accounts_select_own" ON accounts;
CREATE POLICY "accounts_select_own" ON accounts
  FOR SELECT USING (user_id = get_current_user_id());

-- Members
DROP POLICY IF EXISTS "members_select_org" ON members;
CREATE POLICY "members_select_org" ON members
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- Invitations
DROP POLICY IF EXISTS "invitations_select_org" ON invitations;
CREATE POLICY "invitations_select_org" ON invitations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- 3. USERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "users_update_own_profile" ON users;
CREATE POLICY "users_update_own_profile" ON users
  FOR UPDATE USING (id = get_current_user_id());

-- =============================================================================
-- 4. LOAN_OFFICERS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "loan_officers_update_own" ON loan_officers;
CREATE POLICY "loan_officers_update_own" ON loan_officers
  FOR UPDATE USING (user_id = get_current_user_id());

-- =============================================================================
-- 5. SURVEYS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "loan_officers_view_own_surveys" ON surveys;
CREATE POLICY "loan_officers_view_own_surveys" ON surveys
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

-- =============================================================================
-- 6. REVIEWS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "loan_officers_view_own_reviews" ON reviews;
CREATE POLICY "loan_officers_view_own_reviews" ON reviews
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

-- =============================================================================
-- 7. METRICS_SNAPSHOTS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "loan_officers_view_own_metrics" ON metrics_snapshots;
CREATE POLICY "loan_officers_view_own_metrics" ON metrics_snapshots
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

-- =============================================================================
-- 8. GAMIFICATION TABLES (badges, user_badges, leaderboard_snapshots, etc.)
-- =============================================================================

-- badges_select_org
DROP POLICY IF EXISTS "badges_select_org" ON badges;
CREATE POLICY "badges_select_org" ON badges
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- badges_manage_admin
DROP POLICY IF EXISTS "badges_manage_admin" ON badges;
CREATE POLICY "badges_manage_admin" ON badges
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
        AND role = 'admin'
        AND organization_id = badges.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
        AND role = 'admin'
        AND organization_id = badges.organization_id
    )
  );

-- user_badges_select_own
DROP POLICY IF EXISTS "user_badges_select_own" ON user_badges;
CREATE POLICY "user_badges_select_own" ON user_badges
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.id = lo.user_id
      WHERE u.id = get_current_user_id()
    )
  );

-- user_badges_select_org
DROP POLICY IF EXISTS "user_badges_select_org" ON user_badges;
CREATE POLICY "user_badges_select_org" ON user_badges
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = get_current_user_id()
        AND u.role IN ('admin', 'manager')
    )
  );

-- user_badges_insert
DROP POLICY IF EXISTS "user_badges_insert" ON user_badges;
CREATE POLICY "user_badges_insert" ON user_badges
  FOR INSERT TO authenticated
  WITH CHECK (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = get_current_user_id()
    )
  );

-- user_badges_update
DROP POLICY IF EXISTS "user_badges_update" ON user_badges;
CREATE POLICY "user_badges_update" ON user_badges
  FOR UPDATE TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = get_current_user_id()
    )
  );

-- leaderboard_snapshots_select
DROP POLICY IF EXISTS "leaderboard_snapshots_select" ON leaderboard_snapshots;
CREATE POLICY "leaderboard_snapshots_select" ON leaderboard_snapshots
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- leaderboard_snapshots_insert
DROP POLICY IF EXISTS "leaderboard_snapshots_insert" ON leaderboard_snapshots;
CREATE POLICY "leaderboard_snapshots_insert" ON leaderboard_snapshots
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- reputation_history_select_own
DROP POLICY IF EXISTS "reputation_history_select_own" ON reputation_history;
CREATE POLICY "reputation_history_select_own" ON reputation_history
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.id = lo.user_id
      WHERE u.id = get_current_user_id()
    )
  );

-- reputation_history_select_org
DROP POLICY IF EXISTS "reputation_history_select_org" ON reputation_history;
CREATE POLICY "reputation_history_select_org" ON reputation_history
  FOR SELECT TO authenticated
  USING (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = get_current_user_id()
        AND u.role IN ('admin', 'manager')
    )
  );

-- reputation_history_insert
DROP POLICY IF EXISTS "reputation_history_insert" ON reputation_history;
CREATE POLICY "reputation_history_insert" ON reputation_history
  FOR INSERT TO authenticated
  WITH CHECK (
    loan_officer_id IN (
      SELECT lo.id FROM loan_officers lo
      JOIN users u ON u.organization_id = lo.organization_id
      WHERE u.id = get_current_user_id()
    )
  );

-- gamification_settings_select
DROP POLICY IF EXISTS "gamification_settings_select" ON gamification_settings;
CREATE POLICY "gamification_settings_select" ON gamification_settings
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- gamification_settings_manage
DROP POLICY IF EXISTS "gamification_settings_manage" ON gamification_settings;
CREATE POLICY "gamification_settings_manage" ON gamification_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
        AND role = 'admin'
        AND organization_id = gamification_settings.organization_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
        AND role = 'admin'
        AND organization_id = gamification_settings.organization_id
    )
  );

-- =============================================================================
-- 9. REPORTING TABLES
-- =============================================================================

-- report_templates
DROP POLICY IF EXISTS "Users can view templates in their org" ON report_templates;
CREATE POLICY "Users can view templates in their org" ON report_templates
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id()));

DROP POLICY IF EXISTS "Managers can create templates" ON report_templates;
CREATE POLICY "Managers can create templates" ON report_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
      AND role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "Managers can update templates" ON report_templates;
CREATE POLICY "Managers can update templates" ON report_templates
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
      AND role IN ('manager', 'admin')
    )
  );

DROP POLICY IF EXISTS "Managers can delete templates" ON report_templates;
CREATE POLICY "Managers can delete templates" ON report_templates
  FOR DELETE TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
      AND role IN ('manager', 'admin')
    )
  );

-- scheduled_reports
DROP POLICY IF EXISTS "Users can view scheduled reports in their org" ON scheduled_reports;
CREATE POLICY "Users can view scheduled reports in their org" ON scheduled_reports
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id()));

DROP POLICY IF EXISTS "Managers can manage scheduled reports" ON scheduled_reports;
CREATE POLICY "Managers can manage scheduled reports" ON scheduled_reports
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
      AND role IN ('manager', 'admin')
    )
  );

-- report_shares
DROP POLICY IF EXISTS "Users can view shares in their org" ON report_shares;
CREATE POLICY "Users can view shares in their org" ON report_shares
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id()));

DROP POLICY IF EXISTS "Managers can manage shares" ON report_shares;
CREATE POLICY "Managers can manage shares" ON report_shares
  FOR ALL TO authenticated
  USING (
    organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id())
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
      AND role IN ('manager', 'admin')
    )
  );

-- report_exports
DROP POLICY IF EXISTS "Users can view exports in their org" ON report_exports;
CREATE POLICY "Users can view exports in their org" ON report_exports
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id()));

DROP POLICY IF EXISTS "Users can create exports" ON report_exports;
CREATE POLICY "Users can create exports" ON report_exports
  FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = get_current_user_id()));

-- =============================================================================
-- 10. NOTIFICATIONS TABLES
-- =============================================================================

-- notifications
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = get_current_user_id() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = get_current_user_id()
        AND organization_id = notifications.organization_id
    )
  );

-- notification_preferences
DROP POLICY IF EXISTS "notification_preferences_select_own" ON notification_preferences;
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
  FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_insert_own" ON notification_preferences;
CREATE POLICY "notification_preferences_insert_own" ON notification_preferences
  FOR INSERT TO authenticated
  WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_update_own" ON notification_preferences;
CREATE POLICY "notification_preferences_update_own" ON notification_preferences
  FOR UPDATE TO authenticated
  USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

DROP POLICY IF EXISTS "notification_preferences_delete_own" ON notification_preferences;
CREATE POLICY "notification_preferences_delete_own" ON notification_preferences
  FOR DELETE TO authenticated
  USING (user_id = get_current_user_id());

-- notification_digest_queue
DROP POLICY IF EXISTS "digest_queue_select_own" ON notification_digest_queue;
CREATE POLICY "digest_queue_select_own" ON notification_digest_queue
  FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

-- slack_webhook_logs
DROP POLICY IF EXISTS "slack_webhook_logs_select_own" ON slack_webhook_logs;
CREATE POLICY "slack_webhook_logs_select_own" ON slack_webhook_logs
  FOR SELECT TO authenticated
  USING (user_id = get_current_user_id());

-- =============================================================================
-- 11. TESTIMONIALS TABLES
-- =============================================================================

DROP POLICY IF EXISTS "testimonials_org_isolation" ON testimonials;
CREATE POLICY "testimonials_org_isolation" ON testimonials
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "testimonials_insert" ON testimonials;
CREATE POLICY "testimonials_insert" ON testimonials
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "testimonial_graphics_org_isolation" ON testimonial_graphics;
CREATE POLICY "testimonial_graphics_org_isolation" ON testimonial_graphics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "testimonial_graphics_insert" ON testimonial_graphics;
CREATE POLICY "testimonial_graphics_insert" ON testimonial_graphics
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "testimonial_templates_read" ON testimonial_templates;
CREATE POLICY "testimonial_templates_read" ON testimonial_templates
  FOR SELECT USING (
    is_system = TRUE
    OR organization_id IS NULL
    OR organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "testimonial_templates_write" ON testimonial_templates;
CREATE POLICY "testimonial_templates_write" ON testimonial_templates
  FOR ALL USING (
    is_system = FALSE
    AND organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

-- =============================================================================
-- 12. VIDEO TESTIMONIALS TABLES
-- =============================================================================

-- video_testimonial_requests
DROP POLICY IF EXISTS "loan_officers_view_own_video_requests" ON video_testimonial_requests;
CREATE POLICY "loan_officers_view_own_video_requests" ON video_testimonial_requests
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "loan_officers_create_video_requests" ON video_testimonial_requests;
CREATE POLICY "loan_officers_create_video_requests" ON video_testimonial_requests
  FOR INSERT WITH CHECK (
    organization_id = get_user_organization_id() AND
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

-- video_testimonial_responses
DROP POLICY IF EXISTS "loan_officers_view_own_video_responses" ON video_testimonial_responses;
CREATE POLICY "loan_officers_view_own_video_responses" ON video_testimonial_responses
  FOR SELECT USING (
    loan_officer_id IN (
      SELECT id FROM loan_officers WHERE user_id = get_current_user_id()
    )
  );

-- =============================================================================
-- 13. USER CREDENTIALS TABLE
-- =============================================================================

DROP POLICY IF EXISTS "users_view_own_credentials" ON user_credentials;
CREATE POLICY "users_view_own_credentials" ON user_credentials
  FOR SELECT USING (user_id = get_current_user_id());

DROP POLICY IF EXISTS "users_manage_own_credentials" ON user_credentials;
CREATE POLICY "users_manage_own_credentials" ON user_credentials
  FOR ALL USING (user_id = get_current_user_id())
  WITH CHECK (user_id = get_current_user_id());

-- =============================================================================
-- 14. GROUPS TABLES
-- =============================================================================

-- user_groups - view own
DROP POLICY IF EXISTS "users_view_own_memberships" ON user_groups;
CREATE POLICY "users_view_own_memberships" ON user_groups
  FOR SELECT USING (user_id = get_current_user_id());

-- user_groups - view group memberships
DROP POLICY IF EXISTS "users_view_group_memberships" ON user_groups;
CREATE POLICY "users_view_group_memberships" ON user_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_groups ug
      WHERE ug.user_id = get_current_user_id()
      AND ug.group_id = user_groups.group_id
    )
  );

-- user_groups - group leads manage
DROP POLICY IF EXISTS "group_leads_manage_memberships" ON user_groups;
CREATE POLICY "group_leads_manage_memberships" ON user_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_groups ug
      WHERE ug.user_id = get_current_user_id()
      AND ug.group_id = user_groups.group_id
      AND ug.role = 'lead'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_groups ug
      JOIN groups g ON g.id = ug.group_id
      JOIN users u ON u.organization_id = g.organization_id
      WHERE ug.user_id = get_current_user_id()
      AND ug.group_id = user_groups.group_id
      AND ug.role = 'lead'
      AND u.id = user_groups.user_id
    )
  );

-- =============================================================================
-- 15. GENERATED VIDEOS TABLE (uses members table)
-- =============================================================================

DROP POLICY IF EXISTS "Users can view organization videos" ON generated_videos;
CREATE POLICY "Users can view organization videos" ON generated_videos
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = get_current_user_id()
    )
  );

DROP POLICY IF EXISTS "Admins and managers can create videos" ON generated_videos;
CREATE POLICY "Admins and managers can create videos" ON generated_videos
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id()
        AND role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admins can delete videos" ON generated_videos;
CREATE POLICY "Admins can delete videos" ON generated_videos
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM users
      WHERE id = get_current_user_id()
        AND role = 'admin'
    )
  );

-- =============================================================================
-- 16. STORAGE BUCKETS (avatars, logos, video-testimonials)
-- =============================================================================

-- Avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_user_id()::text
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_user_id()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_user_id()::text
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = get_current_user_id()::text
  );

-- Logos
DROP POLICY IF EXISTS "Org admins can upload logos" ON storage.objects;
CREATE POLICY "Org admins can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org admins can update logos" ON storage.objects;
CREATE POLICY "Org admins can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Org admins can delete logos" ON storage.objects;
CREATE POLICY "Org admins can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
      AND u.role = 'admin'
    )
  );

-- Video Testimonials storage
DROP POLICY IF EXISTS "Org members can upload video testimonials" ON storage.objects;
CREATE POLICY "Org members can upload video testimonials" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'video-testimonials' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Org members can read video testimonials" ON storage.objects;
CREATE POLICY "Org members can read video testimonials" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'video-testimonials' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Org members can update video testimonials" ON storage.objects;
CREATE POLICY "Org members can update video testimonials" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'video-testimonials' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'video-testimonials' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Org members can delete video testimonials" ON storage.objects;
CREATE POLICY "Org members can delete video testimonials" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'video-testimonials' AND
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = get_current_user_id()
      AND u.organization_id::text = (storage.foldername(name))[1]
    )
  );

-- =============================================================================
-- 17. SERVICE ROLE GRANTS
-- =============================================================================

GRANT ALL ON sessions TO service_role;
GRANT ALL ON accounts TO service_role;
GRANT ALL ON verifications TO service_role;
GRANT ALL ON members TO service_role;
GRANT ALL ON invitations TO service_role;

-- =============================================================================
-- 18. DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION get_user_organization_id() IS 'Returns organization_id for current Better Auth session user';
COMMENT ON FUNCTION user_has_role(TEXT[]) IS 'Checks if current Better Auth session user has any of the required roles';
COMMENT ON FUNCTION get_current_user_id() IS 'Returns user_id from Better Auth session token (set via app.session_token)';
