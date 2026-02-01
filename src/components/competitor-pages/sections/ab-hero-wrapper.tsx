"use client";

import type { CompetitorHero } from "@/lib/competitor-pages";
import { useABTestContext } from "../ab-test-provider";
import { StatCountUp } from "./stat-count-up";

interface ABHeroWrapperProps {
  config: CompetitorHero;
  competitorName: string;
}

const DEFAULT_CTA_COLOR = "bg-repwell-teal-300 hover:bg-repwell-teal-400";

/**
 * Renders the H1 with the competitor name highlighted in a different color.
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
 * Client component that renders the A/B-tested portions of the hero section:
 * H1 headline, primary CTA copy, and primary CTA color.
 * Falls back to config defaults when no A/B test is active.
 */
export function ABHeroWrapper({ config, competitorName }: ABHeroWrapperProps) {
  const { h1, ctaCopy, ctaColor, trackCtaClick } = useABTestContext();

  const resolvedH1 = h1 ?? config.h1;
  const resolvedCtaLabel = ctaCopy ?? config.primaryCta.label;
  const resolvedCtaColor = ctaColor ?? DEFAULT_CTA_COLOR;

  return (
    <>
      {/* H1 with competitor name highlighted */}
      <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl md:text-6xl lg:text-7xl">
        <HeroHeadline h1={resolvedH1} competitorName={competitorName} />
      </h1>

      {/* Subheadline */}
      <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-relaxed text-repwell-teal-400 md:text-xl">
        {config.subhead}
      </p>

      {/* Dual CTAs */}
      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={config.primaryCta.href}
          onClick={trackCtaClick}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3.5 font-sans text-base font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2 active:scale-[0.98] ${resolvedCtaColor}`}
        >
          {resolvedCtaLabel}
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
    </>
  );
}
