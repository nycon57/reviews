-- Drop FK from users.department_id (don't drop column yet — may have data)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_id_fkey;

-- Comment departments table as deprecated
COMMENT ON TABLE departments IS 'DEPRECATED: Use contacts.department (free-text) instead';

-- Drop ex_metrics_snapshots (dead code)
DROP TABLE IF EXISTS ex_metrics_snapshots;
