-- Rename contacts → employees for semantic clarity
-- "Contacts" implies clients/customers; "Employees" matches the actual use case (EX survey targeting)

-- 1. Rename table
ALTER TABLE contacts RENAME TO employees;

-- 2. Rename constraints
ALTER TABLE employees RENAME CONSTRAINT contacts_pkey TO employees_pkey;
ALTER TABLE employees RENAME CONSTRAINT contacts_organization_id_email_key TO employees_organization_id_email_key;

-- 3. Recreate indexes with new names
DROP INDEX IF EXISTS idx_contacts_org;
DROP INDEX IF EXISTS idx_contacts_user;
DROP INDEX IF EXISTS idx_contacts_department;
CREATE INDEX idx_employees_org ON employees(organization_id);
CREATE INDEX idx_employees_user ON employees(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_employees_department ON employees(organization_id, department) WHERE department IS NOT NULL;

-- 4. RLS policies: drop old, create new
DROP POLICY IF EXISTS "contacts_org_read" ON employees;
DROP POLICY IF EXISTS "contacts_org_write" ON employees;

CREATE POLICY "employees_org_read" ON employees
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "employees_org_write" ON employees
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- 5. Trigger: drop old, create new
DROP TRIGGER IF EXISTS contacts_updated_at ON employees;
CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. FK columns on ex_survey_invitations
ALTER TABLE ex_survey_invitations RENAME COLUMN contact_id TO employee_id;
ALTER TABLE ex_survey_invitations RENAME COLUMN contact_email TO employee_email;
