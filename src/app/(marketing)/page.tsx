import type { Metadata } from "next";
import { HomePageClient } from "./home-page-client";
import { getBaseUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Review Management Software",
  description:
    "RepWell helps client-facing teams collect reviews, track satisfaction metrics, and manage customer feedback workflows.",
  alternates: {
    canonical: `${getBaseUrl()}/`,
  },
  openGraph: {
    title: "RepWell Review Management Software",
    description:
      "Collect reviews, track satisfaction metrics, and manage customer feedback workflows in RepWell.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepWell Review Management Software",
    description:
      "Collect reviews, track satisfaction metrics, and manage customer feedback workflows in RepWell.",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
