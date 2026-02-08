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
  Lightning as Zap,
  ArrowRight,
  Lock,
} from "@phosphor-icons/react";
import { usePermissions } from "@/lib/permissions/context";
import {
  useFilteredNav,
  ICON_MAP,
  type FilteredNavItem,
  type FilteredNavSection,
} from "@/lib/nav";

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, collapsed = false, onCollapsedChange: _onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { shouldShowUpgradeCTA } = usePermissions();
  const { coreItems, sections, bottomItems } = useFilteredNav();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

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
          {/* Core items */}
          {coreItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              collapsed={collapsed}
            />
          ))}

          {/* Sections with dividers */}
          {sections.map((section) => (
            <SectionDivider
              key={section.label}
              section={section}
              isActive={isActive}
              collapsed={collapsed}
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
          {bottomItems.map((item) => (
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

interface SectionDividerProps {
  section: FilteredNavSection;
  isActive: (href: string) => boolean;
  collapsed: boolean;
}

function SectionDivider({ section, isActive, collapsed }: SectionDividerProps) {
  return (
    <>
      {/* Divider line + label (hidden when collapsed) */}
      {!collapsed ? (
        <>
          <div className="my-3 h-px bg-border" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-repwell-teal-400/70 px-3 py-2">
            {section.label}
          </span>
        </>
      ) : (
        <div className="my-2 h-px bg-border" />
      )}

      {section.items.map((item) => (
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

interface NavLinkProps {
  item: FilteredNavItem;
  isActive: boolean;
  collapsed: boolean;
}

const NavLink = React.memo(function NavLink({ item, isActive, collapsed }: NavLinkProps) {
  const { isProLocked } = item;
  // If Pro locked, link to billing instead of the actual route
  const href = isProLocked ? "/dashboard/settings/billing" : item.href;

  const IconComponent = ICON_MAP[item.icon];

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
        {IconComponent ? <IconComponent className="h-4 w-4" /> : null}
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
