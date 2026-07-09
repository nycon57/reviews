import type { Metadata } from "next";
import { AboutPageClient } from "./about-client";

export const metadata: Metadata = {
  title: "About Us | RepWell - Our Mission & Values",
  description:
    "Learn about RepWell's mission to help client-facing teams build trust through authentic customer feedback.",
  openGraph: {
    title: "About Us | RepWell",
    description:
      "Building trust through customer feedback. Learn about our mission and values.",
    type: "website",
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}
