-- purge-fake-geo-data.sql
--
-- The GEO / "AI Visibility" feature was fabricated: its dashboards were populated
-- with Math.random() values rather than real data. The feature (routes, lib, and
-- components) has been removed from the app. This script deletes the fabricated
-- rows that were written to the geo_* tables so no bogus data lingers.
--
-- SAFETY: Review before running. This is DESTRUCTIVE and cannot be undone.
-- It is intended to be run manually by an operator (the PM) — it is NOT executed
-- as part of any automated migration. Take a backup/snapshot first.
--
-- The tables themselves are left in place (no DROP) so that any FK references and
-- migration history stay intact; only the fabricated rows are removed. If you also
-- want to drop the tables, do that in a separate, reviewed migration.

BEGIN;

-- geo_performance_history holds the fabricated visibility trend/scorecard data.
DELETE FROM geo_performance_history;

-- Child table first (references geo_competitors), then the rest of the fabricated
-- GEO analytics tables.
DELETE FROM geo_competitor_comparisons;
DELETE FROM geo_competitors;
DELETE FROM geo_ai_mentions;
DELETE FROM geo_optimization_suggestions;
DELETE FROM geo_schema_implementations;
DELETE FROM geo_faqs;
DELETE FROM geo_visibility_scores;
DELETE FROM geo_content_templates;

COMMIT;
