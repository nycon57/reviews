-- Video testimonial hardening
-- Adds legal-grade consent audit records, request lifecycle diagnostics,
-- submission idempotency, and webhook event deduplication primitives.

-- ============================================================================
-- 1) REQUEST LIFECYCLE HARDENING
-- ============================================================================

-- Enum values `queued` and `completed` are added in the preceding migration:
-- 20260301000003_video_testimonial_request_status_enums.sql

ALTER TABLE video_testimonial_requests
  ADD COLUMN IF NOT EXISTS last_transition_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_transition_source TEXT,
  ADD COLUMN IF NOT EXISTS last_transition_reason TEXT;

UPDATE video_testimonial_requests
SET
  last_transition_at = COALESCE(last_transition_at, updated_at, created_at, NOW()),
  last_transition_source = COALESCE(last_transition_source, 'legacy_migration')
WHERE last_transition_at IS NULL OR last_transition_source IS NULL;

ALTER TABLE video_testimonial_requests
  ALTER COLUMN last_transition_at SET DEFAULT NOW(),
  ALTER COLUMN last_transition_source SET DEFAULT 'system';

COMMENT ON COLUMN video_testimonial_requests.last_transition_at IS
  'Timestamp of the most recent request lifecycle transition';
COMMENT ON COLUMN video_testimonial_requests.last_transition_source IS
  'Source that triggered the lifecycle transition (public_form, webhook, queue, admin)';
COMMENT ON COLUMN video_testimonial_requests.last_transition_reason IS
  'Optional reason/details for the latest lifecycle transition';

CREATE INDEX IF NOT EXISTS idx_video_testimonial_requests_org_status_expires
  ON video_testimonial_requests (organization_id, status, expires_at)
  WHERE status IN ('pending', 'queued', 'sent', 'opened', 'recording');

-- Keep transition fields synchronized whenever status changes.
CREATE OR REPLACE FUNCTION set_video_testimonial_request_transition_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.last_transition_at := NOW();
    IF NEW.last_transition_source IS NULL OR btrim(NEW.last_transition_source) = '' THEN
      NEW.last_transition_source := 'system';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_video_testimonial_request_transition_defaults
  ON video_testimonial_requests;

CREATE TRIGGER trg_video_testimonial_request_transition_defaults
  BEFORE UPDATE ON video_testimonial_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_video_testimonial_request_transition_defaults();

-- Optional state machine function for transactional status transitions.
CREATE OR REPLACE FUNCTION transition_video_testimonial_request(
  p_request_id UUID,
  p_next_status video_testimonial_request_status,
  p_source TEXT DEFAULT 'system',
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_status video_testimonial_request_status;
  v_valid BOOLEAN := FALSE;
BEGIN
  SELECT status
  INTO v_current_status
  FROM video_testimonial_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_current_status = p_next_status THEN
    UPDATE video_testimonial_requests
    SET
      last_transition_at = NOW(),
      last_transition_source = COALESCE(NULLIF(p_source, ''), 'system'),
      last_transition_reason = p_reason,
      updated_at = NOW()
    WHERE id = p_request_id;
    RETURN TRUE;
  END IF;

  v_valid := CASE v_current_status
    WHEN 'pending' THEN p_next_status IN ('queued', 'sent', 'cancelled', 'failed', 'expired')
    WHEN 'queued' THEN p_next_status IN ('sent', 'cancelled', 'failed', 'expired')
    WHEN 'sent' THEN p_next_status IN ('opened', 'recording', 'submitted', 'cancelled', 'failed', 'expired')
    WHEN 'opened' THEN p_next_status IN ('recording', 'submitted', 'cancelled', 'failed', 'expired')
    WHEN 'recording' THEN p_next_status IN ('submitted', 'cancelled', 'failed', 'expired')
    WHEN 'submitted' THEN p_next_status IN ('completed')
    ELSE FALSE
  END;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Invalid video testimonial request transition: % -> %',
      v_current_status, p_next_status;
  END IF;

  UPDATE video_testimonial_requests
  SET
    status = p_next_status,
    last_transition_at = NOW(),
    last_transition_source = COALESCE(NULLIF(p_source, ''), 'system'),
    last_transition_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_request_id;

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 2) RESPONSE CONSENT + IDEMPOTENCY HARDENING
-- ============================================================================

ALTER TABLE video_testimonial_responses
  ADD COLUMN IF NOT EXISTS submission_idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS upload_session_id TEXT,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS nil_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS usage_rights_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ai_text_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS consent_captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consent_source TEXT,
  ADD COLUMN IF NOT EXISTS processing_error_code TEXT,
  ADD COLUMN IF NOT EXISTS processing_error_stage TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS media_codec TEXT;

COMMENT ON COLUMN video_testimonial_responses.submission_idempotency_key IS
  'Client-provided key used to make public testimonial submission idempotent';
COMMENT ON COLUMN video_testimonial_responses.upload_session_id IS
  'Upload session identifier for resumable/retriable public uploads';
COMMENT ON COLUMN video_testimonial_responses.consent_version IS
  'Version identifier of legal consent text accepted by customer';
COMMENT ON COLUMN video_testimonial_responses.nil_consent_given IS
  'Explicit consent to use customer name/image/likeness/voice';
COMMENT ON COLUMN video_testimonial_responses.usage_rights_consent_given IS
  'Explicit consent for usage/distribution rights';
COMMENT ON COLUMN video_testimonial_responses.ai_text_consent_given IS
  'Explicit consent for AI-generated written testimonial from transcript';
COMMENT ON COLUMN video_testimonial_responses.marketing_consent_given IS
  'Optional marketing communications consent';
COMMENT ON COLUMN video_testimonial_responses.consent_captured_at IS
  'Timestamp when required consents were captured';
COMMENT ON COLUMN video_testimonial_responses.consent_source IS
  'Source flow where consent was captured (public_form, import, admin)';
COMMENT ON COLUMN video_testimonial_responses.processing_error_code IS
  'Stable machine-friendly processing failure code';
COMMENT ON COLUMN video_testimonial_responses.processing_error_stage IS
  'Processing stage where the failure occurred (upload/transcription/generation)';
COMMENT ON COLUMN video_testimonial_responses.retry_count IS
  'Retry attempts for asynchronous processing operations';
COMMENT ON COLUMN video_testimonial_responses.media_codec IS
  'Detected codec details from uploaded media when available';

-- Backfill existing rows so new checks remain backward-compatible.
UPDATE video_testimonial_responses r
SET
  consent_version = COALESCE(r.consent_version, 'legacy_v1'),
  nil_consent_given = COALESCE(
    r.nil_consent_given,
    COALESCE((req.source_metadata ->> 'consent_video_recording')::boolean, r.consent_given, TRUE)
  ),
  usage_rights_consent_given = COALESCE(
    r.usage_rights_consent_given,
    COALESCE((req.source_metadata ->> 'consent_usage_rights')::boolean, r.consent_given, TRUE)
  ),
  ai_text_consent_given = COALESCE(
    r.ai_text_consent_given,
    COALESCE((req.source_metadata ->> 'consent_ai_text_generation')::boolean, TRUE)
  ),
  marketing_consent_given = COALESCE(
    r.marketing_consent_given,
    COALESCE((req.source_metadata ->> 'consent_marketing')::boolean, r.marketing_consent, FALSE)
  ),
  consent_captured_at = COALESCE(
    r.consent_captured_at,
    NULLIF(req.source_metadata ->> 'consent_timestamp', '')::timestamptz,
    r.consent_timestamp,
    r.submitted_at,
    r.created_at
  ),
  consent_source = COALESCE(r.consent_source, 'legacy_migration')
FROM video_testimonial_requests req
WHERE req.id = r.request_id;

ALTER TABLE video_testimonial_responses
  DROP CONSTRAINT IF EXISTS check_video_testimonial_submission_consents,
  ADD CONSTRAINT check_video_testimonial_submission_consents
  CHECK (
    submitted_at IS NULL
    OR (
      nil_consent_given = TRUE
      AND usage_rights_consent_given = TRUE
      AND ai_text_consent_given = TRUE
      AND consent_version IS NOT NULL
      AND consent_captured_at IS NOT NULL
    )
  );

ALTER TABLE video_testimonial_responses
  DROP CONSTRAINT IF EXISTS check_video_testimonial_retry_count_non_negative,
  ADD CONSTRAINT check_video_testimonial_retry_count_non_negative
  CHECK (retry_count >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_testimonial_responses_submission_key
  ON video_testimonial_responses (submission_idempotency_key)
  WHERE submission_idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_video_testimonial_responses_request_submission_unique
  ON video_testimonial_responses (request_id)
  WHERE submission_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_org_approval_created
  ON video_testimonial_responses (organization_id, approval_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_testimonial_responses_processing_stage
  ON video_testimonial_responses (organization_id, processing_error_stage, retry_count)
  WHERE processing_error_stage IS NOT NULL;

-- Enforce required consent presence before request status can move to submitted/completed.
CREATE OR REPLACE FUNCTION enforce_video_testimonial_request_submission_consents()
RETURNS TRIGGER AS $$
DECLARE
  v_has_valid_response BOOLEAN;
BEGIN
  IF NEW.status IN ('submitted', 'completed')
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    SELECT EXISTS (
      SELECT 1
      FROM video_testimonial_responses r
      WHERE r.request_id = NEW.id
        AND r.nil_consent_given = TRUE
        AND r.usage_rights_consent_given = TRUE
        AND r.ai_text_consent_given = TRUE
        AND r.consent_version IS NOT NULL
        AND r.consent_captured_at IS NOT NULL
      LIMIT 1
    )
    INTO v_has_valid_response;

    IF NOT v_has_valid_response THEN
      RAISE EXCEPTION
        'Cannot transition request % to %, missing required consent records',
        NEW.id, NEW.status;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_video_testimonial_request_submission_consents
  ON video_testimonial_requests;

CREATE TRIGGER trg_enforce_video_testimonial_request_submission_consents
  BEFORE UPDATE OF status ON video_testimonial_requests
  FOR EACH ROW
  EXECUTE FUNCTION enforce_video_testimonial_request_submission_consents();

-- ============================================================================
-- 3) IMMUTABLE CONSENT EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS testimonial_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES video_testimonial_requests(id) ON DELETE CASCADE,
  response_id UUID REFERENCES video_testimonial_responses(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL CHECK (
    consent_type IN (
      'name_image_likeness_voice',
      'usage_rights',
      'ai_text_generation',
      'marketing'
    )
  ),
  granted BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  legal_text_snapshot TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  locale TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_testimonial_consent_events_request_created
  ON testimonial_consent_events (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_testimonial_consent_events_response
  ON testimonial_consent_events (response_id)
  WHERE response_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_testimonial_consent_events_type
  ON testimonial_consent_events (consent_type, granted, created_at DESC);

COMMENT ON TABLE testimonial_consent_events IS
  'Immutable audit trail of legal consent decisions for video testimonials';

ALTER TABLE testimonial_consent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_full_access_testimonial_consent_events"
  ON testimonial_consent_events;

CREATE POLICY "service_role_full_access_testimonial_consent_events"
  ON testimonial_consent_events
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- 4) EMAIL TRACKING ATTRIBUTION + PROVIDER EVENT DEDUPE
-- ============================================================================

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES video_testimonial_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS provider_event_type TEXT;

COMMENT ON COLUMN email_logs.request_id IS
  'Optional linked video_testimonial_request identifier for strict webhook attribution';
COMMENT ON COLUMN email_logs.provider_event_id IS
  'Unique provider webhook event ID used for idempotent event processing';
COMMENT ON COLUMN email_logs.provider_event_type IS
  'Raw provider webhook event type for diagnostics';

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_provider_event_unique
  ON email_logs (provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_request_status_created
  ON email_logs (request_id, status, created_at DESC)
  WHERE request_id IS NOT NULL;

-- ============================================================================
-- 5) RETENTION / MAINTENANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_video_testimonial_artifacts(
  p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_last_delete_count INTEGER := 0;
BEGIN
  DELETE FROM video_testimonial_queue
  WHERE status IN ('sent', 'failed', 'cancelled')
    AND created_at < NOW() - make_interval(days => GREATEST(p_retention_days, 1));

  GET DIAGNOSTICS v_last_delete_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_last_delete_count;

  DELETE FROM video_testimonial_queue q
  WHERE NOT EXISTS (
    SELECT 1
    FROM video_testimonial_requests r
    WHERE r.id = q.request_id
  );

  GET DIAGNOSTICS v_last_delete_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_last_delete_count;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_video_testimonial_artifacts(INTEGER) IS
  'Removes stale video testimonial queue artifacts and orphaned queue rows.';
