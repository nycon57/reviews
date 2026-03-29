"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import {
  List as Menu,
  CaretDown as ChevronDown,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  featureNavItems,
  solutionNavItems,
  industryNavItems,
  compareNavItems,
} from "@/config/navigation";
import { useAuth } from "@/hooks/use-auth";

interface MobileMenuProps {
  className?: string;
}

// Dynamic icon component
function DynamicIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const IconComponent = (
    PhosphorIcons as unknown as Record<
      string,
      React.ComponentType<{ className?: string }>
    >
  )[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

// Accordion item component
function MobileAccordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-border/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between px-3 py-3 text-sm font-medium transition-colors",
          "hover:bg-accent/50",
          isOpen ? "text-foreground" : "text-muted-foreground"
        )}
        aria-expanded={isOpen}
      >
        {title}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3 pl-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function MobileMenu({ className }: MobileMenuProps) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  const linkStyles = cn(
    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  );

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
      <SheetContent side="right" className="w-80 overflow-y-auto p-0">
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

        <nav className="flex flex-col" aria-label="Mobile navigation">
          {/* Features Accordion */}
          <MobileAccordion title="Features">
            <div className="flex flex-col gap-1">
              {featureNavItems.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    linkStyles,
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <DynamicIcon
                    name={item.icon}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <Link
                href="/features"
                onClick={handleNavClick}
                className={cn(linkStyles, "text-primary font-medium")}
              >
                View All Features
              </Link>
            </div>
          </MobileAccordion>

          {/* Solutions Accordion */}
          <MobileAccordion title="Solutions">
            <div className="flex flex-col gap-1">
              {solutionNavItems.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    linkStyles,
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <DynamicIcon
                    name={item.icon}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <Link
                href="/contact?demo=true"
                onClick={handleNavClick}
                className={cn(linkStyles, "text-primary font-medium")}
              >
                Book a Demo
              </Link>
            </div>
          </MobileAccordion>

          {/* Industries Accordion */}
          <MobileAccordion title="Industries">
            <div className="grid grid-cols-2 gap-1">
              {industryNavItems.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    linkStyles,
                    "text-xs",
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <DynamicIcon
                    name={item.icon}
                    className="h-3.5 w-3.5 text-primary"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </MobileAccordion>

          {/* Compare Accordion */}
          <MobileAccordion title="Compare">
            <div className="flex flex-col gap-1">
              {compareNavItems.map((item) => (
                <Link
                  key={item.slug}
                  href={item.href}
                  onClick={handleNavClick}
                  className={cn(
                    linkStyles,
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <DynamicIcon
                    name={item.icon}
                    className="h-4 w-4 text-primary"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <Link
                href="/compare"
                onClick={handleNavClick}
                className={cn(linkStyles, "text-primary font-medium")}
              >
                See All Comparisons
              </Link>
            </div>
          </MobileAccordion>

          {/* Direct Links */}
          <div className="flex flex-col gap-1 border-b border-border/50 p-3">
            <Link
              href="/pricing"
              onClick={handleNavClick}
              className={cn(
                linkStyles,
                isActive("/pricing") && "bg-accent text-accent-foreground"
              )}
            >
              Pricing
            </Link>
            <Link
              href="/directory"
              onClick={handleNavClick}
              className={cn(
                linkStyles,
                isActive("/directory") && "bg-accent text-accent-foreground"
              )}
            >
              Directory
            </Link>
            <Link
              href="/about"
              onClick={handleNavClick}
              className={cn(
                linkStyles,
                isActive("/about") && "bg-accent text-accent-foreground"
              )}
            >
              About
            </Link>
            <Link
              href="/blog"
              onClick={handleNavClick}
              className={cn(
                linkStyles,
                isActive("/blog") && "bg-accent text-accent-foreground"
              )}
            >
              Blog
            </Link>
            <Link
              href="/contact"
              onClick={handleNavClick}
              className={cn(
                linkStyles,
                isActive("/contact") && "bg-accent text-accent-foreground"
              )}
            >
              Contact
            </Link>
          </div>

          {/* Auth Links */}
          <div className="flex flex-col gap-2 p-4">
            {isAuthenticated ? (
              <Button asChild className="w-full">
                <Link href="/dashboard" onClick={handleNavClick}>
                  Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={handleNavClick}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/signup" onClick={handleNavClick}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
