"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildrenDelayed, blobFloat, blobFloatRotate } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BlogHeroProps {
  /** Badge text above title */
  badge?: string;
  /** Main headline */
  title?: React.ReactNode;
  /** Supporting description */
  description?: string;
  /** Additional className */
  className?: string;
}

export function BlogHero({
  badge,
  title = (
    <>
      Insights & <span className="text-repwell-teal-300">Best Practices</span>
    </>
  ),
  description = "Insights on customer experience, review management, and AI-powered analytics for mortgage professionals.",
  className,
}: BlogHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 md:py-24 lg:py-28",
        className
      )}
    >
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
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed max-w-2xl mx-auto mb-8"
            >
              {description}
            </motion.p>
          )}

        </motion.div>
      </div>
    </section>
  );
}
