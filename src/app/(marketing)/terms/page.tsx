import type { Metadata } from "next";
import { TermsPageClient } from "./terms-client";

export const metadata: Metadata = {
  title: "Terms of Service | ReviewHub",
  description:
    "ReviewHub Terms of Service - Read the terms and conditions governing your use of our customer experience management platform.",
  openGraph: {
    title: "Terms of Service | ReviewHub",
    description: "Terms and conditions for using ReviewHub.",
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
