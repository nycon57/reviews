"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Route label mappings for cleaner display
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  reviews: "Reviews",
  surveys: "Surveys",
  analytics: "Analytics",
  trends: "Trends",
  leaderboard: "Leaderboard",
  campaigns: "Email Campaigns",
  send: "Send Survey",
  team: "Team",
  settings: "Settings",
  help: "Help & Support",
  profile: "Profile",
  billing: "Billing",
};

function getLabel(segment: string): string {
  return routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    breadcrumbs.push({
      label: getLabel(segment),
      href: currentPath,
    });
  }

  return breadcrumbs;
}

interface BreadcrumbsProps {
  className?: string;
  items?: BreadcrumbItem[];
}

export function Breadcrumbs({ className, items }: BreadcrumbsProps) {
  const pathname = usePathname();
  const breadcrumbs = items ?? generateBreadcrumbs(pathname);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1 text-sm">
        <li>
          <Link
            href="/dashboard"
            className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        {breadcrumbs.slice(1).map((item, index) => {
          const isLast = index === breadcrumbs.length - 2;
          return (
            <li key={item.href} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
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
