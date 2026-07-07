-- Mirrors the production hardening applied to the Reviews Supabase project on
-- 2026-03-09. This closes direct anon submission bypasses for video
-- testimonials and enforces request/response invariants for all inserts.

CREATE OR REPLACE FUNCTION public.is_active_video_testimonial_upload_path(
  p_organization_id_text text,
  p_request_id_text text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_testimonial_requests r
    WHERE r.organization_id::text = p_organization_id_text
      AND r.id::text = p_request_id_text
      AND r.status = 'recording'::public.video_testimonial_request_status
      AND r.submitted_at IS NULL
      AND (r.expires_at IS NULL OR r.expires_at >= NOW())
  );
$$;

COMMENT ON FUNCTION public.is_active_video_testimonial_upload_path(text, text) IS
  'Returns true when a storage path maps to an active video testimonial request that is currently recording.';

REVOKE ALL ON FUNCTION public.is_active_video_testimonial_upload_path(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_active_video_testimonial_upload_path(text, text)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_valid_video_testimonial_response_submission(
  p_request_id uuid,
  p_organization_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.video_testimonial_requests r
    WHERE r.id = p_request_id
      AND r.organization_id = p_organization_id
      AND r.user_id = p_user_id
      AND r.status = 'recording'::public.video_testimonial_request_status
      AND r.submitted_at IS NULL
      AND (r.expires_at IS NULL OR r.expires_at >= NOW())
  );
$$;

COMMENT ON FUNCTION public.is_valid_video_testimonial_response_submission(uuid, uuid, uuid) IS
  'Returns true when a video testimonial response insert matches an active request owner and organization.';

REVOKE ALL ON FUNCTION public.is_valid_video_testimonial_response_submission(uuid, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_valid_video_testimonial_response_submission(uuid, uuid, uuid)
  TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public can upload video testimonials with valid token" ON storage.objects;

CREATE POLICY "Public can upload video testimonials with valid request path"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'video-testimonials'
  AND array_length(storage.foldername(name), 1) >= 2
  AND public.is_active_video_testimonial_upload_path(
    (storage.foldername(name))[1],
    (storage.foldername(name))[2]
  )
);

DROP POLICY IF EXISTS "public_submit_video_responses" ON public.video_testimonial_responses;

CREATE POLICY "public_submit_video_responses"
ON public.video_testimonial_responses
FOR INSERT
TO anon
WITH CHECK (
  public.is_valid_video_testimonial_response_submission(
    request_id,
    organization_id,
    user_id
  )
);

CREATE OR REPLACE FUNCTION public.enforce_video_testimonial_response_request_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request public.video_testimonial_requests%ROWTYPE;
BEGIN
  SELECT *
  INTO v_request
  FROM public.video_testimonial_requests
  WHERE id = NEW.request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid request_id %', NEW.request_id;
  END IF;

  IF NOT public.is_valid_video_testimonial_response_submission(
    NEW.request_id,
    NEW.organization_id,
    NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Response insert does not match an active request for request_id %', NEW.request_id;
  END IF;

  IF split_part(COALESCE(NEW.video_path, ''), '/', 1) IS DISTINCT FROM v_request.organization_id::text
     OR split_part(COALESCE(NEW.video_path, ''), '/', 2) IS DISTINCT FROM v_request.id::text THEN
    RAISE EXCEPTION 'video_path must be scoped to {organization_id}/{request_id}/...';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_video_testimonial_response_request_match() IS
  'Trigger guard that enforces request ownership and storage path invariants for video testimonial response inserts.';

DROP TRIGGER IF EXISTS trg_enforce_video_testimonial_response_request_match
  ON public.video_testimonial_responses;

CREATE TRIGGER trg_enforce_video_testimonial_response_request_match
BEFORE INSERT ON public.video_testimonial_responses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_video_testimonial_response_request_match();
