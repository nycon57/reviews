import { buildMarketingOpenGraphImage } from "@/lib/seo/og";

export const alt = "RepWell review management software for client-facing teams";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return buildMarketingOpenGraphImage({
    eyebrow: "Review Management",
    title: "Reputation Done Well",
    description:
      "Collect reviews, track satisfaction, and manage customer feedback workflows in RepWell.",
  });
}
