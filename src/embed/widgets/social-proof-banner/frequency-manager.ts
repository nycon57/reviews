/**
 * Frequency Manager — controls how often the social proof banner appears.
 * Uses localStorage with widget_id-scoped keys. Falls back to showing every visit
 * if localStorage is unavailable.
 */

type Frequency = "every_visit" | "once_per_session" | "once_per_day" | "once_per_week";

const STORAGE_PREFIX = "rw_spb_";

function getKey(widgetId: string): string {
  return `${STORAGE_PREFIX}${widgetId}`;
}

function storageAvailable(): boolean {
  try {
    const key = "__rw_test__";
    localStorage.setItem(key, "1");
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Check whether the banner should be shown based on frequency setting. */
export function shouldShow(widgetId: string, frequency: Frequency): boolean {
  if (frequency === "every_visit") return true;
  if (!storageAvailable()) return true;

  const key = getKey(widgetId);
  const raw = localStorage.getItem(key);
  if (!raw) return true;

  try {
    const data = JSON.parse(raw) as { ts: number; dismissed?: boolean };
    const now = Date.now();
    const elapsed = now - data.ts;

    if (frequency === "once_per_session") {
      // Session = tab/window lifetime; sessionStorage would be better
      // but we use localStorage for cross-tab coordination.
      // Check if sessionStorage flag exists instead.
      return !sessionStorage.getItem(key);
    }

    if (frequency === "once_per_day") {
      return elapsed > 86_400_000; // 24 hours
    }

    if (frequency === "once_per_week") {
      return elapsed > 604_800_000; // 7 days
    }
  } catch {
    return true;
  }

  return true;
}

/** Record that the banner was shown (or dismissed). */
export function recordShown(widgetId: string, frequency: Frequency): void {
  if (frequency === "every_visit") return;
  if (!storageAvailable()) return;

  const key = getKey(widgetId);
  const data = JSON.stringify({ ts: Date.now() });
  localStorage.setItem(key, data);

  if (frequency === "once_per_session") {
    sessionStorage.setItem(key, "1");
  }
}

/** Record dismissal — persists per the frequency setting. */
export function recordDismissed(widgetId: string, frequency: Frequency): void {
  if (!storageAvailable()) return;

  const key = getKey(widgetId);
  const data = JSON.stringify({ ts: Date.now(), dismissed: true });
  localStorage.setItem(key, data);

  if (frequency === "once_per_session") {
    sessionStorage.setItem(key, "1");
  }
}

/** Check if the banner was explicitly dismissed and should stay hidden. */
export function wasDismissed(widgetId: string, frequency: Frequency): boolean {
  if (frequency === "every_visit") return false;
  if (!storageAvailable()) return false;

  const key = getKey(widgetId);

  if (frequency === "once_per_session") {
    return sessionStorage.getItem(key) === "1";
  }

  const raw = localStorage.getItem(key);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw) as { ts: number; dismissed?: boolean };
    if (!data.dismissed) return false;

    const now = Date.now();
    const elapsed = now - data.ts;

    if (frequency === "once_per_day") return elapsed < 86_400_000;
    if (frequency === "once_per_week") return elapsed < 604_800_000;
  } catch {
    return false;
  }

  return false;
}
