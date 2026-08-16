/**
 * Pure owner-attribution helpers for Salesforce-triggered acquisition surveys
 * (ADR 0004 / Grill #1 decision 10). No I/O, so the matching rule is unit
 * testable in isolation and shared with the server action that does the DB work.
 */

/** A minimal org user shape for owner matching. */
export interface OrgUserForMatch {
  id: string;
  email: string | null;
}

/**
 * Match a Salesforce Opportunity owner's email to an org professional's user id.
 * Case-insensitive, whitespace-tolerant, exact-address match (no wildcards).
 * Returns null when there is no owner email or no confident match — the caller
 * treats null as "unattributed → Held".
 */
export function matchOpportunityOwnerToUser(
  ownerEmail: string | null | undefined,
  orgUsers: ReadonlyArray<OrgUserForMatch>
): string | null {
  if (!ownerEmail) return null;
  const target = ownerEmail.trim().toLowerCase();
  if (!target) return null;
  const match = orgUsers.find(
    (u) => (u.email ?? "").trim().toLowerCase() === target
  );
  return match?.id ?? null;
}
