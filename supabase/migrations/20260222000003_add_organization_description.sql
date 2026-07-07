-- Add description column to organizations for short bio/about text
ALTER TABLE organizations ADD COLUMN description TEXT;

-- Enforce 300 character max at DB level
ALTER TABLE organizations ADD CONSTRAINT organizations_description_max_length
  CHECK (char_length(description) <= 300);

-- Backfill from settings JSONB where description was previously stored
UPDATE organizations
SET description = (settings->>'description')
WHERE settings->>'description' IS NOT NULL
  AND (settings->>'description') <> '';
