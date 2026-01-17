"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Printer, ArrowUp } from "lucide-react";
import { fadeInUp, staggerChildrenDelayed, blobFloat, blobFloatRotate } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TableOfContents } from "./table-of-contents";

interface Section {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface LegalPageLayoutProps {
  /** Badge text above title */
  badge?: string;
  /** Page title */
  title: string;
  /** Last updated date */
  lastUpdated: string;
  /** Table of contents sections */
  sections: Section[];
  /** Main content */
  children: React.ReactNode;
  /** Contact email for inquiries */
  contactEmail?: string;
  /** Additional className */
  className?: string;
}

export function LegalPageLayout({
  badge = "Legal",
  title,
  lastUpdated,
  sections,
  children,
  contactEmail,
  className,
}: LegalPageLayoutProps) {
  const [showBackToTop, setShowBackToTop] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 md:py-24 lg:py-28">
        {/* Background gradient blobs */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={blobFloat}
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-br from-repwell-sage-100/40 to-repwell-teal-300/10 blur-3xl"
        />
        <motion.div
          initial="initial"
          animate="animate"
          variants={blobFloatRotate}
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-sage-100/30 blur-3xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildrenDelayed}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            {badge && (
              <motion.div variants={fadeInUp} className="mb-4">
                <Badge
                  variant="outline"
                  className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
                >
                  {badge}
                </Badge>
              </motion.div>
            )}

            {/* Title */}
            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-4"
            >
              {title}
            </motion.h1>

            {/* Last updated + Print button */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
            >
              <p className="font-sans text-lg text-repwell-teal-400">
                Last updated: {lastUpdated}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="gap-2 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Main Content with Sidebar TOC */}
      <section className="py-12 md:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-8 lg:gap-12">
            {/* Sticky Table of Contents */}
            <aside className="print:hidden">
              <TableOfContents
                sections={sections}
                contactEmail={contactEmail}
              />
            </aside>

            {/* Main Content */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="prose prose-lg max-w-none
                prose-headings:font-display prose-headings:text-repwell-teal-500 prose-headings:scroll-mt-28
                prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-4
                prose-h3:text-xl prose-h3:md:text-2xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-repwell-teal-400 prose-p:leading-relaxed prose-p:mb-4
                prose-li:text-repwell-teal-400 prose-li:leading-relaxed
                prose-strong:text-repwell-teal-500 prose-strong:font-semibold
                prose-a:text-repwell-teal-300 prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-repwell-teal-400
                prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6"
            >
              {children}
            </motion.main>
          </div>
        </div>
      </section>

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          scale: showBackToTop ? 1 : 0.8,
          pointerEvents: showBackToTop ? "auto" : "none",
        }}
        transition={{ duration: 0.2 }}
        onClick={scrollToTop}
        className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-repwell-teal-300 text-white shadow-lg hover:bg-repwell-teal-400 transition-colors print:hidden"
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </motion.button>
    </div>
  );
}
