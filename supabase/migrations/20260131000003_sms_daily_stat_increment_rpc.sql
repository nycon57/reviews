-- Atomic increment for sms_daily_stats counters.
-- Prevents race conditions when multiple webhooks fire concurrently.
CREATE OR REPLACE FUNCTION increment_sms_daily_stat(
  p_organization_id uuid,
  p_loan_officer_id uuid DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE,
  p_column_name text DEFAULT 'delivered'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate column name to prevent SQL injection
  IF p_column_name NOT IN ('sent', 'delivered', 'failed', 'replied', 'opted_out') THEN
    RAISE EXCEPTION 'Invalid column name: %', p_column_name;
  END IF;

  -- Atomic upsert with increment
  IF p_loan_officer_id IS NULL THEN
    EXECUTE format(
      'INSERT INTO sms_daily_stats (organization_id, loan_officer_id, date, %I)
       VALUES ($1, NULL, $2, 1)
       ON CONFLICT (organization_id, date) WHERE loan_officer_id IS NULL
       DO UPDATE SET %I = sms_daily_stats.%I + 1',
      p_column_name, p_column_name, p_column_name
    ) USING p_organization_id, p_date;
  ELSE
    EXECUTE format(
      'INSERT INTO sms_daily_stats (organization_id, loan_officer_id, date, %I)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (organization_id, loan_officer_id, date)
       DO UPDATE SET %I = sms_daily_stats.%I + 1',
      p_column_name, p_column_name, p_column_name
    ) USING p_organization_id, p_loan_officer_id, p_date;
  END IF;
END;
$$;
