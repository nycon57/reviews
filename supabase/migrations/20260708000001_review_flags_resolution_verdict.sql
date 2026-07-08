-- Staff dispute audit trail: keep the existing status vocabulary for behavior,
-- and add an explicit resolution verdict for reporting.

ALTER TABLE review_flags
  ADD COLUMN IF NOT EXISTS resolution_verdict TEXT;

ALTER TABLE review_flags
  DROP CONSTRAINT IF EXISTS review_flags_resolution_verdict_check;

ALTER TABLE review_flags
  ADD CONSTRAINT review_flags_resolution_verdict_check
  CHECK (
    resolution_verdict IS NULL
    OR resolution_verdict IN ('upheld', 'dismissed')
  );

UPDATE review_flags
SET resolution_verdict = CASE
  WHEN status = 'actioned' THEN 'upheld'
  WHEN status = 'dismissed' THEN 'dismissed'
  ELSE resolution_verdict
END
WHERE resolution_verdict IS NULL
  AND status IN ('actioned', 'dismissed');

CREATE INDEX IF NOT EXISTS idx_review_flags_platform_open
  ON review_flags (status, created_at ASC)
  WHERE status = 'pending'
    AND escalated_to_platform_at IS NOT NULL;
