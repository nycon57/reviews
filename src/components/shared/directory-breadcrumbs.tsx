"use client";

import Link from "next/link";
import {
  CaretRight as ChevronRight,
  MagnifyingGlass as Search,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Re-export utilities from the shared lib for backwards compatibility
export {
  type DirectoryBreadcrumbItem,
  getIndustryLabel,
  getIndustrySlug,
  parseIndustrySlug,
  buildProfessionalBreadcrumbs,
  buildCompanyBreadcrumbs,
  buildIndustryBreadcrumbs,
} from "@/lib/directory/breadcrumb-utils";

import type { DirectoryBreadcrumbItem } from "@/lib/directory/breadcrumb-utils";

interface DirectoryBreadcrumbsProps {
  items: DirectoryBreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumbs component for public directory pages
 * Supports: Directory → Industry → Company → Professional
 */
export function DirectoryBreadcrumbs({ items, className }: DirectoryBreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Directory breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm">
        {/* Directory root */}
        <li>
          <Link
            href="/directory"
            className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Find a Professional</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              {isLast ? (
                <span
                  className="font-medium text-foreground truncate max-w-[200px] sm:max-w-none"
                  aria-current="page"
                  title={item.label}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground truncate max-w-[150px] sm:max-w-none"
                  title={item.label}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
