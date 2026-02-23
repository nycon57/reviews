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
    {
      title: "Surveys",
      href: "/dashboard/surveys",
      icon: "FileText",
      permission: PERMISSIONS.MANAGE_SURVEY_TEMPLATES,
    },
    {
      title: "Requests",
      href: "/dashboard/requests",
      icon: "PaperPlaneRight",
      permission: PERMISSIONS.SEND_SURVEY,
    },
    {
      title: "Share Studio",
      href: "/dashboard/share-studio",
      icon: "ShareNetwork",
      permission: PERMISSIONS.VIEW_TESTIMONIALS,
    },
    {
      title: "Messages",
      href: "/dashboard/messages",
      icon: "ChatCircle",
      permission: PERMISSIONS.VIEW_MESSAGES,
      isNew: true,
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
          title: "Team Overview",
          href: "/dashboard/manager",
          icon: "SquaresFour",
          permission: PERMISSIONS.VIEW_MANAGER_DASHBOARD,
        },
        {
          title: "Team Members",
          href: "/dashboard/team",
          icon: "Users",
          permission: PERMISSIONS.VIEW_TEAM,
        },
        {
          title: "EX Surveys",
          href: "/dashboard/ex-surveys",
          icon: "ClipboardText",
          permission: PERMISSIONS.VIEW_EX_SURVEYS,
          isNew: true,
        },
        {
          title: "Contacts",
          href: "/dashboard/contacts",
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
      label: "Organization",
      items: [
        {
          title: "Organization",
          href: "/dashboard/organization",
          icon: "Buildings",
          permission: PERMISSIONS.VIEW_ORGANIZATION,
        },
        {
          title: "Widgets",
          href: "/dashboard/widgets",
          icon: "Code",
          permission: PERMISSIONS.VIEW_DASHBOARD,
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
