"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { CheckCircle } from "@phosphor-icons/react";
import type { AICapabilityTab } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface AIFeatureTabsSectionProps {
  capabilities: AICapabilityTab[];
  headline?: string;
}

/** Tab button with active/inactive state. */
function TabButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "relative rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-300 focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2",
        isActive
          ? "bg-repwell-teal-300 text-white shadow-sm"
          : "text-repwell-teal-400 hover:bg-repwell-sage-100/40 hover:text-repwell-teal-500",
      )}
    >
      {label}
    </button>
  );
}

/** Animated tab content panel. */
function TabPanel({
  capability,
  isActive,
}: {
  capability: AICapabilityTab;
  isActive: boolean;
}) {
  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={cn(
        "transition-[opacity,transform] duration-400",
        isActive
          ? "translate-y-0 opacity-100"
          : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
      )}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Text content */}
        <div>
          <h3 className="font-display text-2xl font-bold text-repwell-teal-500 md:text-3xl">
            {capability.headline}
          </h3>
          <p className="mt-3 font-sans text-base leading-relaxed text-repwell-teal-400">
            {capability.description}
          </p>

          <ul className="mt-6 space-y-3">
            {capability.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle
                  weight="fill"
                  className="mt-0.5 h-5 w-5 flex-shrink-0 text-repwell-sage-200"
                  aria-hidden="true"
                />
                <span className="font-sans text-sm leading-relaxed text-repwell-teal-400">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Illustration / screenshot */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-background-subtle shadow-sm">
          <Image
            src={capability.illustration}
            alt={capability.headline}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmNGYwIi8+PC9zdmc+"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Section 8: AI capabilities tabbed section.
 *
 * Renders 3 tabs (e.g. Convert More, Smarter Decisions, Respond Faster)
 * with animated switching. Each tab shows a headline, description,
 * feature bullet list, and an illustration/screenshot.
 *
 * Tab content area has consistent min-height to prevent layout shift.
 * Illustrations are lazy-loaded with blur-up placeholder.
 *
 * All content driven by the `capabilities` config array.
 */
export function AIFeatureTabsSection({
  capabilities,
  headline = "AI-Powered Intelligence",
}: AIFeatureTabsSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

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

  if (capabilities.length === 0) return null;

  return (
    <div
      ref={sectionRef}
      className={cn(
        "transition-[opacity,transform] duration-700",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
      )}
    >
      <h2 className="text-center font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
        {headline}
      </h2>

      {/* Tab buttons */}
      <div
        className="mt-8 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="AI capabilities"
      >
        {capabilities.map((cap, i) => (
          <TabButton
            key={cap.tabLabel}
            label={cap.tabLabel}
            isActive={i === activeTab}
            onClick={() => handleTabChange(i)}
          />
        ))}
      </div>

      {/* Tab panels — min-height prevents CLS during tab switching */}
      <div className="relative mt-10 min-h-[420px] md:min-h-[380px] lg:min-h-[360px]">
        {capabilities.map((cap, i) => (
          <TabPanel
            key={cap.tabLabel}
            capability={cap}
            isActive={i === activeTab}
          />
        ))}
      </div>
    </div>
  );
}
