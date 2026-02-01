"use client";

import { useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { IndustryType } from "@/lib/industry/types";
import {
  Buildings as Building2,
  House,
  ShieldCheck,
  ChartLine,
  FirstAidKit,
  Wrench,
  Scales,
  Lightbulb,
} from "@phosphor-icons/react";

// Industry configuration for the filter
export const industryFilterConfig: Record<
  IndustryType,
  {
    label: string;
    slug: string;
    icon: React.ComponentType<{ className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>;
  }
> = {
  mortgage: { label: "Mortgage", slug: "mortgage", icon: Building2 },
  real_estate: { label: "Real Estate", slug: "real-estate", icon: House },
  insurance: { label: "Insurance", slug: "insurance", icon: ShieldCheck },
  financial_advisory: { label: "Financial", slug: "financial-advisory", icon: ChartLine },
  healthcare: { label: "Healthcare", slug: "healthcare", icon: FirstAidKit },
  home_services: { label: "Home Services", slug: "home-services", icon: Wrench },
  legal: { label: "Legal", slug: "legal", icon: Scales },
  consulting: { label: "Consulting", slug: "consulting", icon: Lightbulb },
};

interface IndustryFilterProps {
  /** Currently selected industry (null for "All") */
  selected?: IndustryType | null;
  /** Available industries with counts (optional - if not provided, shows all) */
  industries?: { value: IndustryType; label: string; count: number }[];
  /** Mode: 'link' navigates to /directory/[industry], 'filter' uses search params */
  mode?: "link" | "filter";
  /** Callback when industry changes (for filter mode) */
  onChange?: (industry: IndustryType | null) => void;
  className?: string;
}

/**
 * Horizontal scrollable industry filter pills
 */
export function IndustryFilter({
  selected,
  industries,
  mode = "link",
  onChange,
  className,
}: IndustryFilterProps) {
  // Get all industries to display (either from props or all available)
  const displayIndustries = industries || Object.entries(industryFilterConfig).map(([value]) => ({
    value: value as IndustryType,
    label: industryFilterConfig[value as IndustryType].label,
    count: 0,
  }));

  const handleClick = useCallback(
    (industry: IndustryType | null) => {
      if (mode === "filter") {
        onChange?.(industry);
      } else {
        // Link mode - handled by Link component
      }
    },
    [mode, onChange]
  );

  const buildUrl = (industry: IndustryType | null) => {
    if (industry === null) {
      return "/directory";
    }
    const slug = industryFilterConfig[industry].slug;
    return `/directory/${slug}`;
  };

  const renderPill = (
    industry: IndustryType | null,
    label: string,
    Icon?: React.ComponentType<{ className?: string; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone" }>,
    count?: number
  ) => {
    const isActive = selected === industry;
    const content = (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        )}
      >
        {Icon && <Icon className="h-4 w-4" weight={isActive ? "fill" : "regular"} />}
        {label}
        {count !== undefined && count > 0 && (
          <span
            className={cn(
              "ml-1 text-xs",
              isActive ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            ({count})
          </span>
        )}
      </span>
    );

    if (mode === "link") {
      return (
        <Link
          href={buildUrl(industry)}
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => handleClick(industry)}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-full"
      >
        {content}
      </button>
    );
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {/* All option */}
      {renderPill(null, "All")}

      {/* Industry pills */}
      {displayIndustries.map(({ value, label, count }) => {
        const config = industryFilterConfig[value];
        return (
          <div key={value}>
            {renderPill(value, config?.label || label, config?.icon, count)}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact version for mobile / narrow spaces
 */
export function IndustryFilterCompact({
  selected,
  industries,
  onChange: _onChange,
  className,
}: Omit<IndustryFilterProps, "mode">) {
  const displayIndustries = industries || Object.entries(industryFilterConfig).map(([value]) => ({
    value: value as IndustryType,
    label: industryFilterConfig[value as IndustryType].label,
    count: 0,
  }));

  return (
    <div className={cn("flex overflow-x-auto pb-2 -mx-4 px-4 gap-2 scrollbar-hide", className)}>
      {/* All option */}
      <Link
        href="/directory"
        className={cn(
          "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
          selected === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground hover:text-foreground"
        )}
      >
        All
      </Link>

      {displayIndustries.map(({ value, count }) => {
        const config = industryFilterConfig[value];
        const Icon = config?.icon;
        const isActive = selected === value;

        return (
          <Link
            key={value}
            href={`/directory/${config?.slug}`}
            className={cn(
              "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {Icon && <Icon className="h-4 w-4" weight={isActive ? "fill" : "regular"} />}
            {config?.label}
            {count > 0 && (
              <span className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                ({count})
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
