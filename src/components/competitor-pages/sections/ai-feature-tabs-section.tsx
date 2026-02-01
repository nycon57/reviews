"use client";

import type { AICapabilityTab } from "@/lib/competitor-pages";
import { useState } from "react";

interface AIFeatureTabsSectionProps {
  capabilities: AICapabilityTab[];
}

/**
 * Section 8: AI capability tabs.
 * Full implementation in S120.
 */
export function AIFeatureTabsSection({
  capabilities,
}: AIFeatureTabsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const cap = capabilities[activeTab];

  return (
    <div>
      <h2 className="text-center font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
        AI-Powered Capabilities
      </h2>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {capabilities.map((c, i) => (
          <button
            key={c.tabLabel}
            onClick={() => setActiveTab(i)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              i === activeTab
                ? "bg-repwell-teal-300 text-white"
                : "text-repwell-teal-400 hover:bg-repwell-sage-100/30"
            }`}
          >
            {c.tabLabel}
          </button>
        ))}
      </div>
      {cap && (
        <div className="mx-auto mt-8 max-w-3xl">
          <h3 className="text-xl font-semibold text-repwell-teal-500">
            {cap.headline}
          </h3>
          <p className="mt-2 text-repwell-teal-400">{cap.description}</p>
          <ul className="mt-4 space-y-2">
            {cap.features.map((f) => (
              <li key={f} className="text-sm text-repwell-teal-400">
                &bull; {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
