import type { CompetitorHero } from "@/lib/competitor-pages";

interface HeroSectionProps {
  config: CompetitorHero;
  competitorName: string;
}

/**
 * Section 1: Hero with badge, H1, dual CTAs, and hero stat.
 * Full implementation in S116.
 */
export function HeroSection({ config, competitorName: _competitorName }: HeroSectionProps) {
  return (
    <div className="text-center">
      <span className="mb-4 inline-block rounded-full bg-repwell-sage-100/50 px-4 py-1.5 text-sm font-semibold text-repwell-teal-300">
        {config.badge}
      </span>
      <h1 className="font-display text-5xl font-bold tracking-tight text-repwell-teal-500 md:text-6xl lg:text-7xl">
        {config.h1}
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-repwell-teal-400 md:text-xl">
        {config.subhead}
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={config.primaryCta.href}
          className="inline-flex items-center rounded-lg bg-repwell-teal-300 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-repwell-teal-400"
        >
          {config.primaryCta.label}
        </a>
        <a
          href={config.secondaryCta.href}
          className="inline-flex items-center rounded-lg border border-repwell-teal-300 px-6 py-3 text-base font-semibold text-repwell-teal-300 transition-colors hover:bg-repwell-sage-100/30"
        >
          {config.secondaryCta.label}
        </a>
      </div>
      {config.stat && (
        <div className="mt-12 inline-flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-repwell-teal-500 md:text-5xl">
            {config.stat.value}
          </span>
          <span className="text-lg text-repwell-teal-300">
            {config.stat.label}
          </span>
        </div>
      )}
    </div>
  );
}
