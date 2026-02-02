/**
 * Deep JSONB diff utility for widget configurations.
 * Compares two config objects and returns path-based change tracking
 * with added/removed/changed classification.
 */

export type DiffChangeType = "added" | "removed" | "changed";

export interface DiffEntry {
  path: string;
  type: DiffChangeType;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Compute a flat list of changes between two objects.
 * Paths are dot-separated (e.g. "theme.colors.primary").
 */
export function computeDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  prefix = ""
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const path = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    const oldExists = key in oldObj;
    const newExists = key in newObj;

    if (!oldExists && newExists) {
      diffs.push({ path, type: "added", newValue: newVal });
    } else if (oldExists && !newExists) {
      diffs.push({ path, type: "removed", oldValue: oldVal });
    } else if (
      isPlainObject(oldVal) &&
      isPlainObject(newVal)
    ) {
      diffs.push(
        ...computeDiff(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          path
        )
      );
    } else if (!deepEqual(oldVal, newVal)) {
      diffs.push({ path, type: "changed", oldValue: oldVal, newValue: newVal });
    }
  }

  return diffs;
}

/**
 * Generate a human-readable summary of changes between two configs.
 * Returns a short sentence describing what changed.
 */
export function generateChangeSummary(diffs: DiffEntry[]): string {
  if (diffs.length === 0) return "No changes";

  const grouped: Record<string, number> = {};
  for (const diff of diffs) {
    // Group by top-level key (e.g., "theme", "content", "filters")
    const topKey = diff.path.split(".")[0];
    grouped[topKey] = (grouped[topKey] ?? 0) + 1;
  }

  const parts = Object.entries(grouped).map(([key, count]) => {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    return count === 1 ? label : `${label} (${count})`;
  });

  const typeCount = { added: 0, removed: 0, changed: 0 };
  for (const d of diffs) typeCount[d.type]++;

  const actions: string[] = [];
  if (typeCount.added > 0) actions.push(`${typeCount.added} added`);
  if (typeCount.changed > 0) actions.push(`${typeCount.changed} changed`);
  if (typeCount.removed > 0) actions.push(`${typeCount.removed} removed`);

  return `Updated ${parts.join(", ")} — ${actions.join(", ")}`;
}

/**
 * Format a diff value for display. Truncates long strings/objects.
 */
export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") {
    return value.length > 80 ? `"${value.slice(0, 77)}..."` : `"${value}"`;
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) {
    const items = value.map((v) =>
      typeof v === "string" ? `"${v}"` : String(v)
    );
    const joined = items.join(", ");
    return joined.length > 80 ? `[${items.slice(0, 3).join(", ")}, ...]` : `[${joined}]`;
  }
  const str = JSON.stringify(value);
  return str.length > 80 ? `${str.slice(0, 77)}...` : str;
}

// ── Internal helpers ──────────────────────────────────────────────────

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => key in b && deepEqual(a[key], b[key]));
  }

  return false;
}
