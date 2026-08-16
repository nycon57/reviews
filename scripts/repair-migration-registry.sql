-- scripts/repair-migration-registry.sql
-- Purpose: register migration versions that are ALREADY applied to production so that
--          `supabase db push` stops trying to re-run them. Generated 2026-07-07 by the
--          schema-drift verification pass (read-only marker verification against prod).
-- Method:  each local migration under supabase/migrations was parsed for schema markers
--          (tables, columns, indexes, functions, triggers, policies, enum values,
--          constraints) and every marker was checked against the live catalog.
--          FULLY_APPLIED = every marker present. Only those are registered here.
-- Safety:  ON CONFLICT (version) DO NOTHING — safe to re-run; never overwrites a row.
--          Registering a version does NOT change the schema; it only records that the
--          migration is applied. Review Sections B-D before running anything in them.
-- See scripts/drift-report.md for the full classification and evidence.

BEGIN;

-- =========================================================================
-- SECTION A — VERIFIED FULLY_APPLIED  (ACTIVE: run as-is)
-- 51 versions, every schema marker confirmed present in production.
-- Excludes 3 mixed version-collision versions (see Section B).
-- =========================================================================
INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES
  ('20240101000003', 'email_unsubscribes'),
  ('20240101000004', 'survey_distribution'),
  ('20240101000006', 'reporting'),
  ('20240101000016', 'employee_recognition'),
  ('20240101000026', 'user_account_types'),
  ('20240101000027', 'encompass_milestone_mappings'),
  ('20240101000028', 'api_keys_enhancements'),
  ('20240101000029', 'storage_buckets'),
  ('20240101000031', 'teams_integration'),
  ('20240101000035', 'video_approval_workflow'),
  ('20240101000038', 'expand_users_table'),
  ('20240101000039', 'user_credentials'),
  ('20240101000040', 'groups'),
  ('20240101000057', 'user_industry'),
  ('20240101000059', 'rename_loan_officer_role_to_user'),
  ('20260124223035', 'complete_user_profile_columns'),
  ('20260125000001', 'add_user_slugs'),
  ('20260125000003', 'add_branch_coordinates'),
  ('20260131000001', 'sms_channel_schema'),
  ('20260131000005', 'add_sms_compliance_columns'),
  ('20260201000004', 'widget_tables'),
  ('20260201000005', 'widget_rls_fixes'),
  ('20260207000001', 'add_branch_manager_id'),
  ('20260207000002', 'branch_global_slugs'),
  ('20260209000001', 'auto_reply_queue'),
  ('20260216000001', 'share_studio_schema'),
  ('20260217000001', 'add_social_urls_to_users'),
  ('20260220000001', 'review_flags'),
  ('20260221000001', 'org_contact_fields'),
  ('20260222000004', 'add_social_urls_to_branches'),
  ('20260223000001', 'fuzzy_search_radius'),
  ('20260224000001', 'individual_org_branch_tables'),
  ('20260225000001', 'campaign_workflows'),
  ('20260225000002', 'word_level_timestamps'),
  ('20260225000003', 'add_admin_plugin_columns'),
  ('20260226000001', 'share_studio_slug_canonical'),
  ('20260226000002', 'proof_link_events_retention'),
  ('20260228000002', 'campaign_lock_rpc_functions'),
  ('20260301000001', 'add_impersonation_session_index'),
  ('20260301000002', 'ensure_organization_audit_logs'),
  ('20260301000003', 'video_testimonial_request_status_enums'),
  ('20260301000004', 'video_testimonial_hardening'),
  ('20260303000001', 'add_video_testimonial_user_id_fkeys'),  -- (+ also rename_contacts_to_employees — same version, both applied)
  ('20260303000002', 'add_org_avatar_banner_urls'),
  ('20260314000001', 'email_builder_templates'),
  ('20260315000002', 'unify_subscription_tiers'),
  ('20260315000003', 'add_grace_period_column'),
  ('20260609000001', 'video_rating_and_recapture'),
  ('20260609000002', 'reviews_video_testimonial_source'),
  ('20260610000001', 'clip_music_tracks'),
  ('20260610000002', 'review_publish_inversion')
ON CONFLICT (version) DO NOTHING;

-- =========================================================================
-- SECTION B — VERSION-STRING COLLISIONS  (DO NOT REGISTER — repo fix required)
-- Two local migration files share ONE version string. Supabase keys migrations by
-- version, so registering the version would permanently hide the un-applied sibling
-- from `db push`. Rename one file in each pair to a unique version, THEN decide.
-- =========================================================================
-- 20240101000015 — MIXED STATUS — EXCLUDED from Section A
--     20240101000015_employee_experience.sql  =>  FULLY_APPLIED
--     20240101000015_geo_platform.sql  =>  PARTIALLY_APPLIED
-- 20240101000030 — MIXED STATUS — EXCLUDED from Section A
--     20240101000030_drop_listings_feature.sql  =>  PARTIALLY_APPLIED
--     20240101000030_review_response_email.sql  =>  FULLY_APPLIED
-- 20260222000003 — MIXED STATUS — EXCLUDED from Section A
--     20260222000003_add_organization_description.sql  =>  FULLY_APPLIED
--     20260222000003_deprecate_departments.sql  =>  NOT_APPLIED
-- 20260303000001 — both FULLY (registered once in Section A)
--     20260303000001_add_video_testimonial_user_id_fkeys.sql  =>  FULLY_APPLIED
--     20260303000001_rename_contacts_to_employees.sql  =>  FULLY_APPLIED

-- =========================================================================
-- SECTION C — APPLIED-THEN-SUPERSEDED  (RECOMMEND REGISTER — uncomment to apply)
-- These migrations WERE applied (majority of markers present); every missing object
-- was later removed — either by a later local migration, or by the prod-only
-- loan_officers->users refactor (loan_officers was dropped in prod with no local
-- migration). Re-running them would RECREATE dropped objects, so they must be
-- REGISTERED, not applied. PM: confirm, then uncomment.
-- =========================================================================
-- 20240101000000_initial_schema.sql  (10 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000000', 'initial_schema') ON CONFLICT (version) DO NOTHING;
-- 20240101000002_fix_function_search_path.sql  (1 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000002', 'fix_function_search_path') ON CONFLICT (version) DO NOTHING;
-- 20240101000007_google_integration.sql  (1 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000007', 'google_integration') ON CONFLICT (version) DO NOTHING;
-- 20240101000010_testimonials.sql  (1 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000010', 'testimonials') ON CONFLICT (version) DO NOTHING;
-- 20240101000012_branches.sql  (1 obj superseded by later local migration; 2 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000012', 'branches') ON CONFLICT (version) DO NOTHING;
-- 20240101000014_business_listings.sql  (45 obj superseded by later local migration)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000014', 'business_listings') ON CONFLICT (version) DO NOTHING;
-- 20240101000041_migrate_loan_officers_data.sql  (1 obj removed by prod-only loan_officers->users refactor)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000041', 'migrate_loan_officers_data') ON CONFLICT (version) DO NOTHING;
-- 20240101000053_better_auth_schema.sql  (1 obj superseded by later local migration)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20240101000053', 'better_auth_schema') ON CONFLICT (version) DO NOTHING;
-- 20260222000002_contacts_system.sql  (8 obj superseded by later local migration)
-- INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('20260222000002', 'contacts_system') ON CONFLICT (version) DO NOTHING;

-- =========================================================================
-- SECTION D — PARTIALLY_APPLIED WITH REAL GAPS  (PM DECISION — do NOT register)
-- Prod is missing objects that NO later migration removes. Registering would mask a
-- real gap. Decide per file: backfill the missing objects in a NEW migration, or
-- (if the gap is acceptable) register anyway. Exact DDL: see the source file.
-- =========================================================================
-- 20240101000001_rls_policies.sql  — 2 object(s) missing from prod:
--     [ ] function public.get_user_role()
--     [ ] function public.get_user_is_active()
-- 20240101000005_gamification.sql  — 8 object(s) missing from prod:
--     [ ] index idx_leaderboard_snapshots_date on leaderboard_snapshots
--     [ ] index idx_gamification_settings_org on gamification_settings
--     [ ] function public.calculate_and_update_reputation()
--     [ ] function public.trigger_gamification_update()
--     [ ] trigger trigger_gamification_on_review on reviews
--     [ ] trigger trigger_gamification_on_survey_response on survey_responses
--     [ ] trigger update_badges_updated_at on badges
--     [ ] trigger update_gamification_settings_updated_at on gamification_settings
-- 20240101000008_response_management.sql  — 12 object(s) missing from prod:
--     [ ] index idx_response_templates_active on response_templates
--     [ ] index idx_response_analytics_review on response_analytics
--     [ ] index idx_response_analytics_created on response_analytics
--     [ ] function public.increment_template_usage()
--     [ ] trigger trigger_increment_template_usage on reviews
--     [ ] trigger update_response_templates_updated_at on response_templates
--     [ ] policy "Users can view their organization's response templates" on response_templates
--     [ ] policy "Admins and managers can create response templates" on response_templates
--     [ ] policy "Admins and managers can update response templates" on response_templates
--     [ ] policy "Admins can delete response templates" on response_templates
--     [ ] policy "Users can view their organization's response analytics" on response_analytics
--     [ ] policy "System can insert response analytics" on response_analytics
-- 20240101000009_notifications.sql  — 20 object(s) missing from prod:
--     [ ] index idx_notifications_type on notifications
--     [ ] index idx_notifications_created on notifications
--     [ ] index idx_notification_preferences_digest on notification_preferences
--     [ ] index idx_digest_queue_pending on notification_digest_queue
--     [ ] index idx_digest_queue_user on notification_digest_queue
--     [ ] index idx_slack_webhook_logs_user on slack_webhook_logs
--     [ ] index idx_slack_webhook_logs_created on slack_webhook_logs
--     [ ] function public.create_notification()
--     [ ] function public.calculate_next_digest_time()
--     [ ] function public.get_unread_notification_count()
--     [ ] function public.mark_notifications_read()
--     [ ] function public.get_pending_digest_notifications()
--     [ ] function public.mark_digest_sent()
--     [ ] function public.notify_on_review_insert()
--     [ ] function public.notify_on_review_approved()
--     [ ] function public.notify_on_response_posted()
--     [ ] trigger trigger_notify_on_review_insert on reviews
--     [ ] trigger trigger_notify_on_review_approved on reviews
--     [ ] trigger trigger_notify_on_response_posted on reviews
--     [ ] trigger update_notification_preferences_updated_at on notification_preferences
-- 20240101000011_multi_tenant_organizations.sql  — 12 object(s) missing from prod:
--     [ ] table public.organization_invitations
--     [ ] index idx_org_invitations_org on organization_invitations
--     [ ] index idx_org_invitations_email on organization_invitations
--     [ ] index idx_org_invitations_token on organization_invitations
--     [ ] function public.log_organization_change()
--     [ ] function public.get_organization_stats()
--     [ ] trigger trigger_log_org_changes on organizations
--     [ ] policy "admins_manage_invitations" on organization_invitations
--     [ ] policy "users_view_own_invitation" on organization_invitations
--     [ ] column public.organizations.features
--     [ ] column public.organizations.limits
--     [ ] column public.organizations.metadata
-- 20240101000015_geo_platform.sql  — 58 object(s) missing from prod:
--     [ ] table public.geo_visibility_scores
--     [ ] table public.geo_faqs
--     [ ] table public.geo_schema_implementations
--     [ ] table public.geo_ai_mentions
--     [ ] table public.geo_competitors
--     [ ] table public.geo_competitor_comparisons
--     [ ] table public.geo_performance_history
--     [ ] table public.geo_optimization_suggestions
--     [ ] table public.geo_content_templates
--     [ ] index idx_geo_visibility_org on geo_visibility_scores
--     [ ] index idx_geo_visibility_entity on geo_visibility_scores
--     [ ] index idx_geo_visibility_unique on geo_visibility_scores
--     [ ] index idx_geo_faqs_org on geo_faqs
--     [ ] index idx_geo_faqs_entity on geo_faqs
--     [ ] index idx_geo_faqs_active on geo_faqs
--     [ ] index idx_geo_schema_org on geo_schema_implementations
--     [ ] index idx_geo_schema_entity on geo_schema_implementations
--     [ ] index idx_geo_mentions_org on geo_ai_mentions
--     [ ] index idx_geo_mentions_entity on geo_ai_mentions
--     [ ] index idx_geo_mentions_platform on geo_ai_mentions
--     [ ] index idx_geo_mentions_detected on geo_ai_mentions
--     [ ] index idx_geo_competitors_org on geo_competitors
--     [ ] index idx_geo_comparisons_org on geo_competitor_comparisons
--     [ ] index idx_geo_comparisons_competitor on geo_competitor_comparisons
--     [ ] index idx_geo_performance_org on geo_performance_history
--     [ ] index idx_geo_performance_entity on geo_performance_history
--     [ ] index idx_geo_performance_period on geo_performance_history
--     [ ] index idx_geo_performance_unique on geo_performance_history
--     [ ] index idx_geo_suggestions_org on geo_optimization_suggestions
--     [ ] index idx_geo_suggestions_entity on geo_optimization_suggestions
--     [ ] index idx_geo_suggestions_status on geo_optimization_suggestions
--     [ ] index idx_geo_templates_org on geo_content_templates
--     [ ] index idx_geo_templates_category on geo_content_templates
--     [ ] trigger update_geo_visibility_scores_updated_at on geo_visibility_scores
--     [ ] trigger update_geo_faqs_updated_at on geo_faqs
--     [ ] trigger update_geo_schema_updated_at on geo_schema_implementations
--     [ ] trigger update_geo_competitors_updated_at on geo_competitors
--     [ ] trigger update_geo_suggestions_updated_at on geo_optimization_suggestions
--     [ ] trigger update_geo_templates_updated_at on geo_content_templates
--     [ ] policy "Users can view own org visibility scores" on geo_visibility_scores
--     [ ] policy "Users can insert own org visibility scores" on geo_visibility_scores
--     [ ] policy "Users can update own org visibility scores" on geo_visibility_scores
--     [ ] policy "Users can view own org FAQs" on geo_faqs
--     [ ] policy "Users can manage own org FAQs" on geo_faqs
--     [ ] policy "Users can view own org schema" on geo_schema_implementations
--     [ ] policy "Users can manage own org schema" on geo_schema_implementations
--     [ ] policy "Users can view own org mentions" on geo_ai_mentions
--     [ ] policy "Users can manage own org mentions" on geo_ai_mentions
--     [ ] policy "Users can view own org competitors" on geo_competitors
--     [ ] policy "Users can manage own org competitors" on geo_competitors
--     [ ] policy "Users can view own org comparisons" on geo_competitor_comparisons
--     [ ] policy "Users can manage own org comparisons" on geo_competitor_comparisons
--     [ ] policy "Users can view own org performance" on geo_performance_history
--     [ ] policy "Users can manage own org performance" on geo_performance_history
--     [ ] policy "Users can view own org suggestions" on geo_optimization_suggestions
--     [ ] policy "Users can manage own org suggestions" on geo_optimization_suggestions
--     [ ] policy "Users can view templates" on geo_content_templates
--     [ ] policy "Users can manage own org templates" on geo_content_templates
-- 20240101000019_salesforce_integration.sql  — 34 object(s) missing from prod:
--     [ ] index idx_salesforce_connections_active on salesforce_connections
--     [ ] index idx_salesforce_connections_unique_org on salesforce_connections
--     [ ] index idx_salesforce_sync_logs_organization on salesforce_sync_logs
--     [ ] index idx_salesforce_sync_logs_connection on salesforce_sync_logs
--     [ ] index idx_salesforce_sync_logs_created on salesforce_sync_logs
--     [ ] index idx_salesforce_contact_mappings_organization on salesforce_contact_mappings
--     [ ] index idx_salesforce_contact_mappings_connection on salesforce_contact_mappings
--     [ ] index idx_salesforce_contact_mappings_sf_contact on salesforce_contact_mappings
--     [ ] index idx_salesforce_contact_mappings_unique on salesforce_contact_mappings
--     [ ] index idx_salesforce_opportunity_mappings_organization on salesforce_opportunity_mappings
--     [ ] index idx_salesforce_opportunity_mappings_connection on salesforce_opportunity_mappings
--     [ ] index idx_salesforce_opportunity_mappings_sf_opp on salesforce_opportunity_mappings
--     [ ] index idx_salesforce_opportunity_mappings_stage on salesforce_opportunity_mappings
--     [ ] index idx_salesforce_opportunity_mappings_unique on salesforce_opportunity_mappings
--     [ ] index idx_salesforce_review_data_organization on salesforce_review_data
--     [ ] index idx_salesforce_review_data_connection on salesforce_review_data
--     [ ] index idx_salesforce_review_data_review on salesforce_review_data
--     [ ] index idx_salesforce_review_data_unique on salesforce_review_data
--     [ ] trigger update_salesforce_connections_updated_at on salesforce_connections
--     [ ] trigger update_salesforce_contact_mappings_updated_at on salesforce_contact_mappings
--     [ ] trigger update_salesforce_opportunity_mappings_updated_at on salesforce_opportunity_mappings
--     [ ] trigger update_salesforce_review_data_updated_at on salesforce_review_data
--     [ ] policy "Users can view their organization's salesforce connections" on salesforce_connections
--     [ ] policy "Admins can insert salesforce connections" on salesforce_connections
--     [ ] policy "Admins can update salesforce connections" on salesforce_connections
--     [ ] policy "Admins can delete salesforce connections" on salesforce_connections
--     [ ] policy "Users can view their organization's salesforce sync logs" on salesforce_sync_logs
--     [ ] policy "System can insert salesforce sync logs" on salesforce_sync_logs
--     [ ] policy "Users can view their organization's salesforce contact mappings" on salesforce_contact_mappings
--     [ ] policy "Admins can manage salesforce contact mappings" on salesforce_contact_mappings
--     [ ] policy "Users can view their organization's salesforce opportunity mappings" on salesforce_opportunity_mappings
--     [ ] policy "Admins can manage salesforce opportunity mappings" on salesforce_opportunity_mappings
--     [ ] policy "Users can view their organization's salesforce review data" on salesforce_review_data
--     [ ] policy "Admins can manage salesforce review data" on salesforce_review_data
-- 20240101000025_onboarding.sql  — 10 object(s) missing from prod:
--     [ ] index idx_onboarding_steps_org on onboarding_steps
--     [ ] index idx_onboarding_steps_name on onboarding_steps
--     [ ] function public.get_onboarding_redirect_step()
--     [ ] function public.update_onboarding_status()
--     [ ] function public.should_skip_onboarding()
--     [ ] trigger update_onboarding_steps_updated_at on onboarding_steps
--     [ ] policy "users_view_own_org_onboarding_steps" on onboarding_steps
--     [ ] policy "admins_manage_onboarding_steps" on onboarding_steps
--     [ ] column public.users.invited_by
--     [ ] column public.users.invite_accepted_at
-- 20240101000030_drop_listings_feature.sql  — 3 object(s) missing from prod:
--     [ ] table public.listing_alerts ABSENT
--     [ ] table public.directory_connections ABSENT
--     [ ] table public.listing_sync_logs ABSENT
-- 20240101000032_industry_system.sql  — 10 object(s) missing from prod:
--     [ ] table public.professional_credentials
--     [ ] index idx_professional_credentials_professional on professional_credentials
--     [ ] index idx_professional_credentials_organization on professional_credentials
--     [ ] index idx_organizations_industry on organizations
--     [ ] trigger set_professional_credentials_updated_at on professional_credentials
--     [ ] policy "Users can view credentials in their organization" on professional_credentials
--     [ ] policy "Admins and managers can insert credentials" on professional_credentials
--     [ ] policy "Admins and managers can update credentials" on professional_credentials
--     [ ] policy "Admins can delete credentials" on professional_credentials
--     [ ] column public.organizations.industry_config
-- 20240101000033_video_testimonials.sql  — 3 object(s) missing from prod:
--     [ ] index idx_video_testimonial_queue_request_type on video_testimonial_queue
--     [ ] function public.lookup_video_testimonial_request()
--     [ ] function public.mark_video_testimonial_opened()
-- 20240101000034_video_testimonial_text_approval.sql  — 15 object(s) missing from prod:
--     [ ] index idx_video_testimonial_responses_text_approval_status on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_customer_rating on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_text_approved_at on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_final_consent_timestamp on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_org_approval_status on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_org_customer_rating on video_testimonial_responses
--     [ ] index idx_video_testimonial_responses_org_approved_at on video_testimonial_responses
--     [ ] column public.video_testimonial_responses.customer_approved_text
--     [ ] column public.video_testimonial_responses.text_approval_status
--     [ ] column public.video_testimonial_responses.text_approved_at
--     [ ] column public.video_testimonial_responses.google_review_redirect_shown
--     [ ] column public.video_testimonial_responses.google_review_redirect_clicked
--     [ ] column public.video_testimonial_responses.text_edit_count
--     [ ] column public.video_testimonial_responses.final_consent_given
--     [ ] column public.video_testimonial_responses.final_consent_timestamp
-- 20240101000037_video_testimonial_email_tracking.sql  — 3 object(s) missing from prod:
--     [ ] index idx_video_testimonial_requests_email_delivered on video_testimonial_requests
--     [ ] enum video_testimonial_request_status value 'failed'
--     [ ] column public.video_testimonial_requests.failure_reason
-- 20240101000042_generated_videos.sql  — 4 object(s) missing from prod:
--     [ ] index idx_generated_videos_organization_id on generated_videos
--     [ ] index idx_generated_videos_created_at on generated_videos
--     [ ] index idx_video_testimonial_responses_generation_status on video_testimonial_responses
--     [ ] policy "Service role full access" on generated_videos
-- 20240101000055_rls_better_auth_migration.sql  — 7 object(s) missing from prod:
--     [ ] policy "user_badges_select_own" on user_badges
--     [ ] policy "user_badges_select_org" on user_badges
--     [ ] policy "user_badges_insert" on user_badges
--     [ ] policy "user_badges_update" on user_badges
--     [ ] policy "reputation_history_select_own" on reputation_history
--     [ ] policy "reputation_history_select_org" on reputation_history
--     [ ] policy "reputation_history_insert" on reputation_history
-- 20260201000012_widget_config_versions.sql  — 6 object(s) missing from prod:
--     [ ] index idx_widget_config_versions_unique on widget_config_versions
--     [ ] index idx_widget_config_versions_widget_created on widget_config_versions
--     [ ] function public.prune_widget_config_versions()
--     [ ] trigger trg_prune_widget_config_versions on widget_config_versions
--     [ ] policy "Org members can view version history" on widget_config_versions
--     [ ] policy "Service role full access on widget_config_versions" on widget_config_versions

-- =========================================================================
-- SECTION E — NOT_APPLIED & UNVERIFIABLE
-- NOT_APPLIED (27) and UNVERIFIABLE (3) versions are NOT registered here.
-- See scripts/drift-report.md: 3 are DROP migrations whose targets still exist
-- (applying them is destructive), 24 are feature migrations never deployed to prod,
-- and 3 are pure data/backfill migrations with no schema markers to verify.
-- =========================================================================

COMMIT;
