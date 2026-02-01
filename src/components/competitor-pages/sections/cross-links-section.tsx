"use client";

import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { compareNavItems } from "@/config/navigation";

interface CrossLinksSectionProps {
  /** Slug of the current page — shown dimmed with a "current" marker */
  currentSlug: string;
}

/**
 * Cross-links section shown on competitor comparison pages.
 * Displays links to all comparison pages with the current one dimmed.
 */
export function CrossLinksSection({ currentSlug }: CrossLinksSectionProps) {
  if (compareNavItems.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className="text-center"
    >
      <motion.h2
        variants={fadeInUp}
        className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 mb-3"
      >
        Compare RepWell to Other Platforms
      </motion.h2>
      <motion.p
        variants={fadeInUp}
        className="font-sans text-sm text-repwell-teal-400/80 mb-8 max-w-lg mx-auto"
      >
        See how RepWell stacks up against other review management platforms.
      </motion.p>
      <motion.div
        variants={fadeInUp}
        className="flex flex-wrap items-center justify-center gap-3"
      >
        {compareNavItems.map((item) => {
          const isCurrent = currentSlug.startsWith(item.slug);

          if (isCurrent) {
            return (
              <span
                key={item.slug}
                aria-current="page"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-repwell-teal-300/30 bg-repwell-sage-100/60 px-5 py-2.5",
                  "text-sm font-medium text-repwell-teal-400/60 cursor-default",
                )}
              >
                <Check className="h-3.5 w-3.5" />
                {item.title}
              </span>
            );
          }

          return (
            <Link
              key={item.slug}
              href={item.href}
              className={cn(
                "group inline-flex items-center gap-2 rounded-full border border-repwell-sage-100 bg-white px-5 py-2.5",
                "text-sm font-medium text-repwell-teal-500 transition-all",
                "hover:border-repwell-teal-300/40 hover:bg-repwell-sage-100/50 hover:text-repwell-teal-400",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300/20",
              )}
            >
              {item.title}
              <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
            </Link>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
