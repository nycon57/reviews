import type { Metadata } from "next";
import { TermsPageClient } from "./terms-client";

export const metadata: Metadata = {
  title: "Terms of Service | RepWell",
  description:
    "RepWell Terms of Service - Read the terms and conditions governing your use of our customer experience management platform.",
  openGraph: {
    title: "Terms of Service | RepWell",
    description: "Terms and conditions for using RepWell.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return <TermsPageClient />;
}
