-- Backfill slugs for existing users
-- Generates SEO-friendly slugs from full_name with deduplication

DO $$
DECLARE
  user_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER;
  slug_exists BOOLEAN;
BEGIN
  -- Loop through all users without slugs who have a full_name
  FOR user_record IN
    SELECT id, full_name
    FROM users
    WHERE slug IS NULL
      AND full_name IS NOT NULL
      AND full_name != ''
    ORDER BY created_at ASC  -- Process oldest first for deterministic slugs
  LOOP
    -- Generate base slug from full_name
    -- 1. Lowercase
    -- 2. Replace non-alphanumeric with hyphens
    -- 3. Collapse multiple hyphens
    -- 4. Trim leading/trailing hyphens
    base_slug := regexp_replace(
      regexp_replace(
        regexp_replace(
          lower(user_record.full_name),
          '[^a-z0-9\s-]', '', 'g'
        ),
        '[\s_]+', '-', 'g'
      ),
      '-+', '-', 'g'
    );
    base_slug := trim(both '-' from base_slug);

    -- Limit length
    IF length(base_slug) > 100 THEN
      base_slug := left(base_slug, 100);
    END IF;

    -- Skip if we can't generate a valid slug
    IF base_slug IS NULL OR base_slug = '' THEN
      CONTINUE;
    END IF;

    -- Check if base slug is available
    SELECT EXISTS(SELECT 1 FROM users WHERE slug = base_slug) INTO slug_exists;

    IF NOT slug_exists THEN
      final_slug := base_slug;
    ELSE
      -- Find unique slug with numeric suffix
      counter := 1;
      LOOP
        final_slug := base_slug || '-' || counter;
        SELECT EXISTS(SELECT 1 FROM users WHERE slug = final_slug) INTO slug_exists;
        EXIT WHEN NOT slug_exists OR counter >= 100;
        counter := counter + 1;
      END LOOP;

      -- Fallback if we somehow hit 100 duplicates
      IF slug_exists THEN
        final_slug := base_slug || '-' || extract(epoch from now())::bigint;
      END IF;
    END IF;

    -- Update the user with the generated slug
    UPDATE users SET slug = final_slug WHERE id = user_record.id;
  END LOOP;
END $$;

-- Note: We intentionally keep slug nullable for users without full_name
-- Those users need to set a name before their profile can be public
