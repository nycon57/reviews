-- Add new lifecycle states for video testimonial requests.
-- NOTE: enum values are introduced in a dedicated migration because Postgres
-- requires a commit before newly added enum values can be referenced.

ALTER TYPE video_testimonial_request_status ADD VALUE IF NOT EXISTS 'queued';
ALTER TYPE video_testimonial_request_status ADD VALUE IF NOT EXISTS 'completed';
