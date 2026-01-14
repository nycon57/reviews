import type { Metadata } from "next";
import { AboutPageClient } from "./about-client";

export const metadata: Metadata = {
  title: "About Us | ReviewHub - Our Mission & Team",
  description:
    "Learn about ReviewHub's mission to help mortgage professionals build trust through authentic customer feedback. Meet our team and discover our values.",
  openGraph: {
    title: "About Us | ReviewHub",
    description:
      "Building trust through customer feedback. Learn about our mission and team.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
