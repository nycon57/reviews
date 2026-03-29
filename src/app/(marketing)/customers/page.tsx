import type { Metadata } from "next";
import Link from "next/link";
import { customerPageConfigs, getAllIndustries } from "@/config/customer-pages";
import { CustomersGrid } from "@/components/customers/customers-grid";

export const metadata: Metadata = {
  title: "Customer Stories | RepWell",
  description:
    "See how companies across industries use RepWell to grow review volume, improve NPS scores, and build trust. Real results from real customers.",
  openGraph: {
    title: "Customer Stories | RepWell",
    description:
      "Real results from real customers. See how companies use RepWell to transform their reputation management.",
    type: "website",
  },
};

export default function CustomersPage() {
  const configs = Object.values(customerPageConfigs);
  const industries = getAllIndustries();

  return (
    <>
      {/* Hero */}
      <section className="bg-white py-16 md:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center rounded-full bg-repwell-sage-100/60 px-3 py-1 text-xs font-medium tracking-wide text-repwell-teal-400 uppercase">
            Customer Stories
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl lg:text-5xl">
            Real Results from Real Companies
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-repwell-teal-400">
            See how teams across industries use RepWell to grow review volume,
            improve customer satisfaction, and take control of their reputation.
          </p>
        </div>
      </section>

      {/* Filterable grid */}
      <section className="bg-background-subtle py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <CustomersGrid configs={configs} industries={industries} />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bg-gradient-to-b from-repwell-teal-500 to-repwell-teal-400 py-16 text-white md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">
            Get Similar Results
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-repwell-sage-100">
            Join hundreds of companies that trust RepWell to manage their
            reputation and grow their business.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-repwell-teal-500 transition-colors hover:bg-repwell-sage-100"
            >
              Book a Demo
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              See Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
