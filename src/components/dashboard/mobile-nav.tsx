"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  List as Menu,
  House as Home,
  Star,
  FileText,
  ChartBar as BarChart3,
  Users,
  Gear as Settings,
  Question as HelpCircle,
  TrendUp as TrendingUp,
  Trophy,
  PaperPlaneRight as Send,
  Envelope as Mail,
} from "@phosphor-icons/react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: <Home className="h-5 w-5" />,
  },
  {
    title: "Reviews",
    href: "/dashboard/reviews",
    icon: <Star className="h-5 w-5" />,
  },
  {
    title: "Surveys",
    href: "/dashboard/surveys",
    icon: <FileText className="h-5 w-5" />,
  },
];

const analyticsItems: NavItem[] = [
  {
    title: "Analytics Overview",
    href: "/dashboard/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Trends",
    href: "/dashboard/analytics/trends",
    icon: <TrendingUp className="h-5 w-5" />,
  },
  {
    title: "Leaderboard",
    href: "/dashboard/analytics/leaderboard",
    icon: <Trophy className="h-5 w-5" />,
  },
];

const distributionItems: NavItem[] = [
  {
    title: "Email Campaigns",
    href: "/dashboard/campaigns",
    icon: <Mail className="h-5 w-5" />,
  },
  {
    title: "Send Survey",
    href: "/dashboard/send",
    icon: <Send className="h-5 w-5" />,
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Team",
    href: "/dashboard/team",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Help & Support",
    href: "/dashboard/help",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-9 w-9", className)}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center">
            <Image
              src="https://temwotqafrafajehuiuh.supabase.co/storage/v1/object/public/repwell/branding/RepWell-Logo-Full-Color.png"
              alt="RepWell"
              width={120}
              height={28}
              className="h-7 w-auto"
            />
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-4rem)]">
          <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
            {/* Main navigation */}
            {mainNavItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleNavClick}
              />
            ))}

            <Separator className="my-3" />

            {/* Analytics */}
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Analytics
            </p>
            {analyticsItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleNavClick}
              />
            ))}

            <Separator className="my-3" />

            {/* Distribution */}
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Distribution
            </p>
            {distributionItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleNavClick}
              />
            ))}

            <Separator className="my-3" />

            {/* Bottom navigation */}
            {bottomNavItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleNavClick}
              />
            ))}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

interface MobileNavLinkProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function MobileNavLink({ item, isActive, onClick }: MobileNavLinkProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      <span>{item.title}</span>
    </Link>
  );
}

// Export the trigger component for use in Header
export function MobileNavTrigger({ className }: { className?: string }) {
  return <MobileNav className={className} />;
}
