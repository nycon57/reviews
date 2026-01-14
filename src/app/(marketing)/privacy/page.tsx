import type { Metadata } from "next";
import { PrivacyPageClient } from "./privacy-client";

export const metadata: Metadata = {
  title: "Privacy Policy | ReviewHub",
  description:
    "ReviewHub Privacy Policy - Learn how we collect, use, and protect your personal information. Your privacy and data security are our top priorities.",
  openGraph: {
    title: "Privacy Policy | ReviewHub",
    description: "Learn how ReviewHub protects your privacy and data.",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return <PrivacyPageClient />;
}
