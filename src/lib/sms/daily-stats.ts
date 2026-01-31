import type { UntypedSupabaseClient } from "@/lib/supabase/admin";

/**
 * Atomically increment a column in sms_daily_stats using the RPC.
 * Falls back to a select-then-upsert pattern if the RPC is unavailable.
 */
export async function incrementDailyStat(
  supabase: UntypedSupabaseClient,
  organizationId: string,
  loanOfficerId: string | null,
  date: string,
  column: string
): Promise<void> {
  const { error } = await supabase.rpc("increment_sms_daily_stat", {
    p_organization_id: organizationId,
    p_loan_officer_id: loanOfficerId,
    p_date: date,
    p_column_name: column,
  });

  if (!error) return;

  // 42883 = function does not exist -- fall back to non-atomic path
  if (error.code === "42883") {
    await fallbackIncrementStat(
      supabase,
      organizationId,
      loanOfficerId,
      date,
      column
    );
    return;
  }

  console.error("[SMS Daily Stats] RPC increment failed:", error.message);
}

/**
 * Non-atomic fallback: select the existing row, then update or insert.
 * Handles concurrent-insert races via unique-constraint retry.
 */
async function fallbackIncrementStat(
  supabase: UntypedSupabaseClient,
  organizationId: string,
  loanOfficerId: string | null,
  date: string,
  column: string
): Promise<void> {
  const matchFilter = supabase
    .from("sms_daily_stats")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("date", date);

  const query = loanOfficerId
    ? matchFilter.eq("loan_officer_id", loanOfficerId)
    : matchFilter.is("loan_officer_id", null);

  const { data: existing, error: selectError } = await query.maybeSingle();

  if (selectError) {
    console.error("[SMS Daily Stats] Select failed:", selectError.message);
    return;
  }

  if (existing) {
    // Read the current value so we can increment it
    const { data: row, error: readError } = await supabase
      .from("sms_daily_stats")
      .select(column)
      .eq("id", existing.id)
      .single();

    if (readError) {
      console.error("[SMS Daily Stats] Read failed:", readError.message);
      return;
    }

    const currentValue =
      ((row as unknown as Record<string, unknown>)[column] as number) ?? 0;

    const { error } = await supabase
      .from("sms_daily_stats")
      .update({ [column]: currentValue + 1 })
      .eq("id", existing.id);

    if (error) {
      console.error("[SMS Daily Stats] Update failed:", error.message);
    }
    return;
  }

  // No existing row -- insert a new one
  const { error: insertError } = await supabase
    .from("sms_daily_stats")
    .insert({
      organization_id: organizationId,
      loan_officer_id: loanOfficerId,
      date,
      [column]: 1,
    });

  if (!insertError) return;

  // 23505 = unique constraint violation -- another request inserted first
  if (insertError.code === "23505") {
    await fallbackIncrementStat(
      supabase,
      organizationId,
      loanOfficerId,
      date,
      column
    );
    return;
  }

  console.error("[SMS Daily Stats] Insert failed:", insertError.message);
}
