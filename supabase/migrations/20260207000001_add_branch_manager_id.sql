-- Add manager_id FK to branches table
-- Replaces freeform manager_name/manager_email with a reference to an actual user

ALTER TABLE branches ADD COLUMN manager_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_branches_manager_id ON branches (manager_id);

-- Backfill: match manager_name to users.full_name where the user belongs to the same branch and is active
UPDATE branches b
SET manager_id = u.id
FROM users u
WHERE b.manager_name IS NOT NULL
  AND u.full_name = b.manager_name
  AND u.branch_id = b.id
  AND u.is_active = true;
