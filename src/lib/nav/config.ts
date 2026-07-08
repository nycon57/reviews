import { type Permission, PERMISSIONS } from "@/lib/permissions";

export interface NavItemConfig {
  title: string;
  href: string;
  /** Phosphor icon name (PascalCase) */
  icon: string;
  badge?: string;
  isNew?: boolean;
  /** Permission required to see this item */
  permission?: Permission;
  /** Requires Pro tier — shows lock icon if not Pro */
  requiresPro?: boolean;
}

export interface NavSectionConfig {
  label: string;
  items: NavItemConfig[];
}

export interface NavConfig {
  coreItems: NavItemConfig[];
  sections: NavSectionConfig[];
  bottomItems: NavItemConfig[];
}

/**
 * Shared navigation configuration consumed by sidebar + mobile nav.
 * Permission filtering happens in `useFilteredNav`.
 */
export const NAV_CONFIG: NavConfig = {
  coreItems: [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: "House",
      permission: PERMISSIONS.VIEW_DASHBOARD,
    },
    {
      title: "Reviews",
      href: "/dashboard/reviews",
      icon: "Star",
      permission: PERMISSIONS.VIEW_REVIEWS,
    },
    // Contacts is a tab in the reviews content hub, promoted to a Core
    // destination (ADR 0007). Deep-links to the hub's Contacts tab.
    {
      title: "Contacts",
      href: "/dashboard/reviews?tab=contacts",
      icon: "AddressBook",
      permission: PERMISSIONS.VIEW_REVIEWS,
      isNew: true,
    },
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: "ClipboardText",
      permission: PERMISSIONS.VIEW_TASKS,
    },
    // Campaigns absorbs the former "Emails" nav item (ADR 0007): Sequences
    // (workflow builder) + Templates (email builder) tabs.
    {
      title: "Campaigns",
      href: "/dashboard/campaigns",
      icon: "Envelope",
      permission: PERMISSIONS.VIEW_CAMPAIGNS,
    },
    // Enterprise-only
    {
      title: "Recognition",
      href: "/dashboard/recognition",
      icon: "Medal",
      permission: PERMISSIONS.VIEW_RECOGNITION,
    },
  ],

  sections: [
    {
      label: "Insights",
      items: [
        {
          title: "Analytics",
          href: "/dashboard/analytics",
          icon: "ChartBar",
          permission: PERMISSIONS.VIEW_ANALYTICS,
        },
        {
          title: "Trends",
          href: "/dashboard/analytics/trends",
          icon: "TrendUp",
          permission: PERMISSIONS.VIEW_TRENDS,
        },
        {
          title: "Leaderboard",
          href: "/dashboard/analytics/leaderboard",
          icon: "Trophy",
          permission: PERMISSIONS.VIEW_LEADERBOARD,
        },
        {
          title: "Agents",
          href: "/dashboard/analytics/agents",
          icon: "Sparkle",
          permission: PERMISSIONS.VIEW_TEAM,
        },
        // Team performance overview moved out of the Team page into Insights
        // (ADR 0007); member management now lives under People.
        {
          title: "Team",
          href: "/dashboard/analytics/team",
          icon: "SquaresFour",
          permission: PERMISSIONS.VIEW_TEAM,
        },
        {
          title: "AI Insights",
          href: "/dashboard/insights",
          icon: "Sparkle",
          permission: PERMISSIONS.VIEW_AI_INSIGHTS,
          requiresPro: true,
        },
      ],
    },
    {
      label: "Manage",
      items: [
        // People: one destination, two rosters — Members (platform accounts)
        // and Employees (EX roster). Absorbs Team→Management, Org→Users, and
        // the standalone Employees page (ADR 0007).
        {
          title: "People",
          href: "/dashboard/people",
          icon: "Users",
          permission: PERMISSIONS.VIEW_TEAM,
          isNew: true,
        },
        {
          title: "Surveys",
          href: "/dashboard/surveys",
          icon: "FileText",
          permission: PERMISSIONS.VIEW_SURVEYS,
        },
        {
          title: "EX Surveys",
          href: "/dashboard/ex-surveys",
          icon: "ClipboardText",
          permission: PERMISSIONS.VIEW_EX_SURVEYS,
        },
        {
          title: "Widgets",
          href: "/dashboard/widgets",
          icon: "Code",
          permission: PERMISSIONS.VIEW_DASHBOARD,
        },
        {
          title: "Media",
          href: "/dashboard/media",
          icon: "Images",
          permission: PERMISSIONS.VIEW_ORGANIZATION,
        },
        // The org-scoped area ("Us") — billing, branding, integrations,
        // webhooks, API keys, templates, org settings (ADR 0007). Route stays
        // /dashboard/organization; the destination reads as "Workspace".
        {
          title: "Workspace",
          href: "/dashboard/organization",
          icon: "Buildings",
          permission: PERMISSIONS.VIEW_ORGANIZATION,
        },
      ],
    },
  ],

  bottomItems: [
    {
      title: "Settings",
      href: "/dashboard/settings",
      icon: "Gear",
      permission: PERMISSIONS.VIEW_SETTINGS,
    },
    {
      title: "Help & Support",
      href: "/dashboard/help",
      icon: "Question",
      permission: PERMISSIONS.VIEW_HELP,
    },
  ],
};
