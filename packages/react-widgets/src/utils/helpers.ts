/** Extract initials from a name string. */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .flatMap((w) => (w[0] ? [w[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Truncate text to a given length, adding ellipsis. */
export function truncateText(
  text: string,
  maxLength: number,
): { text: string; truncated: boolean } {
  if (text.length <= maxLength) return { text, truncated: false };
  return { text: text.slice(0, maxLength).trimEnd() + "\u2026", truncated: true };
}

/** Format a date string as relative time (e.g., "3 days ago"). */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/** Format a date string as absolute (e.g., "Jan 15, 2025"). */
export function formatAbsoluteDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Pluralize a word based on count. */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? singular + "s");
}

/** Only allow http/https URLs to prevent injection. */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
    return null;
  } catch {
    return null;
  }
}

/** Format NPS score with +/- sign. */
export function formatNpsScore(score: number): string {
  if (score > 0) return `+${Math.round(score)}`;
  return String(Math.round(score));
}

/** Get NPS zone color based on score. */
export function getNpsZone(score: number): { zone: string; color: string } {
  if (score < 0) return { zone: "red", color: "#ef4444" };
  if (score <= 30) return { zone: "yellow", color: "#eab308" };
  if (score <= 70) return { zone: "light-green", color: "#22c55e" };
  return { zone: "dark-green", color: "#16a34a" };
}
