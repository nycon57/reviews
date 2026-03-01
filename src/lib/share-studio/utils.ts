/**
 * Returns a human-readable platform label with "Review" suffix.
 * e.g. "google" -> "Google Review", "" -> "Verified Review".
 */
export function platformLabel(source: string): string {
  const s = source.toLowerCase();
  if (s === "google") return "Google Review";
  if (s === "zillow") return "Zillow Review";
  if (s === "facebook") return "Facebook Review";
  if (s === "yelp") return "Yelp Review";
  if (s === "realtor") return "Realtor.com Review";
  if (s) return `${source.charAt(0).toUpperCase()}${source.slice(1)} Review`;
  return "Verified Review";
}
