import type { CompetitorHero } from "@/lib/competitor-pages";
import { StatCountUp } from "./stat-count-up";

interface HeroSectionProps {
  config: CompetitorHero;
  competitorName: string;
}

/**
 * Renders the H1 with the competitor name highlighted in a different color.
 * If the H1 contains the competitor name, that portion is wrapped in a span.
 */
function HeroHeadline({
  h1,
  competitorName,
}: {
  h1: string;
  competitorName: string;
}) {
  const idx = h1.toLowerCase().indexOf(competitorName.toLowerCase());
  if (idx === -1) {
    return <>{h1}</>;
  }

  const before = h1.slice(0, idx);
  const match = h1.slice(idx, idx + competitorName.length);
  const after = h1.slice(idx + competitorName.length);

  return (
    <>
      {before}
      <span className="text-repwell-sage-200">{match}</span>
      {after}
    </>
  );
}

/**
 * Section 1: Hero with badge, H1, dual CTAs, and hero stat.
 *
 * Server Component -- the animated stat counter is delegated to the
 * StatCountUp client component.
 */
export function HeroSection({ config, competitorName }: HeroSectionProps) {
  return (
    <div className="relative text-center">
      {/* Subtle background gradient */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-repwell-sage-100/20 to-transparent"
        aria-hidden="true"
      />

      {/* Badge */}
      <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-repwell-teal-300/20 bg-repwell-teal-300/10 px-4 py-1.5 font-sans text-sm font-semibold text-repwell-teal-300">
        {config.badge}
      </span>

      {/* H1 with competitor name highlighted */}
      <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl md:text-6xl lg:text-7xl">
        <HeroHeadline h1={config.h1} competitorName={competitorName} />
      </h1>

      {/* Subheadline — max 2 lines */}
      <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-relaxed text-repwell-teal-400 md:text-xl">
        {config.subhead}
      </p>

      {/* Dual CTAs */}
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={config.primaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-repwell-teal-300 px-8 py-3.5 font-sans text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-repwell-teal-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {config.primaryCta.label}
        </a>
        <a
          href={config.secondaryCta.href}
          className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-repwell-teal-300 bg-transparent px-8 py-3.5 font-sans text-base font-semibold text-repwell-teal-400 transition-all duration-200 hover:border-repwell-teal-400 hover:bg-repwell-sage-100/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          {config.secondaryCta.label}
        </a>
      </div>

      {/* Hero stat with animated count-up */}
      {config.stat && (
        <StatCountUp value={config.stat.value} label={config.stat.label} />
      )}
    </div>
  );
}
