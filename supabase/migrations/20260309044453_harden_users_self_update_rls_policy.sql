-- Mirrors the production hardening applied to the Reviews Supabase project on
-- 2026-03-09. This restricts direct user self-updates to the existing
-- self-service profile/settings fields instead of allowing arbitrary row
-- mutation through the Better Auth self-update policy.

CREATE OR REPLACE FUNCTION public.can_update_own_user_profile(
  target_user_id uuid,
  target_user jsonb
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH allowed_columns(columns) AS (
    VALUES (
      ARRAY[
        'full_name',
        'avatar_url',
        'photo_url',
        'phone',
        'title',
        'bio',
        'personal_website_url',
        'linkedin_url',
        'zillow_profile_url',
        'facebook_url',
        'instagram_url',
        'twitter_url',
        'timezone',
        'banner_url',
        'cta_button_text',
        'cta_button_url',
        'hire_date',
        'industry',
        'nmls_id',
        'address',
        'notification_preferences',
        'receive_notifications',
        'auto_request_reviews',
        'updated_at'
      ]::text[]
    )
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.users current_user_row
    CROSS JOIN allowed_columns
    WHERE current_user_row.id = get_current_user_id()
      AND current_user_row.id = target_user_id
      AND (target_user - allowed_columns.columns) = (to_jsonb(current_user_row) - allowed_columns.columns)
  );
$$;

REVOKE ALL ON FUNCTION public.can_update_own_user_profile(uuid, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.can_update_own_user_profile(uuid, jsonb) TO authenticated;

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;

CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = get_current_user_id())
WITH CHECK (public.can_update_own_user_profile(id, to_jsonb(users.*)));
