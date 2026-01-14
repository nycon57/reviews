"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fadeIn } from "@/lib/motion";
import { MobileMenu } from "./mobile-menu";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Find a Pro", href: "/directory" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function MarketingNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-brand-silver/50 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 transition-all duration-200",
        isScrolled && "shadow-elevation-2"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
            <Star className="h-5 w-5 text-white" fill="currentColor" />
          </div>
          <span className="text-xl font-bold text-brand-navy">ReviewHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative px-4 py-2 text-body-sm font-medium transition-colors rounded-lg",
                "hover:text-brand-blue hover:bg-brand-frost/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/20",
                isActive(link.href)
                  ? "text-brand-blue"
                  : "text-brand-navy"
              )}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-brand-blue rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login">
            <Button variant="brand-ghost" size="sm" className="font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="brand" size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <MobileMenu className="md:hidden" />
      </div>
    </motion.header>
  );
}
