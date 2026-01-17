"use client";

import * as React from "react";
import Link from "next/link";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import {
  featureNavItems,
  solutionNavItems,
  industryNavItems,
  type FeatureNavItem,
  type SolutionNavItem,
  type IndustryNavItem,
} from "@/config/navigation";

// Dynamic icon component
function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// Navigation link item for Features and Solutions
function NavLinkItem({
  item,
  type,
}: {
  item: FeatureNavItem | SolutionNavItem;
  type: "feature" | "solution";
}) {
  return (
    <NavigationMenu.Link asChild>
      <Link
        href={item.href}
        className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-repwell-sage-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-repwell-sage-100/70 text-repwell-teal-400 transition-colors group-hover:bg-repwell-teal-300 group-hover:text-white">
          <DynamicIcon name={item.icon} className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-sans text-sm font-semibold text-repwell-teal-500 group-hover:text-repwell-teal-400">
            {item.title}
          </div>
          <div className="font-sans text-xs text-repwell-teal-400/80 line-clamp-2">
            {item.description}
          </div>
        </div>
      </Link>
    </NavigationMenu.Link>
  );
}

// Industry grid item
function IndustryGridItem({ item }: { item: IndustryNavItem }) {
  return (
    <NavigationMenu.Link asChild>
      <Link
        href={item.href}
        className="group flex items-center gap-2 rounded-lg p-2.5 transition-colors hover:bg-repwell-sage-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-repwell-sage-100/70 text-repwell-teal-400 transition-colors group-hover:bg-repwell-teal-300 group-hover:text-white">
          <DynamicIcon name={item.icon} className="h-4 w-4" />
        </div>
        <span className="font-sans text-sm font-medium text-repwell-teal-500 group-hover:text-repwell-teal-400">
          {item.title}
        </span>
      </Link>
    </NavigationMenu.Link>
  );
}

// Features dropdown content
function FeaturesDropdown() {
  return (
    <div className="grid gap-4 p-4 md:w-[600px] lg:w-[700px] lg:grid-cols-2">
      <div className="space-y-1">
        {featureNavItems.slice(0, 3).map((item) => (
          <NavLinkItem key={item.slug} item={item} type="feature" />
        ))}
      </div>
      <div className="space-y-1">
        {featureNavItems.slice(3).map((item) => (
          <NavLinkItem key={item.slug} item={item} type="feature" />
        ))}
      </div>
      {/* CTA row */}
      <div className="col-span-full border-t border-border pt-4 mt-2">
        <NavigationMenu.Link asChild>
          <Link
            href="/features"
            className="inline-flex items-center gap-2 rounded-lg bg-repwell-sage-100/50 px-4 py-2.5 font-sans text-sm font-semibold text-repwell-teal-500 transition-colors hover:bg-repwell-sage-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20"
          >
            <DynamicIcon name="ArrowRight" className="h-4 w-4" />
            View All Features
          </Link>
        </NavigationMenu.Link>
      </div>
    </div>
  );
}

// Solutions dropdown content
function SolutionsDropdown() {
  return (
    <div className="grid gap-4 p-4 md:w-[500px] lg:w-[550px]">
      <div className="grid gap-1 lg:grid-cols-2">
        {solutionNavItems.map((item) => (
          <NavLinkItem key={item.slug} item={item} type="solution" />
        ))}
      </div>
      {/* CTA row */}
      <div className="border-t border-border pt-4 mt-2">
        <NavigationMenu.Link asChild>
          <Link
            href="/contact?demo=true"
            className="inline-flex items-center gap-2 rounded-lg bg-repwell-teal-300 px-4 py-2.5 font-sans text-sm font-semibold text-white transition-colors hover:bg-repwell-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20"
          >
            <DynamicIcon name="Calendar" className="h-4 w-4" />
            Book a Demo
          </Link>
        </NavigationMenu.Link>
      </div>
    </div>
  );
}

// Industries dropdown content (4x2 grid)
function IndustriesDropdown() {
  return (
    <div className="p-4 md:w-[400px] lg:w-[450px]">
      <div className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-400/70">
        Industries We Serve
      </div>
      <div className="grid grid-cols-2 gap-1">
        {industryNavItems.map((item) => (
          <IndustryGridItem key={item.slug} item={item} />
        ))}
      </div>
    </div>
  );
}

// Navigation trigger with chevron
function NavTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <NavigationMenu.Trigger
      className={cn(
        "group inline-flex items-center gap-1 rounded-lg px-4 py-2 font-sans text-sm font-medium text-repwell-teal-500 transition-colors",
        "hover:text-repwell-teal-300 hover:bg-repwell-sage-100/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20",
        "data-[state=open]:text-repwell-teal-300 data-[state=open]:bg-repwell-sage-100/50",
        className
      )}
    >
      {children}
      <ChevronDown
        className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180"
        aria-hidden
      />
    </NavigationMenu.Trigger>
  );
}

// Direct link (no dropdown)
function NavLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <NavigationMenu.Link asChild>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center rounded-lg px-4 py-2 font-sans text-sm font-medium text-repwell-teal-500 transition-colors",
          "hover:text-repwell-teal-300 hover:bg-repwell-sage-100/50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20",
          className
        )}
      >
        {children}
      </Link>
    </NavigationMenu.Link>
  );
}

/**
 * Mega Menu Navigation Component
 * Uses Radix Navigation Menu for accessibility
 */
export function MegaMenu() {
  return (
    <NavigationMenu.Root className="relative z-50">
      <NavigationMenu.List className="flex items-center gap-1">
        {/* Features */}
        <NavigationMenu.Item>
          <NavTrigger>Features</NavTrigger>
          <NavigationMenu.Content className="absolute left-0 top-full w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:w-auto">
            <div className="rounded-xl border border-border bg-white shadow-lg">
              <FeaturesDropdown />
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {/* Solutions */}
        <NavigationMenu.Item>
          <NavTrigger>Solutions</NavTrigger>
          <NavigationMenu.Content className="absolute left-0 top-full w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:w-auto">
            <div className="rounded-xl border border-border bg-white shadow-lg">
              <SolutionsDropdown />
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {/* Industries */}
        <NavigationMenu.Item>
          <NavTrigger>Industries</NavTrigger>
          <NavigationMenu.Content className="absolute left-0 top-full w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:w-auto">
            <div className="rounded-xl border border-border bg-white shadow-lg">
              <IndustriesDropdown />
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        {/* Pricing (direct link) */}
        <NavigationMenu.Item>
          <NavLink href="/pricing">Pricing</NavLink>
        </NavigationMenu.Item>

        {/* About (direct link) */}
        <NavigationMenu.Item>
          <NavLink href="/about">About</NavLink>
        </NavigationMenu.Item>
      </NavigationMenu.List>

      {/* Viewport for dropdown content */}
      <NavigationMenu.Viewport className="absolute left-0 top-full flex justify-start origin-top-center overflow-hidden mt-2" />
    </NavigationMenu.Root>
  );
}

export default MegaMenu;
