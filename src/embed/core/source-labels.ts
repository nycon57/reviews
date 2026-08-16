const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  google: "Google",
  internal: "RepWell",
  manual_json: "Manual",
  other: "Other",
  repwell: "RepWell",
  survey: "RepWell",
  video_testimonial: "Video review",
  yelp: "Yelp",
  zillow: "Zillow",
};

export function formatEmbedSource(source: string | null | undefined): string {
  const value = String(source ?? "").trim();

  if (!value) {
    return "Unknown";
  }

  const key = value.toLowerCase().replace(/[\s-]+/g, "_");
  const label = SOURCE_LABELS[key];

  if (label) {
    return label;
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());
}
