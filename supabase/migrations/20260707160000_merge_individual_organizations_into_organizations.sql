-- Merge individual_organizations into organizations (ADR 0006)
--
-- Every account now has exactly one `organizations` row; `account_type`
-- ('individual' | 'enterprise') is the discriminator. This folds the separate
-- `individual_organizations` table back into `organizations`, repoints
-- `users.organization_id`, and drops the individual_* tables/columns.
--
-- Two populations exist before this runs:
--   * Legacy individuals — created before the individual_* tables. They already
--     have BOTH an organizations row (account_type='individual', same id) AND an
--     individual_organizations row (a copy), with users.organization_id already
--     equal to users.individual_organization_id. Billing wrote the real
--     subscription_tier to their organizations row.
--   * Self-serve individuals — created after 20260224000001. They have ONLY an
--     individual_organizations row; users.organization_id IS NULL and there is
--     no organizations row for them (subscription_tier is therefore 'basic').
--
-- Defensive + idempotent: every step is guarded so this is a safe no-op in
-- environments where individual_organizations was never created, and safe to
-- re-run. The PM applies this directly to production.

BEGIN;

DO $$
BEGIN
  IF to_regclass('public.individual_organizations') IS NULL THEN
    RAISE NOTICE 'individual_organizations does not exist — merge is a no-op';
    RETURN;
  END IF;

  -- 1. Create an organizations row for every individual_organizations row that
  --    does not already have one (the self-serve population). Legacy individuals
  --    already have a same-id organizations row and are skipped here.
  --    subscription_tier defaults to 'basic' — self-serve individuals never had
  --    an organizations row for billing to write a real tier to.
  INSERT INTO organizations (
    id, name, slug, account_type, subscription_tier,
    website_url, phone, email, logo_url, industry,
    company_address, onboarding_status, created_at, updated_at
  )
  SELECT
    io.id,
    io.name,
    -- organizations.slug is UNIQUE. If some other org already claims this slug,
    -- suffix with a short id fragment. Individual org slugs are not used for any
    -- public page (getAllOrganizationSlugs excludes account_type='individual'),
    -- so the exact value is cosmetic — uniqueness is all that matters.
    CASE
      WHEN EXISTS (
        SELECT 1 FROM organizations o2 WHERE o2.slug = io.slug AND o2.id <> io.id
      )
      THEN io.slug || '-' || substr(io.id::text, 1, 8)
      ELSE io.slug
    END,
    'individual',
    'basic',
    io.website_url, io.phone, io.email, io.logo_url, io.industry,
    io.address, io.onboarding_status, io.created_at, io.updated_at
  FROM individual_organizations io
  WHERE NOT EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = io.id
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Legacy individuals: reconcile the existing organizations row with the
  --    individual_organizations copy. Onboarding wrote progress to
  --    individual_organizations, so carry onboarding_status forward. Do NOT
  --    touch subscription_tier — the organizations row holds the real, billed
  --    tier and must be preserved.
  UPDATE organizations o
  SET
    account_type      = 'individual',
    onboarding_status = COALESCE(io.onboarding_status, o.onboarding_status),
    name              = COALESCE(o.name, io.name),
    logo_url          = COALESCE(o.logo_url, io.logo_url),
    website_url       = COALESCE(o.website_url, io.website_url),
    phone             = COALESCE(o.phone, io.phone),
    email             = COALESCE(o.email, io.email),
    industry          = COALESCE(o.industry, io.industry),
    updated_at        = now()
  FROM individual_organizations io
  WHERE o.id = io.id;

  -- 3. Repoint users onto their (now-guaranteed) organizations row. Legacy
  --    individuals already have organization_id set; this only fills the
  --    self-serve population where organization_id was NULL.
  UPDATE users u
  SET organization_id = u.individual_organization_id
  WHERE u.organization_id IS NULL
    AND u.individual_organization_id IS NOT NULL;
END $$;

-- 4. Ensure every ACTIVE user resolves to an organization. Any active user with
--    no org at all (data corruption / partially-failed signup) gets a minimal
--    individual organization so the single-path access lookup can never return
--    null for a live account. Zero-orphan case: the loop body simply never runs.
DO $$
DECLARE
  r RECORD;
  new_org_id UUID;
  base_slug TEXT;
  final_slug TEXT;
  n INT;
  has_indiv_col BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'individual_organization_id'
  ) INTO has_indiv_col;

  FOR r IN
    SELECT id, full_name, email
    FROM users
    WHERE is_active = true
      AND organization_id IS NULL
      -- If the column still exists, only treat as orphan when it is also null
      -- (step 3 already repointed anyone who had an individual org).
      AND (NOT has_indiv_col OR individual_organization_id IS NULL)
  LOOP
    base_slug := 'account-' || substr(r.id::text, 1, 8);
    final_slug := base_slug;
    n := 0;
    WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = final_slug) LOOP
      n := n + 1;
      final_slug := base_slug || '-' || n;
    END LOOP;

    INSERT INTO organizations (
      id, name, slug, account_type, subscription_tier, onboarding_status,
      created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      COALESCE(NULLIF(r.full_name, ''), r.email, 'Account'),
      final_slug,
      'individual',
      'basic',
      'completed',
      now(),
      now()
    )
    RETURNING id INTO new_org_id;

    UPDATE users SET organization_id = new_org_id WHERE id = r.id;
  END LOOP;
END $$;

-- 5. Teardown ordering (verified against prod dependencies):
--    the users FK CONSTRAINTS block the table drops, and the tables' RLS
--    policies block the users COLUMN drops — so: constraints, tables, columns.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_individual_branch_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_individual_organization_id_fkey;

DROP TABLE IF EXISTS individual_branches;
DROP TABLE IF EXISTS individual_organizations;

ALTER TABLE users DROP COLUMN IF EXISTS individual_branch_id;
ALTER TABLE users DROP COLUMN IF EXISTS individual_organization_id;

-- Trigger function was created solely for the two individual_* tables; their
-- triggers are gone with the tables, so the function is now unreferenced.
DROP FUNCTION IF EXISTS update_individual_org_updated_at();

COMMIT;
