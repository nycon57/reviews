"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fadeIn } from "@/lib/motion";
import { useAuth } from "@/hooks/use-auth";
import { MobileMenu } from "./mobile-menu";
import { MegaMenu } from "./mega-menu";
import { BRAND_LOGO_URL } from "@/lib/brand";

export function MarketingNav() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { isAuthenticated } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.header
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/50 bg-white/95 backdrop-blur-md transition-all duration-200 supports-[backdrop-filter]:bg-white/80",
        isScrolled && "shadow-md"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-80"
          aria-label="RepWell home"
        >
          <Image
            src={BRAND_LOGO_URL}
            alt="RepWell"
            width={140}
            height={32}
            sizes="140px"
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation - Mega Menu */}
        <nav className="hidden items-center lg:flex" aria-label="Main navigation">
          <MegaMenu />
        </nav>

        {/* Auth Buttons */}
        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <Button asChild size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="font-medium">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild variant="default" size="sm">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/demo">Book a Demo</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <MobileMenu className="lg:hidden" />
      </div>
    </motion.header>
  );
}
