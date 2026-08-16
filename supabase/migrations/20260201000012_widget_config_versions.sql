-- Widget Config Version History (S161)
-- Stores complete config snapshots per widget for version history, diff, and rollback.
-- Max 50 versions per widget; oldest auto-pruned via trigger.

------------------------------------------------------------------------
-- 1. widget_config_versions table
------------------------------------------------------------------------

CREATE TABLE widget_config_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  widget_config_id UUID NOT NULL REFERENCES widget_configs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  allowed_domains TEXT[] DEFAULT '{}',
  enable_structured_data BOOLEAN DEFAULT TRUE,
  structured_data_type TEXT DEFAULT 'LocalBusiness',
  entity_id UUID,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  change_note TEXT,
  change_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE widget_config_versions IS 'Immutable version snapshots of widget configurations for history and rollback';
COMMENT ON COLUMN widget_config_versions.version IS 'Monotonically increasing version number per widget';
COMMENT ON COLUMN widget_config_versions.config IS 'Complete JSONB config snapshot at this version';
COMMENT ON COLUMN widget_config_versions.change_summary IS 'Auto-generated description of what changed';
COMMENT ON COLUMN widget_config_versions.change_note IS 'Optional user-provided description of the change';

-- Indexes
CREATE UNIQUE INDEX idx_widget_config_versions_unique
  ON widget_config_versions(widget_config_id, version);

CREATE INDEX idx_widget_config_versions_widget_created
  ON widget_config_versions(widget_config_id, created_at DESC);

------------------------------------------------------------------------
-- 2. RLS policies
------------------------------------------------------------------------

ALTER TABLE widget_config_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view version history"
  ON widget_config_versions FOR SELECT TO authenticated
  USING (
    widget_config_id IN (
      SELECT wc.id FROM widget_configs wc
      WHERE wc.organization_id IN (
        SELECT organization_id FROM users WHERE id = get_current_user_id()
      )
    )
  );

CREATE POLICY "Service role full access on widget_config_versions"
  ON widget_config_versions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

------------------------------------------------------------------------
-- 3. Auto-prune trigger: keep max 50 versions per widget
------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION prune_widget_config_versions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM widget_config_versions
  WHERE id IN (
    SELECT id FROM widget_config_versions
    WHERE widget_config_id = NEW.widget_config_id
    ORDER BY version DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prune_widget_config_versions
  AFTER INSERT ON widget_config_versions
  FOR EACH ROW EXECUTE FUNCTION prune_widget_config_versions();
