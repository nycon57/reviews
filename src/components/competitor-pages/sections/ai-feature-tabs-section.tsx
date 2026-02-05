"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle } from "@phosphor-icons/react";
import type { AICapabilityTab } from "@/lib/competitor-pages";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
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
  id,
  panelId,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  id: string;
  panelId: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={isActive}
      aria-controls={panelId}
      tabIndex={isActive ? 0 : -1}
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
  id,
  tabId,
}: {
  capability: AICapabilityTab;
  isActive: boolean;
  id: string;
  tabId: string;
}) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      aria-hidden={!isActive}
      className={cn(
        "transition-[opacity,transform] duration-500",
        isActive
          ? "translate-y-0 opacity-100"
          : "pointer-events-none absolute inset-0 translate-y-2 opacity-0",
      )}
    >
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Text content */}
        <div>
          <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 md:text-2xl">
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
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-repwell-sage-50 shadow-sm">
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

/** Section 8: AI capabilities — tabbed layout with animated panel switching. */
export function AIFeatureTabsSection({
  capabilities,
  headline = "AI-Powered Intelligence",
}: AIFeatureTabsSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();
  const [activeTab, setActiveTab] = useState(0);

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
        onKeyDown={(e) => {
          const count = capabilities.length;
          if (e.key === "ArrowRight") {
            e.preventDefault();
            const next = (activeTab + 1) % count;
            setActiveTab(next);
            (e.currentTarget.children[next] as HTMLElement)?.focus();
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prev = (activeTab - 1 + count) % count;
            setActiveTab(prev);
            (e.currentTarget.children[prev] as HTMLElement)?.focus();
          }
        }}
      >
        {capabilities.map((cap, i) => (
          <TabButton
            key={cap.tabLabel}
            label={cap.tabLabel}
            isActive={i === activeTab}
            onClick={() => setActiveTab(i)}
            id={`ai-tab-${i}`}
            panelId={`ai-panel-${i}`}
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
            id={`ai-panel-${i}`}
            tabId={`ai-tab-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
