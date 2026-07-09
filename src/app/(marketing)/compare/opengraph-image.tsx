import { buildMarketingOpenGraphImage } from "@/lib/seo/og";

export const alt = "Compare RepWell with review management alternatives";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return buildMarketingOpenGraphImage({
    eyebrow: "Compare",
    title: "Compare RepWell",
    description: "See how RepWell compares with other review and customer feedback platforms.",
  });
}
