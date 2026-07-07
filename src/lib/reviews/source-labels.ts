export const REVIEW_SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  google: "Google",
  internal: "Survey",
  manual_json: "Manual",
  other: "Other",
  repwell: "RepWell",
  survey: "Survey",
  // Reads naturally after "via" and inside the SourceIcon badge
  video_testimonial: "Video review",
  yelp: "Yelp",
  zillow: "Zillow",
};

export function formatReviewSource(source: string | null | undefined): string {
  const value = String(source ?? "").trim();

  if (!value) {
    return "Unknown";
  }

  const key = value.toLowerCase().replace(/[\s-]+/g, "_");
  const label = REVIEW_SOURCE_LABELS[key];

  if (label) {
    return label;
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
