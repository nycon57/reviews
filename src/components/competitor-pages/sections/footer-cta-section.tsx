"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { FooterCta, TrustBadge } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Lock,
  Clock,
  CheckCircle,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Trust badge icon mapping
// ---------------------------------------------------------------------------

const trustIconMap: Record<string, PhosphorIcon> = {
  shield: ShieldCheck,
  "shield-check": ShieldCheck,
  lock: Lock,
  clock: Clock,
  check: CheckCircle,
  "check-circle": CheckCircle,
};

function TrustBadgeItem({ badge }: { badge: TrustBadge }) {
  const IconComponent = trustIconMap[badge.icon.toLowerCase()];

  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center"
        aria-hidden="true"
      >
        {IconComponent ? (
          <IconComponent weight="duotone" className="h-5 w-5 text-white/70" />
        ) : (
          <CheckCircle weight="duotone" className="h-5 w-5 text-white/70" />
        )}
      </span>
      <span className="font-sans text-sm font-medium text-white/80">
        {badge.label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 16: Footer CTA
// ---------------------------------------------------------------------------

interface FooterCTASectionProps {
  config: FooterCta;
}

/**
 * Section 16: Footer CTA with gradient background.
 *
 * Renders a full-width section with headline, subheadline, dual CTA
 * buttons (primary inverted + secondary outline), and trust badges.
 * The gradient background is applied by the parent SectionWrapper
 * (background="gradient").
 */
export function FooterCTASection({ config }: FooterCTASectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  return (
    <div ref={sectionRef} className="text-center">
      {/* Headline */}
      <h2
        className={cn(
          "font-display text-3xl font-bold tracking-tight text-white transition-all duration-500 md:text-4xl lg:text-5xl",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
      >
        {config.headline}
      </h2>

      {/* Subheadline */}
      <p
        className={cn(
          "mx-auto mt-4 max-w-2xl font-sans text-lg leading-relaxed text-repwell-sage-100/80 transition-all duration-500 md:text-xl",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
        style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
      >
        {config.subhead}
      </p>

      {/* Dual CTA buttons */}
      <div
        className={cn(
          "mt-10 flex flex-col items-center justify-center gap-4 transition-all duration-500 sm:flex-row",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
        style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
      >
        {/* Primary CTA — inverted (white bg on gradient) */}
        <a
          href={config.primaryCta.href}
          className="inline-flex w-full items-center justify-center rounded-lg bg-white px-8 py-4 font-sans text-base font-semibold text-repwell-teal-500 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-repwell-sage-100 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-repwell-teal-400 sm:w-auto"
        >
          {config.primaryCta.label}
        </a>

        {/* Secondary CTA — outline */}
        <a
          href={config.secondaryCta.href}
          className="inline-flex w-full items-center justify-center rounded-lg border-2 border-white/30 px-8 py-4 font-sans text-base font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-repwell-teal-400 sm:w-auto"
        >
          {config.secondaryCta.label}
        </a>
      </div>

      {/* Trust badges */}
      {config.trustBadges.length > 0 && (
        <div
          className={cn(
            "mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 transition-all duration-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
        >
          {config.trustBadges.map((badge) => (
            <TrustBadgeItem key={badge.label} badge={badge} />
          ))}
        </div>
      )}
    </div>
  );
}
