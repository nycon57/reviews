/**
 * A/B test variant resolver for embed.js.
 *
 * Uses consistent hashing on a persistent visitor ID to deterministically
 * assign visitors to variant A or B. Assignment is sticky via localStorage.
 */

const VISITOR_ID_KEY = "rw_visitor_id";
const AB_PREFIX = "rw_ab_";

interface AbTestConfig {
  enabled: boolean;
  splitPercent: number;
  variantWidgetSlug: string;
}

/**
 * Get or create a persistent visitor ID.
 * Falls back to a session-level ID if localStorage is unavailable.
 */
function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_ID_KEY);
    if (id) return id;
    id = generateId();
    localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing, iframe restrictions)
    return generateId();
  }
}

function generateId(): string {
  // Compact random ID: timestamp + random hex
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

/**
 * Simple string hash (FNV-1a) returning a value 0-99.
 * Deterministic: same input always produces same output.
 */
function hashToPercent(input: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, unsigned
  }
  return hash % 100;
}

/**
 * Get the cached variant assignment for a widget, or null if not cached.
 */
function getCachedAssignment(widgetId: string): string | null {
  try {
    return localStorage.getItem(AB_PREFIX + widgetId);
  } catch {
    return null;
  }
}

/**
 * Cache a variant assignment for a widget.
 */
function cacheAssignment(widgetId: string, variant: string): void {
  try {
    localStorage.setItem(AB_PREFIX + widgetId, variant);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear cached A/B assignment for a widget (called when test ends).
 */
export function clearAbAssignment(widgetId: string): void {
  try {
    localStorage.removeItem(AB_PREFIX + widgetId);
  } catch {
    // Ignore
  }
}

/**
 * Resolve which widget slug to actually render for a given widget ID.
 *
 * If the widget has an active A/B test, uses consistent hashing to
 * deterministically assign the visitor to variant A (original) or B.
 *
 * @returns The widget slug to fetch config/reviews for. May be the original
 *          widgetId or the variant's slug.
 */
export function resolveAbVariant(
  widgetId: string,
  abTest: AbTestConfig | null | undefined
): string {
  if (!abTest?.enabled) return widgetId;

  // Check for cached sticky assignment
  const cached = getCachedAssignment(widgetId);
  if (cached === "A") return widgetId;
  if (cached === "B") return abTest.variantWidgetSlug;

  // Deterministic assignment via consistent hashing
  const visitorId = getVisitorId();
  const bucket = hashToPercent(visitorId + ":" + widgetId);

  // splitPercent = % traffic going to variant B
  const isVariantB = bucket < abTest.splitPercent;
  const assignment = isVariantB ? "B" : "A";

  // Cache for sticky assignment
  cacheAssignment(widgetId, assignment);

  return isVariantB ? abTest.variantWidgetSlug : widgetId;
}
