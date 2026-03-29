import Link from "next/link";
import { Quotes } from "@phosphor-icons/react/dist/ssr";
import type { CustomerPageConfig } from "@/lib/customers/types";
import { CustomerHero } from "./customer-hero";
import { CustomerResults } from "./customer-results";

interface CustomerDetailPageProps {
  config: CustomerPageConfig;
}

export function CustomerDetailPage({ config }: CustomerDetailPageProps) {
  return (
    <article>
      {/* Hero */}
      <CustomerHero config={config} />

      {/* Challenge */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-2xl font-bold text-repwell-teal-500 md:text-3xl">
            The Challenge
          </h2>
          <p className="text-lg leading-relaxed text-repwell-teal-400">
            {config.challenge}
          </p>
        </div>
      </section>

      {/* Solution */}
      <section className="bg-background-subtle py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 font-display text-2xl font-bold text-repwell-teal-500 md:text-3xl">
            The Solution
          </h2>
          <p className="text-lg leading-relaxed text-repwell-teal-400">
            {config.solution}
          </p>
        </div>
      </section>

      {/* Results */}
      <CustomerResults metrics={config.metrics} />

      {/* Quote */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-background-subtle p-8 md:p-12">
            <Quotes
              weight="fill"
              className="mb-4 h-8 w-8 text-repwell-sage-200"
            />
            <blockquote className="mb-6 font-display text-xl leading-relaxed text-repwell-teal-500 md:text-2xl">
              &ldquo;{config.quote.text}&rdquo;
            </blockquote>
            <div>
              <p className="font-semibold text-repwell-teal-500">
                {config.quote.author}
              </p>
              <p className="text-sm text-repwell-teal-300">
                {config.quote.role}, {config.companyName}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-repwell-teal-500 to-repwell-teal-400 py-16 text-white md:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 font-display text-2xl font-bold md:text-3xl">
            Get Similar Results
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-repwell-sage-100">
            Join companies like {config.companyName} that transformed their
            reputation management with RepWell.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/demo"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 font-semibold text-repwell-teal-500 transition-colors hover:bg-repwell-sage-100"
            >
              Book a Demo
            </Link>
            <Link
              href="/customers"
              className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
            >
              More Customer Stories
            </Link>
          </div>
        </div>
      </section>
    </article>
  );
}
