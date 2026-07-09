import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPageClient } from "./pricing-client";
import { StructuredData } from "@/components/seo/structured-data";
import { PRICING_FAQS } from "@/lib/marketing/pricing-faqs";
import { generateFAQPageSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Pricing | RepWell - Simple, Transparent Plans",
  description:
    "Choose the RepWell plan that fits your needs. From individual professionals to enterprise teams, we have a solution for you. Start your free 14-day trial today.",
  openGraph: {
    title: "Pricing | RepWell",
    description: "Simple, transparent pricing for customer experience management. Start free.",
    type: "website",
  },
};

function PricingPageSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="bg-gradient-to-b from-repwell-sage-100/50 to-white py-20 md:py-28 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl animate-pulse text-center">
            <div className="mx-auto mb-6 h-6 w-20 rounded-full bg-repwell-sage-200" />
            <div className="mx-auto mb-6 h-14 w-3/4 rounded-lg bg-repwell-sage-200" />
            <div className="mx-auto mb-10 h-6 w-2/3 rounded-lg bg-repwell-sage-200" />
            <div className="mx-auto h-12 w-64 rounded-full bg-repwell-sage-200" />
          </div>
        </div>
      </section>

      {/* Pricing Cards Skeleton */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid animate-pulse gap-8 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-repwell-sage-100 p-8">
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-repwell-sage-200" />
                  <div className="mx-auto mb-2 h-8 w-32 rounded-lg bg-repwell-sage-200" />
                  <div className="mx-auto h-4 w-40 rounded-lg bg-repwell-sage-200" />
                </div>
                <div className="mb-8 text-center">
                  <div className="mx-auto mb-2 h-12 w-24 rounded-lg bg-repwell-sage-200" />
                  <div className="mx-auto h-4 w-20 rounded-lg bg-repwell-sage-200" />
                </div>
                <div className="mb-8 space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full bg-repwell-sage-200" />
                      <div className="h-4 flex-1 rounded-lg bg-repwell-sage-200" />
                    </div>
                  ))}
                </div>
                <div className="h-12 rounded-lg bg-repwell-sage-200" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function PricingPage() {
  return (
    <>
      <StructuredData data={generateFAQPageSchema(PRICING_FAQS)} />
      <Suspense fallback={<PricingPageSkeleton />}>
        <PricingPageClient />
      </Suspense>
    </>
  );
}
