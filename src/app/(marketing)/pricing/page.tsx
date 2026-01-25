import type { Metadata } from "next";
import { Suspense } from "react";
import { PricingPageClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing | RepWell - Simple, Transparent Plans",
  description:
    "Choose the RepWell plan that fits your needs. From individual professionals to enterprise teams, we have a solution for you. Start your free 14-day trial today.",
  openGraph: {
    title: "Pricing | RepWell",
    description:
      "Simple, transparent pricing for customer experience management. Start free.",
    type: "website",
  },
};

function PricingPageSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="py-20 md:py-28 lg:py-32 bg-gradient-to-b from-repwell-sage-100/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto animate-pulse">
            <div className="h-6 w-20 bg-repwell-sage-200 rounded-full mx-auto mb-6" />
            <div className="h-14 w-3/4 bg-repwell-sage-200 rounded-lg mx-auto mb-6" />
            <div className="h-6 w-2/3 bg-repwell-sage-200 rounded-lg mx-auto mb-10" />
            <div className="h-12 w-64 bg-repwell-sage-200 rounded-full mx-auto" />
          </div>
        </div>
      </section>

      {/* Pricing Cards Skeleton */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-3xl border border-repwell-sage-100 p-8"
              >
                <div className="text-center mb-8">
                  <div className="w-14 h-14 bg-repwell-sage-200 rounded-2xl mx-auto mb-4" />
                  <div className="h-8 w-32 bg-repwell-sage-200 rounded-lg mx-auto mb-2" />
                  <div className="h-4 w-40 bg-repwell-sage-200 rounded-lg mx-auto" />
                </div>
                <div className="text-center mb-8">
                  <div className="h-12 w-24 bg-repwell-sage-200 rounded-lg mx-auto mb-2" />
                  <div className="h-4 w-20 bg-repwell-sage-200 rounded-lg mx-auto" />
                </div>
                <div className="space-y-4 mb-8">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 bg-repwell-sage-200 rounded-full" />
                      <div className="h-4 flex-1 bg-repwell-sage-200 rounded-lg" />
                    </div>
                  ))}
                </div>
                <div className="h-12 bg-repwell-sage-200 rounded-lg" />
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
    <Suspense fallback={<PricingPageSkeleton />}>
      <PricingPageClient />
    </Suspense>
  );
}
