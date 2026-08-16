-- Add global_slug column to branches for SEO-friendly, globally unique URLs
-- Pattern: {branch-slug}-{org-slug} (e.g. "boston-downtown-summit-mortgage-group")

-- 1. Add the column
ALTER TABLE branches ADD COLUMN IF NOT EXISTS global_slug TEXT;

-- 2. Backfill existing branches with global_slug = branch.slug || '-' || org.slug
DO $$
DECLARE
  branch_record RECORD;
  org_slug TEXT;
  candidate_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
  slug_exists BOOLEAN;
BEGIN
  FOR branch_record IN
    SELECT b.id, b.slug, b.organization_id
    FROM branches b
    WHERE b.global_slug IS NULL
      AND b.slug IS NOT NULL
      AND b.slug != ''
    ORDER BY b.created_at ASC
  LOOP
    -- Get the organization slug
    SELECT o.slug INTO org_slug
    FROM organizations o
    WHERE o.id = branch_record.organization_id;

    -- Skip if org has no slug
    IF org_slug IS NULL OR org_slug = '' THEN
      CONTINUE;
    END IF;

    -- Build candidate: branch-slug + org-slug
    candidate_slug := branch_record.slug || '-' || org_slug;

    -- Check uniqueness
    SELECT EXISTS(
      SELECT 1 FROM branches WHERE global_slug = candidate_slug AND id != branch_record.id
    ) INTO slug_exists;

    IF NOT slug_exists THEN
      final_slug := candidate_slug;
    ELSE
      -- Dedup with numeric suffix
      counter := 1;
      LOOP
        final_slug := candidate_slug || '-' || counter;
        SELECT EXISTS(
          SELECT 1 FROM branches WHERE global_slug = final_slug AND id != branch_record.id
        ) INTO slug_exists;
        EXIT WHEN NOT slug_exists OR counter >= 100;
        counter := counter + 1;
      END LOOP;

      -- Fallback: append timestamp
      IF slug_exists THEN
        final_slug := candidate_slug || '-' || extract(epoch from now())::bigint;
      END IF;
    END IF;

    UPDATE branches SET global_slug = final_slug WHERE id = branch_record.id;
  END LOOP;
END $$;

-- 3. Add unique index (partial - only non-null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_branches_global_slug
  ON branches(global_slug) WHERE global_slug IS NOT NULL;

-- 4. Add lookup index for fast slug resolution
CREATE INDEX IF NOT EXISTS idx_branches_global_slug_lookup
  ON branches(global_slug);
