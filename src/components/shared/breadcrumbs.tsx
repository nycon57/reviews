"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  CaretRight as ChevronRight,
  House as Home,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
}

// Route label mappings for cleaner display. Keys are path segments; values are
// the labels shown in the dashboard IA (ADR 0007). The org-scoped area lives at
// /dashboard/organization but reads as "Workspace" everywhere in the UI.
const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  reviews: "Reviews",
  contacts: "Contacts",
  tasks: "Tasks",
  surveys: "Surveys",
  widgets: "Widgets",
  analytics: "Analytics",
  trends: "Trends",
  leaderboard: "Leaderboard",
  insights: "AI Insights",
  campaigns: "Campaigns",
  send: "Send review request",
  people: "People",
  members: "Members",
  employees: "Employees",
  team: "Team",
  recognition: "Recognition",
  organization: "Workspace",
  branches: "Branches",
  "ex-surveys": "EX Surveys",
  media: "Media",
  reports: "Reports",
  approvals: "Approvals",
  notifications: "Notifications",
  settings: "Settings",
  "email-preferences": "Email Preferences",
  help: "Help & Support",
  profile: "Profile",
  billing: "Billing",
};

// UUIDs and other opaque identifiers make poor crumbs; collapse them to "Details".
const ID_SEGMENT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getLabel(segment: string): string {
  if (routeLabels[segment]) return routeLabels[segment];
  if (ID_SEGMENT.test(segment) || /^\d+$/.test(segment)) return "Details";
  // Humanize kebab-case slugs: "video-testimonials" → "Video Testimonials".
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
  const searchParams = useSearchParams();
  const breadcrumbs = items ?? generateBreadcrumbs(pathname);

  // Tab-addressed destinations (People?tab=employees, Workspace?tab=billing,
  // Reviews?tab=contacts) are real navigation targets in the IA — surface the
  // active tab as the final crumb when we know a label for it.
  const tab = items ? null : searchParams.get("tab");
  if (tab && routeLabels[tab] && breadcrumbs.length > 0) {
    const last = breadcrumbs[breadcrumbs.length - 1];
    if (last.label !== routeLabels[tab]) {
      breadcrumbs.push({
        label: routeLabels[tab],
        href: `${pathname}?tab=${tab}`,
      });
    }
  }

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
