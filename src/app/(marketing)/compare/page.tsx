import type { Metadata } from "next";
import Link from "next/link";
import { compareNavItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { MARKETING_TRIAL_FACTS } from "@/lib/marketing/pricing-facts";
import { getBaseUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Compare RepWell Alternatives",
  description:
    "Compare RepWell to Experience.com, Birdeye, and Trustpilot for customer feedback, review management, pricing clarity, and team workflows.",
  alternates: {
    canonical: `${getBaseUrl()}/compare`,
  },
  openGraph: {
    title: "Compare RepWell Alternatives",
    description:
      "Compare RepWell to Experience.com, Birdeye, and Trustpilot for customer feedback and review management workflows.",
    type: "website",
    url: "/compare",
  },
};

export default function ComparePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-4xl">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl">
            Compare RepWell Alternatives
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-lg text-repwell-teal-400/80">
            See how RepWell compares with broader review platforms when your team needs feedback
            workflows, team visibility, and straightforward pricing.
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
              <p className="mt-2 font-sans text-sm text-repwell-teal-400/80">{item.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-sans text-sm font-medium text-repwell-teal-300 group-hover:text-repwell-teal-400">
                View comparison
                <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-20 border-y border-repwell-sage-100 py-12">
        <div className="grid gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-start">
          <div>
            <p className="font-sans text-sm font-semibold uppercase tracking-wide text-repwell-teal-300">
              Why teams switch
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-repwell-teal-500">
              Less platform sprawl around customer feedback
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              "Clear plan packaging before a sales call",
              "Workflows for both individual profiles and team oversight",
              "AI-assisted feedback analysis alongside review collection",
            ].map((reason) => (
              <div key={reason} className="rounded-lg border border-repwell-sage-100 bg-white p-5">
                <p className="font-sans text-sm leading-relaxed text-repwell-teal-400">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold text-repwell-teal-500">
          Try RepWell before you choose a platform
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-sans text-lg text-repwell-teal-400/80">
          Start with the real product, compare the workflow, and cancel anytime during the trial.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/signup">Start Free Trial</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/demo">Book a Demo</Link>
          </Button>
        </div>
        <p className="mt-4 font-sans text-sm text-repwell-teal-400/70">
          {MARKETING_TRIAL_FACTS.shortCopy}
        </p>
      </section>
    </div>
  );
}
