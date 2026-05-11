type PublicProfessionalQuery<T> = {
  eq(column: string, value: unknown): T;
  neq(column: string, value: unknown): T;
  or(filters: string): T;
};

export const PUBLIC_PROFESSIONAL_OR_FILTER = "role.neq.admin,individual_organization_id.not.is.null";

export function applyPublicProfessionalFilters<T extends PublicProfessionalQuery<T>>(query: T): T {
  return query
    .eq("is_active", true)
    .eq("accepts_public_reviews", true)
    .neq("role", "manager")
    .neq("role", "enterprise")
    .or(PUBLIC_PROFESSIONAL_OR_FILTER);
}
