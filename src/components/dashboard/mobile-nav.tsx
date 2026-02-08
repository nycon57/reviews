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
import { List as Menu, Lock } from "@phosphor-icons/react";
import {
  useFilteredNav,
  ICON_MAP,
  type FilteredNavItem,
} from "@/lib/nav";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { coreItems, sections, bottomItems } = useFilteredNav();

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
            {/* Core items */}
            {coreItems.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
                onClick={handleNavClick}
              />
            ))}

            {/* Sections with labels */}
            {sections.map((section) => (
              <React.Fragment key={section.label}>
                <Separator className="my-3" />
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-repwell-teal-400/70 px-3">
                  {section.label}
                </p>
                {section.items.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    item={item}
                    isActive={isActive(item.href)}
                    onClick={handleNavClick}
                  />
                ))}
              </React.Fragment>
            ))}

            <Separator className="my-3" />

            {/* Bottom items */}
            {bottomItems.map((item) => (
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
  item: FilteredNavItem;
  isActive: boolean;
  onClick: () => void;
}

function MobileNavLink({ item, isActive, onClick }: MobileNavLinkProps) {
  const { isProLocked } = item;
  const href = isProLocked ? "/dashboard/settings/billing" : item.href;
  const IconComponent = ICON_MAP[item.icon];

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/30",
        isActive && !isProLocked
          ? "bg-repwell-sage-100 text-repwell-teal-300"
          : isProLocked
            ? "text-repwell-teal-400/60 hover:bg-repwell-sage-100/30"
            : "text-repwell-teal-400 hover:bg-repwell-sage-100/50 hover:text-repwell-teal-500"
      )}
      aria-current={isActive && !isProLocked ? "page" : undefined}
    >
      <span className={cn(
        "transition-colors duration-150",
        isActive && !isProLocked
          ? "text-repwell-teal-300"
          : isProLocked
            ? "text-repwell-teal-400/60"
            : "text-repwell-teal-400"
      )}>
        {IconComponent ? <IconComponent className="h-5 w-5" /> : null}
      </span>
      <span className="flex-1">{item.title}</span>

      {/* Pro lock icon */}
      {isProLocked && (
        <Lock className="h-3.5 w-3.5 text-repwell-teal-400/50" />
      )}

      {/* NEW badge - don't show if Pro locked */}
      {item.isNew && !isProLocked && (
        <span className="rounded-full bg-warning px-2 py-0.5 text-[10px] font-bold text-black uppercase tracking-wide shadow-sm">
          New
        </span>
      )}

      {/* Pro badge for locked items */}
      {isProLocked && (
        <span className="rounded-full bg-repwell-teal-300/10 px-2 py-0.5 text-[10px] font-bold text-repwell-teal-300 uppercase tracking-wide">
          Pro
        </span>
      )}

      {/* Badge count */}
      {item.badge && !isProLocked && (
        <span className="rounded-full bg-repwell-sage-100 px-2 py-0.5 text-xs font-semibold text-repwell-teal-300">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// Export the trigger component for use in Header
export function MobileNavTrigger({ className }: { className?: string }) {
  return <MobileNav className={className} />;
}
