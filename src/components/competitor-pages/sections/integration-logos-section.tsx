"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { IntegrationItem } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface IntegrationLogosSectionProps {
  integrations: IntegrationItem[];
  headline?: string;
  subtitle?: string;
}

/** Groups integrations by category and returns sorted category names. */
function getCategories(integrations: IntegrationItem[]): string[] {
  const categories = new Set(integrations.map((i) => i.category));
  return Array.from(categories).sort();
}

/** Single integration logo with grayscale-to-color hover transition. */
function IntegrationLogo({
  item,
  index,
  isVisible,
}: {
  item: IntegrationItem;
  index: number;
  isVisible: boolean;
}) {
  return (
    <div
      className={cn(
        "group flex h-20 w-36 items-center justify-center rounded-xl border border-border bg-white px-5 py-4 shadow-sm transition-[transform,box-shadow,opacity,filter] duration-500 hover:shadow-md hover:-translate-y-0.5 sm:h-24 sm:w-40",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
      style={{
        transitionDelay: isVisible ? `${index * 60}ms` : "0ms",
      }}
    >
      {item.logoUrl ? (
        <Image
          src={item.logoUrl}
          alt={item.name}
          width={120}
          height={40}
          className="h-8 w-auto max-w-[100px] object-contain grayscale transition-[filter] duration-300 group-hover:grayscale-0 sm:h-10 sm:max-w-[120px]"
          loading="lazy"
        />
      ) : (
        <span className="font-sans text-xs font-semibold text-repwell-teal-400 grayscale transition-[filter] duration-300 group-hover:grayscale-0">
          {item.name}
        </span>
      )}
    </div>
  );
}

/**
 * Section 9: Integration partner ecosystem logo grid.
 *
 * Renders a responsive grid of integration logos that are grayscale by default
 * and transition to color on hover. Includes a configurable headline and an
 * optional subtitle listing integration categories.
 *
 * Logos animate in with staggered fade-up on scroll.
 * All content driven by the `integrations` config array.
 */
export function IntegrationLogosSection({
  integrations,
  headline = "Integrates with your existing stack",
  subtitle,
}: IntegrationLogosSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
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
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (integrations.length === 0) return null;

  const categories = getCategories(integrations);
  const categoryLabel =
    subtitle ?? (categories.length > 1 ? categories.join(" · ") : undefined);

  return (
    <div ref={sectionRef}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
          {headline}
        </h2>

        {categoryLabel && (
          <p className="mt-4 font-sans text-sm font-medium uppercase tracking-wider text-repwell-teal-300">
            {categoryLabel}
          </p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-5 lg:gap-6">
        {integrations.map((item, i) => (
          <IntegrationLogo
            key={`${item.name}-${i}`}
            item={item}
            index={i}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  );
}
