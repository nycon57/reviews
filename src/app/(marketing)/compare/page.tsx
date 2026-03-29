import type { Metadata } from "next";
import Link from "next/link";
import { compareNavItems } from "@/config/navigation";
import { getBaseUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Compare RepWell | See How We Stack Up Against Competitors",
  description:
    "Compare RepWell to Experience.com, Birdeye, and Trustpilot. See why sales professionals choose RepWell for customer experience and review management.",
  alternates: {
    canonical: `${getBaseUrl()}/compare`,
  },
  openGraph: {
    title: "Compare RepWell | See How We Stack Up",
    description:
      "Compare RepWell to Experience.com, Birdeye, and Trustpilot. Transparent pricing, no contracts, built for sales professionals.",
    type: "website",
  },
};

export default function ComparePage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-serif text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl">
          See How RepWell Compares
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-lg text-repwell-teal-400/80">
          Transparent pricing, no contracts, and built for sales professionals.
          See why teams are switching to RepWell.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {compareNavItems.map((item) => (
          <Link
            key={item.slug}
            href={item.href}
            className="group rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:border-repwell-teal-300/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20"
          >
            <h2 className="font-sans text-lg font-semibold text-repwell-teal-500 group-hover:text-repwell-teal-400">
              {item.title}
            </h2>
            <p className="mt-2 font-sans text-sm text-repwell-teal-400/80">
              {item.description}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 font-sans text-sm font-medium text-repwell-teal-300 group-hover:text-repwell-teal-400">
              View comparison
              <span aria-hidden="true">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
