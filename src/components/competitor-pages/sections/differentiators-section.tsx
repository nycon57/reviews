"use client";

import { useEffect, useRef, useState } from "react";
import {
  Cursor,
  Lightning,
  Headset,
  ChartBar,
  Shield,
  Gear,
  Star,
  Rocket,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import type { DifferentiatorCard } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface DifferentiatorsSectionProps {
  differentiators: DifferentiatorCard[];
  competitorName: string;
  headline?: string;
}

/** Maps config icon names to Phosphor icon components. */
const iconMap: Record<string, PhosphorIcon> = {
  cursor: Cursor,
  "mouse-pointer": Cursor,
  lightning: Lightning,
  zap: Lightning,
  headset: Headset,
  headphones: Headset,
  "bar-chart": ChartBar,
  chart: ChartBar,
  shield: Shield,
  gear: Gear,
  settings: Gear,
  star: Star,
  rocket: Rocket,
};

/** Renders the icon from a config icon name, falling back to a decorative dot. */
function DifferentiatorIcon({ name }: { name: string }) {
  const IconComponent = iconMap[name.toLowerCase()];

  if (!IconComponent) {
    return (
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-200/15 text-repwell-sage-200"
        aria-hidden="true"
      >
        <span className="h-5 w-5 rounded-full bg-repwell-sage-200/50" />
      </span>
    );
  }

  return (
    <span
      className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-200/15 text-repwell-sage-200"
      aria-hidden="true"
    >
      <IconComponent weight="duotone" className="h-6 w-6" />
    </span>
  );
}

/** Visual comparison bar showing RepWell advantage. */
function ComparisonMetric({
  repwellValue,
  competitorValue,
}: {
  repwellValue: string;
  competitorValue: string;
}) {
  return (
    <div className="mt-4 space-y-2.5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-sans text-xs font-semibold text-repwell-teal-500">
            RepWell
          </span>
          <span className="font-sans text-xs font-medium text-repwell-sage-200">
            {repwellValue}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-repwell-sage-100/40">
          <div
            className="h-full rounded-full bg-repwell-sage-200 transition-all duration-700"
            style={{ width: "100%" }}
          />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-sans text-xs font-semibold text-repwell-teal-400/70">
            Competitor
          </span>
          <span className="font-sans text-xs font-medium text-repwell-teal-300">
            {competitorValue}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-repwell-sage-100/40">
          <div
            className="h-full rounded-full bg-repwell-teal-300/40 transition-all duration-700"
            style={{ width: "55%" }}
          />
        </div>
      </div>
    </div>
  );
}

/** Single differentiator card with entrance animation. */
function DifferentiatorCardItem({
  card,
  index,
  isVisible,
}: {
  card: DifferentiatorCard;
  index: number;
  isVisible: boolean;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-white p-6 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 lg:p-8",
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-6 opacity-0",
      )}
      style={{
        transitionDelay: isVisible ? `${index * 120}ms` : "0ms",
      }}
    >
      <DifferentiatorIcon name={card.icon} />

      <h3 className="mt-4 font-sans text-lg font-semibold text-repwell-teal-500 md:text-xl">
        {card.title}
      </h3>

      <p className="mt-2 font-sans text-sm leading-relaxed text-repwell-teal-400">
        {card.description}
      </p>

      <ComparisonMetric
        repwellValue={card.repwellValue}
        competitorValue={card.competitorValue}
      />
    </article>
  );
}

/**
 * Section 6: Key differentiator cards.
 *
 * Desktop: 3-column grid. Mobile: stacked vertically.
 * Cards animate in with a staggered fade-up on scroll.
 * Each card shows an icon, title, description, and a visual
 * comparison metric (RepWell vs Competitor).
 *
 * All content driven by the `differentiators` config array.
 */
export function DifferentiatorsSection({
  differentiators,
  competitorName,
  headline,
}: DifferentiatorsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      // Use rAF to avoid synchronous setState in effect body
      const id = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (differentiators.length === 0) return null;

  const displayHeadline =
    headline ?? `Why teams switch from ${competitorName}`;

  return (
    <div ref={sectionRef}>
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
          {displayHeadline}
        </h2>
      </div>

      <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {differentiators.map((d, i) => (
          <DifferentiatorCardItem
            key={d.title}
            card={d}
            index={i}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  );
}
