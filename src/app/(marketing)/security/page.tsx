import type { Metadata } from "next";
import { StructuredData } from "@/components/seo/structured-data";
import { getBaseUrl } from "@/lib/seo";
import { SecurityPageClient } from "./security-client";

export const metadata: Metadata = {
  title: "Security & Compliance | RepWell",
  description:
    "Learn how RepWell protects your data with enterprise-grade security, SOC 2 compliance, encryption, and comprehensive data handling practices.",
  openGraph: {
    title: "Security & Compliance | RepWell",
    description:
      "Learn how RepWell protects your data with enterprise-grade security, SOC 2 compliance, encryption, and comprehensive data handling practices.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function SecurityPage() {
  const baseUrl = getBaseUrl();

  return (
    <>
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "Security & Compliance",
          description:
            "Learn how RepWell protects your data with enterprise-grade security, SOC 2 compliance, encryption, and comprehensive data handling practices.",
          url: `${baseUrl}/security`,
          publisher: {
            "@type": "Organization",
            name: "RepWell",
            url: baseUrl,
          },
        }}
      />
      <SecurityPageClient />
    </>
  );
}
