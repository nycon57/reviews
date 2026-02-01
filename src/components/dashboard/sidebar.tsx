"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  House as Home,
  Star,
  FileText,
  ChartBar as BarChart3,
  Users,
  Gear as Settings,
  Question as HelpCircle,
  CaretDown as ChevronDown,
  TrendUp as TrendingUp,
  Trophy,
  PaperPlaneRight as Send,
  Envelope as Mail,
  ChatCircle,
  SquaresFour as LayoutDashboard,
  Sparkle as Sparkles,
  Quotes as Quote,
  Buildings as Building,
  Medal as Award,
  ClipboardText as ClipboardList,
  Lightning as Zap,
  ArrowRight,
  Eye,
  Globe,
  Lock,
} from "@phosphor-icons/react";
import { usePermissions } from "@/lib/permissions/context";
import { PERMISSIONS, type Permission } from "@/lib/permissions";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
  /** Permission required to see this item (hide if not allowed) */
  permission?: Permission;
  /** Requires Pro tier - shows lock icon if not Pro */
  requiresPro?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
  /** Permission required to see entire group (hide if not allowed) */
  permission?: Permission;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    title: "Reviews",
    href: "/dashboard/reviews",
    icon: <Star className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_REVIEWS,
  },
  {
    title: "Surveys",
    href: "/dashboard/surveys",
    icon: <FileText className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_SURVEYS,
  },
  {
    title: "Requests",
    href: "/dashboard/requests",
    icon: <Send className="h-4 w-4" />,
    permission: PERMISSIONS.SEND_SURVEY,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_ANALYTICS,
  },
  {
    title: "Trends",
    href: "/dashboard/analytics/trends",
    icon: <TrendingUp className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_TRENDS,
  },
  {
    title: "Testimonials",
    href: "/dashboard/testimonials",
    icon: <Quote className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_TESTIMONIALS,
  },
  {
    title: "Messages",
    href: "/dashboard/messages",
    icon: <ChatCircle className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_MESSAGES,
    isNew: true,
  },
];

const navGroups: NavGroup[] = [
  {
    title: "Management",
    defaultOpen: true,
    items: [
      {
        title: "Manager Dashboard",
        href: "/dashboard/manager",
        icon: <LayoutDashboard className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_MANAGER_DASHBOARD,
      },
      {
        title: "Team",
        href: "/dashboard/team",
        icon: <Users className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_TEAM,
      },
    ],
  },
  {
    title: "People",
    defaultOpen: true,
    // Enterprise-only team features
    items: [
      {
        title: "Recognition",
        href: "/dashboard/recognition",
        icon: <Award className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_RECOGNITION,
      },
      {
        title: "EX Surveys",
        href: "/dashboard/ex-surveys",
        icon: <ClipboardList className="h-4 w-4" />,
        isNew: true,
        permission: PERMISSIONS.VIEW_EX_SURVEYS,
      },
    ],
  },
  {
    title: "Advanced Analytics",
    defaultOpen: false,
    items: [
      {
        title: "Website Analytics",
        href: "/dashboard/analytics/website",
        icon: <Globe className="h-4 w-4" />,
        isNew: true,
        permission: PERMISSIONS.VIEW_WEBSITE_ANALYTICS,
        requiresPro: true,
      },
      {
        title: "Leaderboard",
        href: "/dashboard/analytics/leaderboard",
        icon: <Trophy className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_LEADERBOARD,
      },
      {
        title: "AI Insights",
        href: "/dashboard/insights",
        icon: <Sparkles className="h-4 w-4" />,
        isNew: true,
        permission: PERMISSIONS.VIEW_AI_INSIGHTS,
        requiresPro: true,
      },
      {
        title: "AI Visibility",
        href: "/dashboard/geo",
        icon: <Eye className="h-4 w-4" />,
        isNew: true,
        permission: PERMISSIONS.VIEW_GEO_VISIBILITY,
        requiresPro: true,
      },
    ],
  },
  {
    title: "Distribution",
    defaultOpen: false,
    items: [
      {
        title: "Email Campaigns",
        href: "/dashboard/campaigns",
        icon: <Mail className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_CAMPAIGNS,
      },
    ],
  },
  {
    title: "Administration",
    defaultOpen: false,
    permission: PERMISSIONS.VIEW_ADMIN_ANALYTICS,
    items: [
      {
        title: "Org Analytics",
        href: "/dashboard/admin/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_ADMIN_ANALYTICS,
      },
      {
        title: "Org Trends",
        href: "/dashboard/admin/trends",
        icon: <TrendingUp className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_ADMIN_ANALYTICS,
      },
      {
        title: "Team Management",
        href: "/dashboard/manager",
        icon: <Users className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_ADMIN_ANALYTICS,
      },
      {
        title: "Organization",
        href: "/dashboard/organization",
        icon: <Building className="h-4 w-4" />,
        permission: PERMISSIONS.VIEW_ORGANIZATION,
      },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
  {
    title: "Help & Support",
    href: "/dashboard/help",
    icon: <HelpCircle className="h-4 w-4" />,
    permission: PERMISSIONS.VIEW_HELP,
  },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed = false, onCollapsedChange: _onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { hasPermission, shouldShowUpgradeCTA, canAccessProFeature } = usePermissions();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Filter nav items by permission
  const filterItems = (items: NavItem[]): NavItem[] => {
    return items.filter((item) => {
      // If no permission required, show the item
      if (!item.permission) return true;
      // Check if user has the required permission
      return hasPermission(item.permission);
    });
  };

  // Filter nav groups - only show groups that have at least one visible item
  // Also check group-level permission if specified
  const filterGroups = (groups: NavGroup[]): NavGroup[] => {
    return groups
      .filter((group) => {
        // If group has a permission requirement, check it
        if (group.permission && !hasPermission(group.permission)) {
          return false;
        }
        return true;
      })
      .map((group) => ({
        ...group,
        items: filterItems(group.items),
      }))
      .filter((group) => group.items.length > 0);
  };

  const visibleMainItems = filterItems(mainNavItems);
  const visibleGroups = filterGroups(navGroups);
  const visibleBottomItems = filterItems(bottomNavItems);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-white transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/dashboard" className="flex items-center">
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-8 w-8 items-center justify-center"
              >
                <Image
                  src="/branding/RepWell-Icon-Full-Color.png"
                  alt="RepWell"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Image
                  src="https://temwotqafrafajehuiuh.supabase.co/storage/v1/object/public/repwell/branding/RepWell-Logo-Full-Color.png"
                  alt="RepWell"
                  width={130}
                  height={32}
                  className="h-8 w-auto"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {/* Primary nav items */}
          {visibleMainItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
              isProLocked={item.requiresPro && !canAccessProFeature()}
            />
          ))}

          {/* Divider */}
          <div className="my-4 h-px bg-border" />

          {/* Grouped nav items */}
          {visibleGroups.map((group) => (
            <NavGroupSection
              key={group.title}
              group={group}
              isActive={isActive}
              collapsed={collapsed}
              canAccessProFeature={canAccessProFeature()}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Upgrade CTA - Only show for individual Basic users */}
      {!collapsed && shouldShowUpgradeCTA() && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-gradient-to-br from-repwell-teal-300 to-repwell-teal-300 p-4 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Zap className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-white/80 mb-3 leading-relaxed">
              Unlock AI insights, unlimited surveys, and priority support.
            </p>
            <Link href="/dashboard/settings/billing">
              <Button
                size="sm"
                className="w-full bg-white text-repwell-teal-300 hover:bg-white/90 font-medium text-sm h-9 group"
              >
                View Plans
                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="border-t border-border px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Secondary navigation">
          {visibleBottomItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  /** When true, shows a lock icon and links to billing page instead */
  isProLocked?: boolean;
}

const NavLink = React.memo(function NavLink({ item, isActive, collapsed, isProLocked }: NavLinkProps) {
  // If Pro locked, link to billing instead of the actual route
  const href = isProLocked ? "/dashboard/settings/billing" : item.href;

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/30",
        isActive && !isProLocked
          ? "bg-repwell-sage-100 text-repwell-teal-300"
          : isProLocked
            ? "text-repwell-teal-400/60 hover:bg-repwell-sage-100/30 hover:text-repwell-teal-400"
            : "text-repwell-teal-400 hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500",
        collapsed && "justify-center px-2"
      )}
      aria-current={isActive && !isProLocked ? "page" : undefined}
      title={collapsed ? (isProLocked ? `${item.title} (Pro)` : item.title) : undefined}
    >
      {/* Active indicator */}
      {isActive && !isProLocked && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 inset-y-0 my-auto w-[3px] h-5 bg-repwell-teal-300 rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span className={cn(
        "transition-colors duration-150",
        isActive && !isProLocked
          ? "text-repwell-teal-300"
          : isProLocked
            ? "text-repwell-teal-400/60 group-hover:text-repwell-teal-400"
            : "text-repwell-teal-400 group-hover:text-repwell-teal-500"
      )}>
        {item.icon}
      </span>

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("flex-1", isProLocked && "text-repwell-teal-400/60")}
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pro lock icon */}
      {!collapsed && isProLocked && (
        <Lock className="h-3.5 w-3.5 text-repwell-teal-400/50" />
      )}

      {/* NEW badge - don't show if Pro locked */}
      {!collapsed && item.isNew && !isProLocked && (
        <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wide shadow-sm">
          New
        </span>
      )}

      {/* Pro badge for locked items */}
      {!collapsed && isProLocked && (
        <span className="rounded-full bg-repwell-teal-300/10 px-2 py-0.5 text-[10px] font-bold text-repwell-teal-300 uppercase tracking-wide">
          Pro
        </span>
      )}

      {/* Badge count */}
      {!collapsed && item.badge && !isProLocked && (
        <span className="rounded-full bg-repwell-sage-100 px-2 py-0.5 text-xs font-semibold text-repwell-teal-300">
          {item.badge}
        </span>
      )}
    </Link>
  );
});

interface NavGroupSectionProps {
  group: NavGroup;
  isActive: (href: string) => boolean;
  collapsed: boolean;
  canAccessProFeature: boolean;
}

function NavGroupSection({ group, isActive, collapsed, canAccessProFeature }: NavGroupSectionProps) {
  const [open, setOpen] = React.useState(group.defaultOpen ?? false);

  // Memoize hasActiveItem to prevent unnecessary recalculations
  const hasActiveItem = React.useMemo(
    () => group.items.some((item) => isActive(item.href)),
    [group.items, isActive]
  );

  // Expand if any item is active
  React.useEffect(() => {
    if (hasActiveItem) {
      setOpen(true);
    }
  }, [hasActiveItem]);

  if (collapsed) {
    return (
      <>
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            isProLocked={item.requiresPro && !canAccessProFeature}
          />
        ))}
      </>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-1">
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-repwell-teal-400/70 hover:text-repwell-teal-400 transition-colors duration-150"
        >
          <span>{group.title}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-200 ease-out",
              open && "rotate-180"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1">
        {group.items.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive(item.href)}
            collapsed={collapsed}
            isProLocked={item.requiresPro && !canAccessProFeature}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
