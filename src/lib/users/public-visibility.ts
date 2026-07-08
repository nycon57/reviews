type PublicProfessionalQuery<T> = {
  eq(column: string, value: unknown): T;
  neq(column: string, value: unknown): T;
  is(column: string, value: boolean | null): T;
};

/**
 * Show individual account owners (their own admin) alongside enterprise
 * professionals, while hiding enterprise admins (org account managers, not
 * professionals). The individual/enterprise distinction is `account_type` on
 * the organizations row (ADR 0006).
 *
 * The cross-table OR ("role <> admin OR org is individual") lives in the
 * `is_public_professional` computed column (migration 20260708000002) —
 * PostgREST cannot express embedded-table columns inside an or=() filter
 * (PGRST100), so it must be evaluated in the database.
 */
export function applyPublicProfessionalFilters<T extends PublicProfessionalQuery<T>>(query: T): T {
  return query
    .eq("is_active", true)
    .eq("accepts_public_reviews", true)
    .neq("role", "manager")
    .neq("role", "enterprise")
    .is("is_public_professional", true);
}
