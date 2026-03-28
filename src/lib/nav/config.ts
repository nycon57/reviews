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
  /** Hide the entire section for enterprise users with role "user" */
  hideForEnterpriseUser?: boolean;
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
    {
      title: "Tasks",
      href: "/dashboard/tasks",
      icon: "ClipboardText",
      permission: PERMISSIONS.VIEW_TASKS,
    },
    {
      title: "Emails",
      href: "/dashboard/emails",
      icon: "Envelope",
      permission: PERMISSIONS.VIEW_CAMPAIGNS,
    },
    // Enterprise-only: Recognition (after Messages in core nav)
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
          title: "AI Insights",
          href: "/dashboard/insights",
          icon: "Sparkle",
          permission: PERMISSIONS.VIEW_AI_INSIGHTS,
          requiresPro: true,
        },
        // {
        //   title: "AI Visibility",
        //   href: "/dashboard/geo",
        //   icon: "Eye",
        //   permission: PERMISSIONS.VIEW_GEO_VISIBILITY,
        //   requiresPro: true,
        // },
      ],
    },
    {
      label: "Team",
      items: [
        {
          title: "Team",
          href: "/dashboard/team",
          icon: "Users",
          permission: PERMISSIONS.VIEW_TEAM,
        },
        {
          title: "Employees",
          href: "/dashboard/employees",
          icon: "AddressBook",
          permission: PERMISSIONS.VIEW_EX_SURVEYS,
        },
        {
          title: "Campaigns",
          href: "/dashboard/campaigns",
          icon: "Envelope",
          permission: PERMISSIONS.VIEW_CAMPAIGNS,
        },
      ],
    },
    {
      label: "Admin",
      hideForEnterpriseUser: true,
      items: [
        {
          title: "Organization",
          href: "/dashboard/organization",
          icon: "Buildings",
          permission: PERMISSIONS.VIEW_ORGANIZATION,
        },
        {
          title: "Surveys",
          href: "/dashboard/surveys",
          icon: "FileText",
          permission: PERMISSIONS.VIEW_SURVEYS,
        },
        {
          title: "Widgets",
          href: "/dashboard/widgets",
          icon: "Code",
          permission: PERMISSIONS.VIEW_DASHBOARD,
        },
        {
          title: "EX Surveys",
          href: "/dashboard/ex-surveys",
          icon: "ClipboardText",
          permission: PERMISSIONS.VIEW_EX_SURVEYS,
        },
        {
          title: "Media",
          href: "/dashboard/media",
          icon: "Images",
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
