-- S153: Widget A/B Testing Framework
-- Adds ab_test metadata columns and constraints for A/B testing support.
-- parent_widget_id and ab_test_group already exist from initial migration.

-- Add ab_test_config to store test metadata on the parent widget.
-- Stores: { enabled, splitPercent, variantWidgetId, startedAt, status }
ALTER TABLE widget_configs
  ADD COLUMN IF NOT EXISTS ab_test_config JSONB DEFAULT NULL;

COMMENT ON COLUMN widget_configs.ab_test_config IS
  'A/B test metadata on parent widget: { enabled, splitPercent, variantWidgetId, startedAt, status }';

-- Ensure only one active A/B test per parent widget (constraint at app level,
-- index for fast lookup of variants by parent).
-- parent_widget_id index already exists from initial migration.

-- Index for finding active A/B tests quickly
CREATE INDEX IF NOT EXISTS idx_widget_configs_ab_test_active
  ON widget_configs ((ab_test_config->>'enabled'))
  WHERE ab_test_config IS NOT NULL;
