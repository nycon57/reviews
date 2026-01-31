-------------------------------------------------------------------------
-- RPC: increment_short_link_click
-- Atomically increments click_count and sets timestamps.
-- Called by the redirect API route for concurrency-safe click tracking.
-------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION increment_short_link_click(
  p_short_code TEXT,
  p_now TIMESTAMPTZ
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sms_short_links
  SET
    click_count = click_count + 1,
    first_clicked_at = COALESCE(first_clicked_at, p_now),
    last_clicked_at = p_now
  WHERE short_code = p_short_code;
END;
$$;

-- Grant execute to service_role (used by admin client)
GRANT EXECUTE ON FUNCTION increment_short_link_click(TEXT, TIMESTAMPTZ)
  TO service_role;
