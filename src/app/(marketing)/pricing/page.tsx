import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPageClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | RepWell - Simple, Transparent Plans",
  description:
    "Choose the RepWell plan that fits your needs. From individual loan officers to enterprise teams, we have a solution for you. Start your free 14-day trial today.",
  openGraph: {
    title: "Pricing | RepWell",
    description:
      "Simple, transparent pricing for customer experience management. Start free.",
    type: "website",
  },
};

function PricingPageLoading() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="animate-pulse">
        <div className="h-12 w-64 bg-muted rounded mx-auto mb-4" />
        <div className="h-6 w-96 bg-muted rounded mx-auto mb-12" />
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingPageLoading />}>
      <PricingPageClient />
    </Suspense>
  );
}
