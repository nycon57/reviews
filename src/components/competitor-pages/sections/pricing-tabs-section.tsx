"use client";

import type { PricingTab } from "@/lib/competitor-pages";
import { useState } from "react";

interface PricingTabsSectionProps {
  tabs: PricingTab[];
}

/**
 * Section 3: Pricing comparison tabs.
 * Full implementation in S117.
 */
export function PricingTabsSection({ tabs }: PricingTabsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const tab = tabs[activeTab];

  return (
    <div className="text-center">
      <h2 className="font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        Pricing Comparison
      </h2>
      <div className="mt-8 flex justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.tabLabel}
            onClick={() => setActiveTab(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              i === activeTab
                ? "bg-repwell-teal-300 text-white"
                : "text-repwell-teal-400 hover:bg-repwell-sage-100/30"
            }`}
          >
            {t.tabLabel}
          </button>
        ))}
      </div>
      {tab && (
        <div className="mx-auto mt-8 max-w-3xl text-left">
          <h3 className="text-xl font-semibold text-repwell-teal-500">
            {tab.headline}
          </h3>
          <p className="mt-2 text-repwell-teal-400">{tab.body}</p>
        </div>
      )}
    </div>
  );
}
