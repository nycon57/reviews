-- Improves lookup performance for active impersonation sessions and audit joins.
CREATE INDEX IF NOT EXISTS idx_sessions_impersonated_by
  ON sessions (impersonated_by)
  WHERE impersonated_by IS NOT NULL;
