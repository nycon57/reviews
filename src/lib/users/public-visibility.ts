type PublicProfessionalQuery<T> = {
  eq(column: string, value: unknown): T;
  neq(column: string, value: unknown): T;
  or(filters: string): T;
};

/**
 * Show individual account owners (their own admin) alongside enterprise
 * professionals, while hiding enterprise admins (org account managers, not
 * professionals). The individual/enterprise distinction is `account_type` on
 * the organizations row (ADR 0006), so this references the embedded org column.
 *
 * REQUIRED: every caller must embed `organizations!inner(account_type)` in its
 * select — the `!inner` is what lets the embedded-column condition filter
 * top-level rows, and post-merge every public professional has an org row.
 */
export const PUBLIC_PROFESSIONAL_OR_FILTER = "role.neq.admin,organizations.account_type.eq.individual";

export function applyPublicProfessionalFilters<T extends PublicProfessionalQuery<T>>(query: T): T {
  return query
    .eq("is_active", true)
    .eq("accepts_public_reviews", true)
    .neq("role", "manager")
    .neq("role", "enterprise")
    .or(PUBLIC_PROFESSIONAL_OR_FILTER);
}
