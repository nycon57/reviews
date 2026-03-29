"use client";

import { useState, useMemo } from "react";
import type { CustomerPageConfig, IndustryTag } from "@/lib/customers/types";
import { industryLabels } from "@/config/customer-pages";
import { CustomerCard } from "./customer-card";

interface CustomersGridProps {
  configs: CustomerPageConfig[];
  industries: IndustryTag[];
}

export function CustomersGrid({ configs, industries }: CustomersGridProps) {
  const [activeIndustry, setActiveIndustry] = useState<IndustryTag | "all">(
    "all",
  );

  const filteredConfigs = useMemo(() => {
    if (activeIndustry === "all") return configs;
    return configs.filter((config) => config.industry === activeIndustry);
  }, [configs, activeIndustry]);

  return (
    <div>
      {/* Industry filter pills */}
      <div className="mb-10 flex flex-wrap justify-center gap-2">
        <button
          onClick={() => setActiveIndustry("all")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeIndustry === "all"
              ? "bg-repwell-teal-300 text-white"
              : "bg-background-subtle text-repwell-teal-400 hover:bg-repwell-sage-100"
          }`}
        >
          All Industries
        </button>
        {industries.map((industry) => (
          <button
            key={industry}
            onClick={() => setActiveIndustry(industry)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeIndustry === industry
                ? "bg-repwell-teal-300 text-white"
                : "bg-background-subtle text-repwell-teal-400 hover:bg-repwell-sage-100"
            }`}
          >
            {industryLabels[industry]}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filteredConfigs.map((config) => (
          <CustomerCard key={config.slug} config={config} />
        ))}
      </div>

      {/* Empty state */}
      {filteredConfigs.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-repwell-teal-400">
            No case studies found for this industry yet.
          </p>
          <button
            onClick={() => setActiveIndustry("all")}
            className="mt-3 text-sm font-medium text-repwell-teal-300 hover:text-repwell-teal-400"
          >
            View all case studies
          </button>
        </div>
      )}
    </div>
  );
}
