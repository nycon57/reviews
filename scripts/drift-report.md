# Migration Registry Drift Report

_Generated 2026-07-07 — read-only schema-drift verification against production._

## What this is

The remote schema was built largely via dashboard SQL, so most local migration files were
never recorded in `supabase_migrations.schema_migrations`. That makes `supabase db push`
untrustworthy: it would try to re-run migrations that are already live. This pass verifies,
object-by-object against the live catalog, which unregistered local migrations are actually
applied — so the safe ones can be registered and the genuinely-missing ones surfaced.

**Method.** Every unregistered local migration was parsed for schema markers (CREATE TABLE →
table exists; ADD COLUMN → column exists; CREATE INDEX → `pg_indexes`; CREATE FUNCTION →
`pg_proc`; CREATE POLICY → `pg_policies`; ALTER TYPE ADD VALUE → `pg_enum`; CREATE TRIGGER →
`pg_trigger`; CHECK/FK constraints → `pg_constraint`). Each marker was checked against the
live catalog. Matchers were validated by direct spot-queries (controls present, absent
features confirmed absent, enum values confirmed exact) before classifying.

**All access was read-only** (SELECT / `information_schema` / `pg_catalog` only). No INSERT,
UPDATE, ALTER, or DDL was issued. The repair SQL was authored but NOT executed.

## Summary

| Metric | Count |
|---|---|
| Local migration files | 125 |
| Registered versions in prod | 120 |
| Unregistered local files verified | 110 |
| &nbsp;&nbsp;→ FULLY_APPLIED | 55 |
| &nbsp;&nbsp;→ PARTIALLY_APPLIED | 25 |
| &nbsp;&nbsp;→ NOT_APPLIED | 27 |
| &nbsp;&nbsp;→ UNVERIFIABLE (pure data) | 3 |
| Versions safe to register now (Section A of repair SQL) | 51 |
| Version-string collisions (repo fix required) | 4 |
| Prod-only tables (no local migration) | 5 |
| Repo tables absent from prod | 33 |
| Remote-registered versions with no local file | 105 |

## Action summary

1. **Run Section A** of `scripts/repair-migration-registry.sql` — registers 51 verified
   FULLY_APPLIED versions. Pure bookkeeping; changes no schema.
2. **Fix the 4 version collisions** (below) by renaming files to unique versions BEFORE any
   `db push`. Three of them pair an applied file with an un-applied sibling under one version.
3. **Register the 9 applied-then-superseded partials** (Section C) after a glance — not doing so
   means `db push` would recreate deliberately-dropped objects (e.g. `loan_officers`, the
   business-listings feature).
4. **Decide the 16 real-gap partials and 24 never-deployed feature migrations** — these are true
   drift: prod is missing schema the repo defines.

## Version-string collisions (critical)

Two local files share one version string. Supabase keys migrations by version alone, so
registering the version hides the sibling from `db push` forever. Rename one file per pair.

| Version | File | Status |
|---|---|---|
| 20240101000015 | 20240101000015_employee_experience.sql | FULLY_APPLIED |
| 20240101000015 | 20240101000015_geo_platform.sql | PARTIALLY_APPLIED |
| 20240101000030 | 20240101000030_drop_listings_feature.sql | PARTIALLY_APPLIED |
| 20240101000030 | 20240101000030_review_response_email.sql | FULLY_APPLIED |
| 20260222000003 | 20260222000003_add_organization_description.sql | FULLY_APPLIED |
| 20260222000003 | 20260222000003_deprecate_departments.sql | NOT_APPLIED |
| 20260303000001 | 20260303000001_add_video_testimonial_user_id_fkeys.sql | FULLY_APPLIED |
| 20260303000001 | 20260303000001_rename_contacts_to_employees.sql | FULLY_APPLIED |

The first three are **mixed-status** and are excluded from the auto-register set. `20260303000001`
is both-applied and is registered once in Section A, but should still be de-duplicated in the repo.

## FULLY_APPLIED (55)

Every marker present in prod. Registered by Section A (except the 3 excluded collision versions,
which are applied but share a version with an un-applied sibling — see above).

<details><summary>Full list</summary>

- `20240101000003_email_unsubscribes.sql` (5 markers)
- `20240101000004_survey_distribution.sql` (28 markers)
- `20240101000006_reporting.sql` (24 markers)
- `20240101000015_employee_experience.sql` (62 markers)
- `20240101000016_employee_recognition.sql` (41 markers)
- `20240101000026_user_account_types.sql` (6 markers)
- `20240101000027_encompass_milestone_mappings.sql` (9 markers)
- `20240101000028_api_keys_enhancements.sql` (30 markers)
- `20240101000029_storage_buckets.sql` (8 markers)
- `20240101000030_review_response_email.sql` (2 markers)
- `20240101000031_teams_integration.sql` (9 markers)
- `20240101000035_video_approval_workflow.sql` (5 markers)
- `20240101000038_expand_users_table.sql` (26 markers)
- `20240101000039_user_credentials.sql` (12 markers)
- `20240101000040_groups.sql` (16 markers)
- `20240101000057_user_industry.sql` (2 markers)
- `20240101000059_rename_loan_officer_role_to_user.sql` (1 markers)
- `20260124223035_complete_user_profile_columns.sql` (14 markers)
- `20260125000001_add_user_slugs.sql` (3 markers)
- `20260125000003_add_branch_coordinates.sql` (3 markers)
- `20260131000001_sms_channel_schema.sql` (69 markers)
- `20260131000005_add_sms_compliance_columns.sql` (4 markers)
- `20260201000004_widget_tables.sql` (26 markers)
- `20260201000005_widget_rls_fixes.sql` (5 markers)
- `20260207000001_add_branch_manager_id.sql` (2 markers)
- `20260207000002_branch_global_slugs.sql` (3 markers)
- `20260209000001_auto_reply_queue.sql` (8 markers)
- `20260216000001_share_studio_schema.sql` (49 markers)
- `20260217000001_add_social_urls_to_users.sql` (3 markers)
- `20260220000001_review_flags.sql` (5 markers)
- `20260221000001_org_contact_fields.sql` (9 markers)
- `20260222000003_add_organization_description.sql` (1 markers)
- `20260222000004_add_social_urls_to_branches.sql` (5 markers)
- `20260223000001_fuzzy_search_radius.sql` (4 markers)
- `20260224000001_individual_org_branch_tables.sql` (13 markers)
- `20260225000001_campaign_workflows.sql` (11 markers)
- `20260225000002_word_level_timestamps.sql` (2 markers)
- `20260225000003_add_admin_plugin_columns.sql` (4 markers)
- `20260226000001_share_studio_slug_canonical.sql` (4 markers)
- `20260226000002_proof_link_events_retention.sql` (4 markers)
- `20260228000002_campaign_lock_rpc_functions.sql` (2 markers)
- `20260301000001_add_impersonation_session_index.sql` (1 markers)
- `20260301000002_ensure_organization_audit_logs.sql` (16 markers)
- `20260301000003_video_testimonial_request_status_enums.sql` (2 markers)
- `20260301000004_video_testimonial_hardening.sql` (37 markers)
- `20260303000001_add_video_testimonial_user_id_fkeys.sql` (2 markers)
- `20260303000001_rename_contacts_to_employees.sql` (6 markers)
- `20260303000002_add_org_avatar_banner_urls.sql` (2 markers)
- `20260314000001_email_builder_templates.sql` (8 markers)
- `20260315000002_unify_subscription_tiers.sql` (1 markers)
- `20260315000003_add_grace_period_column.sql` (3 markers)
- `20260609000001_video_rating_and_recapture.sql` (9 markers)
- `20260609000002_reviews_video_testimonial_source.sql` (1 markers)
- `20260610000001_clip_music_tracks.sql` (2 markers)
- `20260610000002_review_publish_inversion.sql` (10 markers)

</details>

## PARTIALLY_APPLIED (25) — most important

Split into two groups. **"Superseded"** = the migration ran, and the missing objects were later
removed (by a later local migration, or by the prod-only `loan_officers`→`users` refactor — that
table was dropped in prod with no local migration). **"Real gap"** = prod is missing an object no
migration removes.

### C. Applied-then-superseded — recommend REGISTER (9)

These were applied. Missing markers are all explained by later removals, so re-running them would
recreate dropped objects. Register (do not apply). Ready as commented INSERTs in Section C of the SQL.

| File | Markers | Superseded | loan_officers-refactor | Real gaps |
|---|---|---|---|---|
| `20240101000000_initial_schema.sql` | 46 | 0 | 10 | 0 |
| `20240101000002_fix_function_search_path.sql` | 4 | 0 | 1 | 0 |
| `20240101000007_google_integration.sql` | 22 | 0 | 1 | 0 |
| `20240101000010_testimonials.sql` | 21 | 0 | 1 | 0 |
| `20240101000012_branches.sql` | 16 | 1 | 2 | 0 |
| `20240101000014_business_listings.sql` | 53 | 45 | 0 | 0 |
| `20240101000041_migrate_loan_officers_data.sql` | 12 | 0 | 1 | 0 |
| `20240101000053_better_auth_schema.sql` | 27 | 1 | 0 | 0 |
| `20260222000002_contacts_system.sql` | 9 | 8 | 0 | 0 |

### D. Real gaps — PM decision (16)

Prod is missing objects with no later removal. These represent genuine incomplete application.
Each file lists the exact missing objects.

**`20240101000001_rls_policies.sql`** — 2 missing (+2 loan_officers-refactor, 4 superseded):

- function public.get_user_role()
- function public.get_user_is_active()

**`20240101000005_gamification.sql`** — 8 missing (+4 loan_officers-refactor, 7 superseded):

- index idx_leaderboard_snapshots_date on leaderboard_snapshots
- index idx_gamification_settings_org on gamification_settings
- function public.calculate_and_update_reputation()
- function public.trigger_gamification_update()
- trigger trigger_gamification_on_review on reviews
- trigger trigger_gamification_on_survey_response on survey_responses
- trigger update_badges_updated_at on badges
- trigger update_gamification_settings_updated_at on gamification_settings

**`20240101000008_response_management.sql`** — 12 missing (+1 loan_officers-refactor, 0 superseded):

- index idx_response_templates_active on response_templates
- index idx_response_analytics_review on response_analytics
- index idx_response_analytics_created on response_analytics
- function public.increment_template_usage()
- trigger trigger_increment_template_usage on reviews
- trigger update_response_templates_updated_at on response_templates
- policy "Users can view their organization's response templates" on response_templates
- policy "Admins and managers can create response templates" on response_templates
- policy "Admins and managers can update response templates" on response_templates
- policy "Admins can delete response templates" on response_templates
- policy "Users can view their organization's response analytics" on response_analytics
- policy "System can insert response analytics" on response_analytics

**`20240101000009_notifications.sql`** — 20 missing:

- index idx_notifications_type on notifications
- index idx_notifications_created on notifications
- index idx_notification_preferences_digest on notification_preferences
- index idx_digest_queue_pending on notification_digest_queue
- index idx_digest_queue_user on notification_digest_queue
- index idx_slack_webhook_logs_user on slack_webhook_logs
- index idx_slack_webhook_logs_created on slack_webhook_logs
- function public.create_notification()
- function public.calculate_next_digest_time()
- function public.get_unread_notification_count()
- function public.mark_notifications_read()
- function public.get_pending_digest_notifications()
- function public.mark_digest_sent()
- function public.notify_on_review_insert()
- function public.notify_on_review_approved()
- function public.notify_on_response_posted()
- trigger trigger_notify_on_review_insert on reviews
- trigger trigger_notify_on_review_approved on reviews
- trigger trigger_notify_on_response_posted on reviews
- trigger update_notification_preferences_updated_at on notification_preferences

**`20240101000011_multi_tenant_organizations.sql`** — 12 missing (+1 superseded):

- table public.organization_invitations
- index idx_org_invitations_org on organization_invitations
- index idx_org_invitations_email on organization_invitations
- index idx_org_invitations_token on organization_invitations
- function public.log_organization_change()
- function public.get_organization_stats()
- trigger trigger_log_org_changes on organizations
- policy "admins_manage_invitations" on organization_invitations
- policy "users_view_own_invitation" on organization_invitations
- column public.organizations.features
- column public.organizations.limits
- column public.organizations.metadata

**`20240101000015_geo_platform.sql`** — 58 missing:

- table public.geo_visibility_scores
- table public.geo_faqs
- table public.geo_schema_implementations
- table public.geo_ai_mentions
- table public.geo_competitors
- table public.geo_competitor_comparisons
- table public.geo_performance_history
- table public.geo_optimization_suggestions
- table public.geo_content_templates
- index idx_geo_visibility_org on geo_visibility_scores
- index idx_geo_visibility_entity on geo_visibility_scores
- index idx_geo_visibility_unique on geo_visibility_scores
- index idx_geo_faqs_org on geo_faqs
- index idx_geo_faqs_entity on geo_faqs
- index idx_geo_faqs_active on geo_faqs
- index idx_geo_schema_org on geo_schema_implementations
- index idx_geo_schema_entity on geo_schema_implementations
- index idx_geo_mentions_org on geo_ai_mentions
- index idx_geo_mentions_entity on geo_ai_mentions
- index idx_geo_mentions_platform on geo_ai_mentions
- index idx_geo_mentions_detected on geo_ai_mentions
- index idx_geo_competitors_org on geo_competitors
- index idx_geo_comparisons_org on geo_competitor_comparisons
- index idx_geo_comparisons_competitor on geo_competitor_comparisons
- index idx_geo_performance_org on geo_performance_history
- index idx_geo_performance_entity on geo_performance_history
- index idx_geo_performance_period on geo_performance_history
- index idx_geo_performance_unique on geo_performance_history
- index idx_geo_suggestions_org on geo_optimization_suggestions
- index idx_geo_suggestions_entity on geo_optimization_suggestions
- index idx_geo_suggestions_status on geo_optimization_suggestions
- index idx_geo_templates_org on geo_content_templates
- index idx_geo_templates_category on geo_content_templates
- trigger update_geo_visibility_scores_updated_at on geo_visibility_scores
- trigger update_geo_faqs_updated_at on geo_faqs
- trigger update_geo_schema_updated_at on geo_schema_implementations
- trigger update_geo_competitors_updated_at on geo_competitors
- trigger update_geo_suggestions_updated_at on geo_optimization_suggestions
- trigger update_geo_templates_updated_at on geo_content_templates
- policy "Users can view own org visibility scores" on geo_visibility_scores
- policy "Users can insert own org visibility scores" on geo_visibility_scores
- policy "Users can update own org visibility scores" on geo_visibility_scores
- policy "Users can view own org FAQs" on geo_faqs
- policy "Users can manage own org FAQs" on geo_faqs
- policy "Users can view own org schema" on geo_schema_implementations
- policy "Users can manage own org schema" on geo_schema_implementations
- policy "Users can view own org mentions" on geo_ai_mentions
- policy "Users can manage own org mentions" on geo_ai_mentions
- policy "Users can view own org competitors" on geo_competitors
- policy "Users can manage own org competitors" on geo_competitors
- policy "Users can view own org comparisons" on geo_competitor_comparisons
- policy "Users can manage own org comparisons" on geo_competitor_comparisons
- policy "Users can view own org performance" on geo_performance_history
- policy "Users can manage own org performance" on geo_performance_history
- policy "Users can view own org suggestions" on geo_optimization_suggestions
- policy "Users can manage own org suggestions" on geo_optimization_suggestions
- policy "Users can view templates" on geo_content_templates
- policy "Users can manage own org templates" on geo_content_templates

**`20240101000019_salesforce_integration.sql`** — 34 missing:

- index idx_salesforce_connections_active on salesforce_connections
- index idx_salesforce_connections_unique_org on salesforce_connections
- index idx_salesforce_sync_logs_organization on salesforce_sync_logs
- index idx_salesforce_sync_logs_connection on salesforce_sync_logs
- index idx_salesforce_sync_logs_created on salesforce_sync_logs
- index idx_salesforce_contact_mappings_organization on salesforce_contact_mappings
- index idx_salesforce_contact_mappings_connection on salesforce_contact_mappings
- index idx_salesforce_contact_mappings_sf_contact on salesforce_contact_mappings
- index idx_salesforce_contact_mappings_unique on salesforce_contact_mappings
- index idx_salesforce_opportunity_mappings_organization on salesforce_opportunity_mappings
- index idx_salesforce_opportunity_mappings_connection on salesforce_opportunity_mappings
- index idx_salesforce_opportunity_mappings_sf_opp on salesforce_opportunity_mappings
- index idx_salesforce_opportunity_mappings_stage on salesforce_opportunity_mappings
- index idx_salesforce_opportunity_mappings_unique on salesforce_opportunity_mappings
- index idx_salesforce_review_data_organization on salesforce_review_data
- index idx_salesforce_review_data_connection on salesforce_review_data
- index idx_salesforce_review_data_review on salesforce_review_data
- index idx_salesforce_review_data_unique on salesforce_review_data
- trigger update_salesforce_connections_updated_at on salesforce_connections
- trigger update_salesforce_contact_mappings_updated_at on salesforce_contact_mappings
- trigger update_salesforce_opportunity_mappings_updated_at on salesforce_opportunity_mappings
- trigger update_salesforce_review_data_updated_at on salesforce_review_data
- policy "Users can view their organization's salesforce connections" on salesforce_connections
- policy "Admins can insert salesforce connections" on salesforce_connections
- policy "Admins can update salesforce connections" on salesforce_connections
- policy "Admins can delete salesforce connections" on salesforce_connections
- policy "Users can view their organization's salesforce sync logs" on salesforce_sync_logs
- policy "System can insert salesforce sync logs" on salesforce_sync_logs
- policy "Users can view their organization's salesforce contact mappings" on salesforce_contact_mappings
- policy "Admins can manage salesforce contact mappings" on salesforce_contact_mappings
- policy "Users can view their organization's salesforce opportunity mappings" on salesforce_opportunity_mappings
- policy "Admins can manage salesforce opportunity mappings" on salesforce_opportunity_mappings
- policy "Users can view their organization's salesforce review data" on salesforce_review_data
- policy "Admins can manage salesforce review data" on salesforce_review_data

**`20240101000025_onboarding.sql`** — 10 missing:

- index idx_onboarding_steps_org on onboarding_steps
- index idx_onboarding_steps_name on onboarding_steps
- function public.get_onboarding_redirect_step()
- function public.update_onboarding_status()
- function public.should_skip_onboarding()
- trigger update_onboarding_steps_updated_at on onboarding_steps
- policy "users_view_own_org_onboarding_steps" on onboarding_steps
- policy "admins_manage_onboarding_steps" on onboarding_steps
- column public.users.invited_by
- column public.users.invite_accepted_at

**`20240101000030_drop_listings_feature.sql`** — 3 missing:

- table public.listing_alerts ABSENT
- table public.directory_connections ABSENT
- table public.listing_sync_logs ABSENT

**`20240101000032_industry_system.sql`** — 10 missing (+2 loan_officers-refactor, 0 superseded):

- table public.professional_credentials
- index idx_professional_credentials_professional on professional_credentials
- index idx_professional_credentials_organization on professional_credentials
- index idx_organizations_industry on organizations
- trigger set_professional_credentials_updated_at on professional_credentials
- policy "Users can view credentials in their organization" on professional_credentials
- policy "Admins and managers can insert credentials" on professional_credentials
- policy "Admins and managers can update credentials" on professional_credentials
- policy "Admins can delete credentials" on professional_credentials
- column public.organizations.industry_config

**`20240101000033_video_testimonials.sql`** — 3 missing (+2 loan_officers-refactor, 4 superseded):

- index idx_video_testimonial_queue_request_type on video_testimonial_queue
- function public.lookup_video_testimonial_request()
- function public.mark_video_testimonial_opened()

**`20240101000034_video_testimonial_text_approval.sql`** — 15 missing:

- index idx_video_testimonial_responses_text_approval_status on video_testimonial_responses
- index idx_video_testimonial_responses_customer_rating on video_testimonial_responses
- index idx_video_testimonial_responses_text_approved_at on video_testimonial_responses
- index idx_video_testimonial_responses_final_consent_timestamp on video_testimonial_responses
- index idx_video_testimonial_responses_org_approval_status on video_testimonial_responses
- index idx_video_testimonial_responses_org_customer_rating on video_testimonial_responses
- index idx_video_testimonial_responses_org_approved_at on video_testimonial_responses
- column public.video_testimonial_responses.customer_approved_text
- column public.video_testimonial_responses.text_approval_status
- column public.video_testimonial_responses.text_approved_at
- column public.video_testimonial_responses.google_review_redirect_shown
- column public.video_testimonial_responses.google_review_redirect_clicked
- column public.video_testimonial_responses.text_edit_count
- column public.video_testimonial_responses.final_consent_given
- column public.video_testimonial_responses.final_consent_timestamp

**`20240101000037_video_testimonial_email_tracking.sql`** — 3 missing:

- index idx_video_testimonial_requests_email_delivered on video_testimonial_requests
- enum video_testimonial_request_status value 'failed'
- column public.video_testimonial_requests.failure_reason

**`20240101000042_generated_videos.sql`** — 4 missing:

- index idx_generated_videos_organization_id on generated_videos
- index idx_generated_videos_created_at on generated_videos
- index idx_video_testimonial_responses_generation_status on video_testimonial_responses
- policy "Service role full access" on generated_videos

**`20240101000055_rls_better_auth_migration.sql`** — 7 missing (+7 loan_officers-refactor, 0 superseded):

- policy "user_badges_select_own" on user_badges
- policy "user_badges_select_org" on user_badges
- policy "user_badges_insert" on user_badges
- policy "user_badges_update" on user_badges
- policy "reputation_history_select_own" on reputation_history
- policy "reputation_history_select_org" on reputation_history
- policy "reputation_history_insert" on reputation_history

**`20260201000012_widget_config_versions.sql`** — 6 missing:

- index idx_widget_config_versions_unique on widget_config_versions
- index idx_widget_config_versions_widget_created on widget_config_versions
- function public.prune_widget_config_versions()
- trigger trg_prune_widget_config_versions on widget_config_versions
- policy "Org members can view version history" on widget_config_versions
- policy "Service role full access on widget_config_versions" on widget_config_versions

## NOT_APPLIED (27)

### D1. DROP migrations whose targets STILL EXIST (3) — applying is destructive

The removal never happened in prod; the objects are still there. "Applying" these drops them.
Confirm the objects are truly dead before running.

- **`20240101000056_remove_ba_org_plugin_tables.sql`** — still present: table public.members; table public.invitations
- **`20260124174623_remove_ex_action_plans.sql`** — still present: table public.ex_action_plans
- **`20260222000003_deprecate_departments.sql`** — still present: table public.ex_metrics_snapshots; constraint users_department_id_fkey on users

### D2. Feature migrations never deployed to prod (24)

None of these objects exist in prod. Either deploy (apply) or delete the migration if the feature
was abandoned. Ordered by version.

| File | Objects absent |
|---|---|
| `20240101000013_social_media.sql` | 47 |
| `20240101000018_website_analytics.sql` | 24 |
| `20240101000036_organization_settings.sql` | 7 |
| `20240101000044_team_invite_tracking.sql` | 5 |
| `20240101000045_add_role_onboarding_sequence_type.sql` | 1 |
| `20240101000047_add_organization_suspended_at.sql` | 2 |
| `20240101000048_announcements.sql` | 37 |
| `20240101000050_email_preferences_center.sql` | 19 |
| `20240101000052_abandoned_action_recovery.sql` | 18 |
| `20240101000058_billing_user_view_policies.sql` | 4 |
| `20240101000060_finalize_subscription_tiers.sql` | 3 |
| `20260131000002_sms_short_link_click_rpc.sql` | 1 |
| `20260131000003_sms_daily_stat_increment_rpc.sql` | 1 |
| `20260131000004_sms_registration_failure_columns.sql` | 2 |
| `20260201000001_sms_automation_triggers.sql` | 12 |
| `20260201000002_sms_conversation_ui.sql` | 6 |
| `20260201000003_sms_enterprise_features.sql` | 16 |
| `20260201000006_review_advanced_filters.sql` | 4 |
| `20260201000010_ab_testing.sql` | 2 |
| `20260201000011_enhanced_widget_analytics.sql` | 6 |
| `20260206000001_sms_consent_revoke_delete.sql` | 2 |
| `20260210000001_restrict_survey_template_rls.sql` | 1 |
| `20260222000001_branch_manager_auto_assign.sql` | 2 |
| `20260228000001_campaign_workflow_sequences_fk.sql` | 2 |

## UNVERIFIABLE (3)

Pure data/backfill migrations (UPDATE/INSERT only, no schema markers). Cannot be confirmed by
catalog inspection. Not registered by this pass; decide manually (they are idempotent-ish and
generally safe to re-run, but confirm).

- `20240101000054_better_auth_user_migration.sql`
- `20260125000002_backfill_user_slugs.sql`
- `20260317000001_canonicalize_branch_global_slugs.sql`

## Prod-only schema (divergence)

### Tables in prod with NO local migration (5)

These exist in production but no local file creates them — created via dashboard SQL. The repo
cannot recreate them; capture them with `supabase db pull` into a new migration.

- `blog_posts`
- `media_assets`
- `profile_referrals`
- `public_review_submissions`
- `user_tasks`

### Tables the repo creates but prod LACKS (33)

Local migrations create these, no local migration drops them, yet they are absent in prod. This is
the core drift. `loan_officers` is the notable case: the repo still creates it (initial_schema),
but prod dropped it via an unversioned change during the `loan_officers`→`users` refactor — so a
naive `db push` of initial_schema would recreate it. The rest are the never-deployed features above.

- `abandoned_actions`
- `announcement_email_logs`
- `announcement_recipients`
- `announcements`
- `area_code_states`
- `changelog_entries`
- `email_preference_tokens`
- `geo_ai_mentions`
- `geo_competitor_comparisons`
- `geo_competitors`
- `geo_content_templates`
- `geo_faqs`
- `geo_optimization_suggestions`
- `geo_performance_history`
- `geo_schema_implementations`
- `geo_visibility_scores`
- `loan_officers`
- `organization_invitations`
- `organization_settings`
- `professional_credentials`
- `sms_audit_log`
- `sms_branded_domains`
- `sms_cost_alert_log`
- `sms_state_quiet_hours`
- `social_connections`
- `social_post_analytics`
- `social_post_templates`
- `social_posts`
- `social_publish_queue`
- `user_announcement_preferences`
- `website_analytics`
- `website_analytics_summary`
- `website_seo_audits`

## Remote-registered versions with no local file (105)

These versions are recorded in `supabase_migrations.schema_migrations` but match no local
filename — the dashboard-era ad-hoc registrations. They are the timestamped entries created while
the schema was built by hand. Their SQL is not in the repo; the live schema is the source of truth
for whatever they did. No action needed for `db push` (already registered), but they explain why
prod contains schema — and drops like `loan_officers` — that no local migration accounts for.

<details><summary>All 105 versions</summary>

```
20260114041804
20260114041828
20260114042123
20260114080844
20260114081132
20260114081235
20260114081417
20260114220647
20260116055625
20260116060334
20260116174555
20260116181941
20260116183057
20260116183116
20260116213018
20260116213638
20260116225348
20260116225707
20260116233327
20260117034726
20260117034736
20260117034748
20260117034806
20260117035213
20260117035732
20260117035808
20260117035833
20260117035854
20260117040025
20260117040350
20260117203859
20260118191407
20260118191413
20260118212311
20260118212327
20260118212344
20260118212448
20260119013704
20260119013822
20260119030008
20260119030715
20260121125946
20260123030535
20260123030547
20260123035034
20260123035540
20260123181156
20260123212319
20260124031848
20260124214310
20260124234550
20260124234600
20260124234609
20260125033149
20260125144856
20260125145854
20260125152524
20260126000144
20260126000154
20260126035143
20260126040300
20260131175354
20260131221906
20260201164830
20260201170256
20260207222956
20260208014250
20260216034524
20260216044726
20260218042045
20260220052253
20260221234714
20260223034624
20260223051035
20260223051523
20260223204039
20260223212139
20260223221439
20260225050825
20260225051705
20260225213913
20260225225528
20260225225535
20260301044818
20260301050852
20260301121528
20260301121715
20260303053334
20260303055315
20260303143228
20260309044453
20260309044551
20260310141616
20260314232454
20260317035341
20260318015256
20260318043057
20260319225509
20260609220555
20260609222020
20260609222308
20260609225942
20260610122941
20260610133143
20260610133154
```

</details>

## Read-only confirmation

Every query in this pass was SELECT / `information_schema` / `pg_catalog`. No row was inserted,
updated, or deleted; no DDL ran; `scripts/repair-migration-registry.sql` was generated but NOT
executed. The connection string was read from `.env` and never printed.
