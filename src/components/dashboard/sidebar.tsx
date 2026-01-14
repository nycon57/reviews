"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  PanelLeftClose,
  PanelLeft,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Sparkles,
  Quote,
  Building,
  MapPin,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
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
        "flex h-full flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Star className="h-6 w-6 text-sidebar-primary" />
          {!collapsed && <span className="text-lg font-semibold">ReviewHub</span>}
        </Link>
        {onCollapsedChange && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground",
              collapsed && "ml-0"
            )}
            onClick={() => onCollapsedChange(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 px-2 py-4">
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

          <Separator className="my-3" />

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

      {/* Bottom Navigation */}
      <div className="border-t px-2 py-4">
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70",
        collapsed && "justify-center px-2"
      )}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.title : undefined}
    >
      {item.icon}
      {!collapsed && <span>{item.title}</span>}
      {!collapsed && item.badge && (
        <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs text-sidebar-primary-foreground">
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
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <span>{group.title}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pl-3">
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
