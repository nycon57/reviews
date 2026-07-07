-- Share Studio slug-canonical hardening
-- - adds presenter_user_id on proof_items
-- - backfills presenter owner for review/video sources
-- - deduplicates proof_items/proof_links for unique constraints
-- - enforces one source item + one active smart link

BEGIN;

ALTER TABLE proof_items
  ADD COLUMN IF NOT EXISTS presenter_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Backfill presenter owner from source tables
UPDATE proof_items pi
SET presenter_user_id = r.user_id,
    updated_at = NOW()
FROM reviews r
WHERE pi.source_type = 'review'
  AND pi.source_id = r.id
  AND pi.presenter_user_id IS NULL
  AND r.user_id IS NOT NULL;

UPDATE proof_items pi
SET presenter_user_id = vr.user_id,
    updated_at = NOW()
FROM video_testimonial_responses vr
WHERE pi.source_type = 'video_testimonial'
  AND pi.source_id = vr.id
  AND pi.presenter_user_id IS NULL
  AND vr.user_id IS NOT NULL;

-- Deduplicate proof_items by (organization_id, source_type, source_id)
CREATE TEMP TABLE tmp_proof_item_dupes AS
WITH ranked AS (
  SELECT
    id,
    organization_id,
    source_type,
    source_id,
    FIRST_VALUE(id) OVER (
      PARTITION BY organization_id, source_type, source_id
      ORDER BY created_at ASC, id ASC
    ) AS canonical_id,
    ROW_NUMBER() OVER (
      PARTITION BY organization_id, source_type, source_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM proof_items
  WHERE source_id IS NOT NULL
)
SELECT id AS duplicate_id, canonical_id
FROM ranked
WHERE rn > 1;

UPDATE proof_links pl
SET proof_item_id = d.canonical_id,
    updated_at = NOW()
FROM tmp_proof_item_dupes d
WHERE pl.proof_item_id = d.duplicate_id;

UPDATE proof_assets pa
SET proof_item_id = d.canonical_id,
    updated_at = NOW()
FROM tmp_proof_item_dupes d
WHERE pa.proof_item_id = d.duplicate_id;

UPDATE proof_render_jobs prj
SET proof_item_id = d.canonical_id,
    updated_at = NOW()
FROM tmp_proof_item_dupes d
WHERE prj.proof_item_id = d.duplicate_id;

UPDATE proof_item_edits pie
SET proof_item_id = d.canonical_id
FROM tmp_proof_item_dupes d
WHERE pie.proof_item_id = d.duplicate_id;

DELETE FROM proof_items pi
USING tmp_proof_item_dupes d
WHERE pi.id = d.duplicate_id;

DROP TABLE tmp_proof_item_dupes;

-- Deduplicate active links per proof item (keep most recently active/published)
CREATE TEMP TABLE tmp_active_link_dupes AS
WITH ranked_links AS (
  SELECT
    id,
    proof_item_id,
    ROW_NUMBER() OVER (
      PARTITION BY proof_item_id
      ORDER BY
        published DESC,
        published_at DESC NULLS LAST,
        updated_at DESC,
        created_at DESC,
        id DESC
    ) AS rn
  FROM proof_links
  WHERE archived_at IS NULL
)
SELECT id
FROM ranked_links
WHERE rn > 1;

UPDATE proof_links pl
SET archived_at = COALESCE(pl.archived_at, NOW()),
    published = FALSE,
    updated_at = NOW()
FROM tmp_active_link_dupes d
WHERE pl.id = d.id;

DROP TABLE tmp_active_link_dupes;

CREATE INDEX IF NOT EXISTS idx_proof_items_presenter_user_id
  ON proof_items(presenter_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_items_org_source_unique
  ON proof_items(organization_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_proof_links_single_active_per_item
  ON proof_links(proof_item_id)
  WHERE archived_at IS NULL;

COMMIT;
