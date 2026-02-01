import type { CompetitorHero } from "@/lib/competitor-pages";
import { ABHeroWrapper } from "./ab-hero-wrapper";

interface HeroSectionProps {
  config: CompetitorHero;
  competitorName: string;
}

/**
 * Section 1: Hero with badge, H1, dual CTAs, and hero stat.
 *
 * Server Component — the H1, CTA copy, and CTA color are A/B tested
 * via the ABHeroWrapper client component. Falls back to config defaults
 * when no A/B test is active.
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

      {/* A/B tested content: H1, subhead, CTAs, and stat */}
      <ABHeroWrapper config={config} competitorName={competitorName} />
    </div>
  );
}
