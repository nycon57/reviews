import type { Metadata } from "next";
import { FeaturesPageClient } from "./features-client";

export const metadata: Metadata = {
  title: "Features | RepWell - Customer Experience Management",
  description:
    "Explore RepWell's powerful features: automated surveys, NPS tracking, AI sentiment analysis, Google Business integration, and more. Everything you need to manage customer experience.",
  openGraph: {
    title: "Features | RepWell",
    description:
      "Discover all the tools you need to collect reviews, track metrics, and build your reputation.",
    type: "website",
  },
};

export default function FeaturesPage() {
  return <FeaturesPageClient />;
}
