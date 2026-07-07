-- Rewrite branch public URLs to use short, name-based slugs.
-- Old pattern: {branch-slug}-{org-slug}
-- New pattern: {branch-slug}

DO $$
DECLARE
  branch_record RECORD;
  final_slug TEXT;
  counter INTEGER;
  slug_exists BOOLEAN;
BEGIN
  FOR branch_record IN
    SELECT id, slug
    FROM branches
    WHERE slug IS NOT NULL
      AND slug != ''
    ORDER BY created_at ASC, id ASC
  LOOP
    final_slug := branch_record.slug;

    SELECT EXISTS(
      SELECT 1
      FROM branches
      WHERE global_slug = final_slug
        AND id != branch_record.id
    ) INTO slug_exists;

    IF slug_exists THEN
      counter := 1;

      LOOP
        final_slug := branch_record.slug || '-' || counter;

        SELECT EXISTS(
          SELECT 1
          FROM branches
          WHERE global_slug = final_slug
            AND id != branch_record.id
        ) INTO slug_exists;

        EXIT WHEN NOT slug_exists OR counter >= 1000;
        counter := counter + 1;
      END LOOP;
    END IF;

    UPDATE branches
    SET global_slug = final_slug
    WHERE id = branch_record.id
      AND global_slug IS DISTINCT FROM final_slug;
  END LOOP;
END $$;
