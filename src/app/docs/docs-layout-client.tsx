"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DocsSearch } from "@/components/docs/docs-search";
import { fadeIn } from "@/lib/motion";

interface DocsLayoutClientProps {
  children: React.ReactNode;
}

export function DocsLayoutClient({ children }: DocsLayoutClientProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="sticky top-0 z-50 border-b border-brand-silver/50 bg-white/95 backdrop-blur-md"
      >
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left: Logo + Mobile Menu */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            <Link
              href="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue">
                <Star className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold text-brand-navy">
                ReviewHub
              </span>
            </Link>

            <span className="hidden sm:inline-block text-body-sm text-brand-slate border-l border-brand-silver pl-4 ml-2">
              Documentation
            </span>
          </div>

          {/* Center: Search */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <DocsSearch />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="hidden sm:block">
              <Button variant="brand" size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden border-t border-brand-silver/30 px-4 py-3">
          <DocsSearch />
        </div>
      </motion.header>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-brand-silver/30">
          <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-6 px-4">
            <DocsSidebar />
          </div>
        </aside>

        {/* Sidebar - Mobile */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/20 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-brand-silver/30 lg:hidden overflow-y-auto">
              <div className="py-6 px-4 pt-20">
                <DocsSidebar onNavigate={() => setSidebarOpen(false)} />
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 py-8 lg:px-8 lg:py-12">
            {children}
          </div>
        </main>

        {/* Right sidebar placeholder for TOC (future enhancement) */}
        <aside className="hidden xl:block w-56 shrink-0">
          <div className="sticky top-16 h-[calc(100vh-4rem)] py-6 px-4">
            {/* Table of contents could go here */}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-silver/30 bg-brand-snow/30">
        <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-body-sm text-brand-slate">
              &copy; {new Date().getFullYear()} ReviewHub. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-body-sm text-brand-slate hover:text-brand-blue transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-body-sm text-brand-slate hover:text-brand-blue transition-colors"
              >
                Terms
              </Link>
              <Link
                href="mailto:support@reviewhub.com"
                className="text-body-sm text-brand-slate hover:text-brand-blue transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
