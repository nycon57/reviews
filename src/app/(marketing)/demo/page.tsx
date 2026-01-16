import type { Metadata } from "next";
import { DemoPageClient } from "./demo-client";

export const metadata: Metadata = {
  title: "Request a Demo | RepWell - See It in Action",
  description:
    "Schedule a personalized demo of RepWell. See how our platform can help you collect more reviews, track metrics, and grow your business in just 30 minutes.",
  openGraph: {
    title: "Request a Demo | RepWell",
    description:
      "Schedule a personalized demo and see RepWell in action.",
    type: "website",
  },
};

export default function DemoPage() {
  return <DemoPageClient />;
}
