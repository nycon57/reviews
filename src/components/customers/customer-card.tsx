import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { CustomerPageConfig } from "@/lib/customers/types";
import { industryLabels } from "@/config/customer-pages";

interface CustomerCardProps {
  config: CustomerPageConfig;
}

export function CustomerCard({ config }: CustomerCardProps) {
  const primaryMetric = config.metrics[0];

  return (
    <Link
      href={`/customers/${config.slug}`}
      className="group block rounded-2xl border border-border bg-white p-6 transition-all duration-200 hover:border-repwell-sage-200 hover:shadow-lg md:p-8"
    >
      {/* Logo and industry */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background-subtle">
          <Image
            src={config.logo}
            alt={`${config.companyName} logo`}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </div>
        <span className="inline-flex items-center rounded-full bg-repwell-sage-100/60 px-3 py-1 text-xs font-medium text-repwell-teal-400">
          {industryLabels[config.industry]}
        </span>
      </div>

      {/* Company name */}
      <h3 className="mb-2 font-display text-xl font-semibold text-repwell-teal-500">
        {config.companyName}
      </h3>

      {/* Primary metric highlight */}
      {primaryMetric && (
        <div className="mb-4 rounded-lg bg-background-subtle p-4">
          <p className="text-sm text-repwell-teal-300">{primaryMetric.label}</p>
          <p className="mt-1 font-display text-2xl font-bold text-repwell-teal-500">
            {primaryMetric.percentageChange}
          </p>
          <p className="mt-0.5 text-xs text-repwell-teal-300">
            {primaryMetric.before} &rarr; {primaryMetric.after}
          </p>
        </div>
      )}

      {/* Quote snippet */}
      <blockquote className="mb-6 text-sm italic text-repwell-teal-400 line-clamp-3">
        &ldquo;{config.quote.text}&rdquo;
      </blockquote>

      {/* Read story link */}
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-repwell-teal-300 transition-colors group-hover:text-repwell-teal-400">
        Read story
        <ArrowRight
          weight="bold"
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
