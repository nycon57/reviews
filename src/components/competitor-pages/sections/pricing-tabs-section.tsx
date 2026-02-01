"use client";

import { Check, X } from "@phosphor-icons/react";
import type { PricingTab, PricingComparisonRow } from "@/lib/competitor-pages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PricingTabsSectionProps {
  tabs: PricingTab[];
}

/** Renders a boolean or text value in a comparison cell. */
function ComparisonValue({
  value,
  variant,
}: {
  value: string | boolean;
  variant: "repwell" | "competitor";
}) {
  if (typeof value === "boolean") {
    return value ? (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          variant === "repwell"
            ? "bg-repwell-sage-200/20 text-repwell-sage-200"
            : "bg-red-50 text-red-400",
        )}
      >
        {value ? (
          <Check weight="bold" className="h-4 w-4" />
        ) : (
          <X weight="bold" className="h-4 w-4" />
        )}
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded-full",
          "bg-red-50 text-red-400",
        )}
      >
        <X weight="bold" className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-sm font-medium",
        variant === "repwell"
          ? "text-repwell-teal-500"
          : "text-repwell-teal-400/70",
      )}
    >
      {value}
    </span>
  );
}

/** Single row in the pricing comparison table. */
function ComparisonRow({ row }: { row: PricingComparisonRow }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 border-b border-border/50 py-3.5 last:border-b-0">
      <span className="text-sm font-medium text-repwell-teal-500">
        {row.feature}
      </span>
      <div className="flex justify-center">
        <ComparisonValue value={row.repwell} variant="repwell" />
      </div>
      <div className="flex justify-center">
        <ComparisonValue value={row.competitor} variant="competitor" />
      </div>
    </div>
  );
}

/**
 * Section 3: Pricing comparison tabs.
 *
 * Uses ShadCN Tabs (Radix) for keyboard-accessible, ARIA-compliant
 * tab switching with animated content transitions. Each tab shows a
 * headline, body text, comparison rows, and a CTA button.
 *
 * Content is driven entirely by the CompetitorPageConfig.pricingTabs array.
 */
export function PricingTabsSection({ tabs }: PricingTabsSectionProps) {
  if (tabs.length === 0) return null;

  const defaultTab = tabs[0].tabLabel;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Section heading */}
      <div className="text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
          Pricing Comparison
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-sans text-lg leading-relaxed text-repwell-teal-400">
          See how RepWell delivers more value at every level
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={defaultTab} className="mt-10">
        <TabsList
          variant="pills"
          className="flex w-full justify-center"
        >
          {tabs.map((tab) => (
            <TabsTrigger key={tab.tabLabel} value={tab.tabLabel} variant="pills">
              {tab.tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent
            key={tab.tabLabel}
            value={tab.tabLabel}
            className="mt-8 animate-fade-in-up"
          >
            {/* Tab headline and body */}
            <div className="mb-6 text-center">
              <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 md:text-2xl">
                {tab.headline}
              </h3>
              <p className="mt-2 font-sans text-base leading-relaxed text-repwell-teal-400">
                {tab.body}
              </p>
            </div>

            {/* Comparison table */}
            {tab.comparisonRows.length > 0 && (
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
                {/* Table header */}
                <div className="grid grid-cols-3 items-center gap-4 border-b border-border pb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-repwell-teal-400/60">
                    Feature
                  </span>
                  <span className="text-center text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
                    RepWell
                  </span>
                  <span className="text-center text-xs font-semibold uppercase tracking-wider text-repwell-teal-400/60">
                    Competitor
                  </span>
                </div>

                {/* Comparison rows */}
                {tab.comparisonRows.map((row) => (
                  <ComparisonRow key={row.feature} row={row} />
                ))}
              </div>
            )}

            {/* CTA button */}
            <div className="mt-8 text-center">
              <a
                href="#footer-cta"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-repwell-teal-300 px-8 py-3.5 font-sans text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-repwell-teal-400 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2 active:scale-[0.98]"
              >
                {tab.ctaLabel}
              </a>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
