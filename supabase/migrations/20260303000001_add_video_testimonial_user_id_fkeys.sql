-- Add missing foreign key constraints on user_id for video testimonial tables.
-- PostgREST requires FK relationships to resolve join hints like `users!user_id`.
-- Using NOT VALID to skip checking existing rows (some seed/test data may reference
-- non-existent users). New inserts/updates will be enforced. PostgREST still
-- recognises NOT VALID FKs in its schema cache for join resolution.

ALTER TABLE video_testimonial_requests
  ADD CONSTRAINT video_testimonial_requests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;

ALTER TABLE video_testimonial_responses
  ADD CONSTRAINT video_testimonial_responses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
