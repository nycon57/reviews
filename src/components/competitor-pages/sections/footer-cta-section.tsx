import type { FooterCta } from "@/lib/competitor-pages";

interface FooterCTASectionProps {
  config: FooterCta;
}

/**
 * Section 16: Footer CTA.
 * Full implementation in S128.
 */
export function FooterCTASection({ config }: FooterCTASectionProps) {
  return (
    <div className="text-center">
      <h2 className="font-display text-3xl font-bold md:text-4xl">
        {config.headline}
      </h2>
      <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
        {config.subhead}
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={config.primaryCta.href}
          className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-base font-semibold text-repwell-teal-500 transition-colors hover:bg-repwell-sage-100"
        >
          {config.primaryCta.label}
        </a>
        <a
          href={config.secondaryCta.href}
          className="inline-flex items-center rounded-lg border border-white/30 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-white/10"
        >
          {config.secondaryCta.label}
        </a>
      </div>
      {config.trustBadges.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          {config.trustBadges.map((badge) => (
            <span
              key={badge.label}
              className="text-sm font-medium opacity-80"
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
