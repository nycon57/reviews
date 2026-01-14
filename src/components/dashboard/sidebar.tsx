"use client";

import * as React from "react";
import Link from "next/link";
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
  Home,
  Star,
  FileText,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  ChevronDown,
  TrendingUp,
  Trophy,
  Send,
  Mail,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Sparkles,
  Quote,
  Building,
  MapPin,
  Award,
  ClipboardList,
  Zap,
  ArrowRight,
  Eye,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  isNew?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "All Reviews",
    href: "/dashboard/all-reviews",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    title: "Review Queue",
    href: "/dashboard/reviews",
    icon: <Star className="h-4 w-4" />,
  },
  {
    title: "Surveys",
    href: "/dashboard/surveys",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Listings",
    href: "/dashboard/listings",
    icon: <MapPin className="h-4 w-4" />,
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
      },
      {
        title: "Responses",
        href: "/dashboard/responses",
        icon: <MessageSquare className="h-4 w-4" />,
      },
      {
        title: "Team",
        href: "/dashboard/team",
        icon: <Users className="h-4 w-4" />,
      },
    ],
  },
  {
    title: "People",
    defaultOpen: true,
    items: [
      {
        title: "Recognition",
        href: "/dashboard/recognition",
        icon: <Award className="h-4 w-4" />,
      },
      {
        title: "EX Surveys",
        href: "/dashboard/ex-surveys",
        icon: <ClipboardList className="h-4 w-4" />,
        isNew: true,
      },
    ],
  },
  {
    title: "Analytics",
    defaultOpen: false,
    items: [
      {
        title: "Overview",
        href: "/dashboard/analytics",
        icon: <BarChart3 className="h-4 w-4" />,
      },
      {
        title: "Trends",
        href: "/dashboard/analytics/trends",
        icon: <TrendingUp className="h-4 w-4" />,
      },
      {
        title: "Leaderboard",
        href: "/dashboard/analytics/leaderboard",
        icon: <Trophy className="h-4 w-4" />,
      },
      {
        title: "AI Insights",
        href: "/dashboard/insights",
        icon: <Sparkles className="h-4 w-4" />,
        isNew: true,
      },
      {
        title: "AI Visibility",
        href: "/dashboard/geo",
        icon: <Eye className="h-4 w-4" />,
        isNew: true,
      },
      {
        title: "Testimonials",
        href: "/dashboard/testimonials",
        icon: <Quote className="h-4 w-4" />,
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
      },
      {
        title: "Send Survey",
        href: "/dashboard/send",
        icon: <Send className="h-4 w-4" />,
      },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Organization",
    href: "/dashboard/organization",
    icon: <Building className="h-4 w-4" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: "Help & Support",
    href: "/dashboard/help",
    icon: <HelpCircle className="h-4 w-4" />,
  },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-brand-silver bg-white transition-all duration-300 ease-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-brand-silver px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue shadow-sm">
            <Star className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-lg font-bold text-brand-navy overflow-hidden whitespace-nowrap"
              >
                ReviewHub
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Main navigation">
          {/* Primary nav items */}
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}

          {/* Divider */}
          <div className="my-4 h-px bg-brand-silver" />

          {/* Grouped nav items */}
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.title}
              group={group}
              isActive={isActive}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Upgrade CTA */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl bg-gradient-to-br from-brand-blue to-brand-iris p-4 text-white shadow-lg">
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
                className="w-full bg-white text-brand-blue hover:bg-white/90 font-medium text-sm h-9 group"
              >
                View Plans
                <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="border-t border-brand-silver px-3 py-4">
        <nav className="flex flex-col gap-1" aria-label="Secondary navigation">
          {bottomNavItems.map((item) => (
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
}

function NavLink({ item, isActive, collapsed }: NavLinkProps) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/30",
        isActive
          ? "bg-brand-frost text-brand-blue"
          : "text-brand-slate hover:bg-brand-frost/50 hover:text-brand-navy",
        collapsed && "justify-center px-2"
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.title : undefined}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute left-0 inset-y-0 my-auto w-[3px] h-5 bg-brand-blue rounded-r-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      <span className={cn(
        "transition-colors duration-150",
        isActive ? "text-brand-blue" : "text-brand-slate group-hover:text-brand-navy"
      )}>
        {item.icon}
      </span>

      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1"
          >
            {item.title}
          </motion.span>
        )}
      </AnimatePresence>

      {/* NEW badge */}
      {!collapsed && item.isNew && (
        <span className="rounded-full bg-brand-amber px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wide shadow-sm">
          New
        </span>
      )}

      {/* Badge count */}
      {!collapsed && item.badge && (
        <span className="rounded-full bg-brand-frost px-2 py-0.5 text-xs font-semibold text-brand-blue">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

interface NavGroupSectionProps {
  group: NavGroup;
  isActive: (href: string) => boolean;
  collapsed: boolean;
}

function NavGroupSection({ group, isActive, collapsed }: NavGroupSectionProps) {
  const [open, setOpen] = React.useState(group.defaultOpen ?? false);
  const hasActiveItem = group.items.some((item) => isActive(item.href));

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
          />
        ))}
      </>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-1">
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-brand-slate/70 hover:text-brand-slate transition-colors duration-150"
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
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
