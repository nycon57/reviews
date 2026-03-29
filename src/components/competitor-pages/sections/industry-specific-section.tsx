"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  House,
  Buildings,
  IdentificationBadge,
  ChartLineUp,
  ShieldCheck,
  UsersThree,
  Scales,
  Globe,
  Star,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { IndustryFeature, CtaLink } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface IndustrySpecificSectionProps {
  features: IndustryFeature[];
  headline?: string;
  description?: string;
  cta?: CtaLink;
  stat?: { value: string; label: string };
}

/** Maps config icon names to Phosphor icon components. */
const iconMap: Record<string, PhosphorIcon> = {
  house: House,
  home: House,
  buildings: Buildings,
  building: Buildings,
  office: Buildings,
  "identification-badge": IdentificationBadge,
  badge: IdentificationBadge,
  id: IdentificationBadge,
  "chart-line-up": ChartLineUp,
  chart: ChartLineUp,
  trending: ChartLineUp,
  "shield-check": ShieldCheck,
  shield: ShieldCheck,
  compliance: ShieldCheck,
  "users-three": UsersThree,
  users: UsersThree,
  team: UsersThree,
  scales: Scales,
  balance: Scales,
  legal: Scales,
  globe: Globe,
  world: Globe,
  star: Star,
};

/** Renders a Phosphor icon or a decorative dot fallback. */
function FeatureIcon({ name }: { name: string }) {
  const IconComponent = iconMap[name.toLowerCase()];

  return (
    <span
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-repwell-sage-200/15 text-repwell-sage-200"
      aria-hidden="true"
    >
      {IconComponent ? (
        <IconComponent weight="duotone" className="h-6 w-6" />
      ) : (
        <span className="h-5 w-5 rounded-full bg-repwell-sage-200/50" />
      )}
    </span>
  );
}

/** Single industry feature card with entrance animation. */
function IndustryFeatureCard({
  feature,
  index,
  isVisible,
}: {
  feature: IndustryFeature;
  index: number;
  isVisible: boolean;
}) {
  return (
    <article
      className={cn(
        "relative rounded-xl border border-border bg-white p-6 shadow-sm transition-[transform,box-shadow,opacity] duration-500 hover:shadow-md hover:-translate-y-1 lg:p-8",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      style={{
        transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
      }}
    >
      {feature.repwellExclusive && (
        <span className="absolute right-4 top-4 rounded-full bg-repwell-teal-300/10 px-2.5 py-0.5 text-[11px] font-semibold text-repwell-teal-300">
          RepWell Exclusive
        </span>
      )}

      <FeatureIcon name={feature.icon} />

      <h3 className="mt-4 font-sans text-lg font-semibold text-repwell-teal-500 md:text-xl">
        {feature.title}
      </h3>

      <p className="mt-2 font-sans text-sm leading-relaxed text-repwell-teal-400">
        {feature.description}
      </p>
    </article>
  );
}

/** Visual stat callout element for the industry section. */
function StatCallout({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-repwell-teal-500 px-8 py-10 text-center shadow-lg">
      <span className="font-display text-4xl font-bold text-white md:text-5xl">
        {value}
      </span>
      <span className="mt-2 font-sans text-sm font-medium text-repwell-sage-100/80">
        {label}
      </span>
    </div>
  );
}

/**
 * Section 10: Industry-specific features.
 *
 * Highlights why companies in specific industries need RepWell, with feature
 * cards covering compliance, professional profiles, branch management, etc.
 * Includes a visual stat callout and a CTA button.
 *
 * Cards animate in with staggered fade-up on scroll.
 * All content driven by config data.
 */
export function IndustrySpecificSection({
  features,
  headline = "Built for Your Industry",
  description = "Purpose-built for the compliance, workflow, and reputation needs unique to your business.",
  cta,
  stat,
}: IndustrySpecificSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (features.length === 0) return null;

  return (
    <div ref={sectionRef}>
      {/* Header with optional stat callout */}
      <div className="mx-auto max-w-4xl text-center">
        <p className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
          Industry-Specific Solution
        </p>

        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
          {headline}
        </h2>

        <p className="mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 md:text-xl">
          {description}
        </p>
      </div>

      {/* Stat callout (visual element) */}
      {stat && (
        <div
          className={cn(
            "mx-auto mt-10 max-w-xs transition-all duration-700",
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-6 opacity-0",
          )}
        >
          <StatCallout value={stat.value} label={stat.label} />
        </div>
      )}

      {/* Feature grid */}
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {features.map((f, i) => (
          <IndustryFeatureCard
            key={`${f.title}-${i}`}
            feature={f}
            index={i}
            isVisible={isVisible}
          />
        ))}
      </div>

      {/* CTA button */}
      {cta && (
        <div
          className={cn(
            "mt-10 text-center transition-all duration-500",
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-4 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "600ms" : "0ms" }}
        >
          <a
            href={cta.href}
            className="inline-flex items-center gap-2 rounded-lg bg-repwell-teal-300 px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-repwell-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2 active:bg-repwell-teal-500"
          >
            {cta.label}
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
}
