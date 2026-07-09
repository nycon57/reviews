"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Stat {
  value: string;
  label: string;
}

interface StatsSectionDarkProps {
  /** Optional heading above stats */
  heading?: string;
  /** Stats to display */
  stats: Stat[];
  /** Additional className */
  className?: string;
}

// Individual stat component with light text for dark background
function DarkStat({ stat, index }: { stat: Stat; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 + 0.2 }}
      className="text-center"
    >
      <div className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2">
        {stat.value}
      </div>
      <div className="font-sans text-sm md:text-base text-repwell-sage-100/80">
        {stat.label}
      </div>
    </motion.div>
  );
}

export function StatsSectionDark({
  heading,
  stats,
  className,
}: StatsSectionDarkProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn(
        "relative py-16 md:py-24 lg:py-28 bg-repwell-teal-500",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Optional heading */}
        {heading && (
          <motion.h2
            variants={fadeInUp}
            className="font-display text-2xl md:text-3xl font-bold text-white text-center mb-12 md:mb-16"
          >
            {heading}
          </motion.h2>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {stats.map((stat, index) => (
            <DarkStat key={index} stat={stat} index={index} />
          ))}
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-repwell-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-repwell-sage-200/10 rounded-full blur-3xl" />
        </div>
      </div>
    </motion.section>
  );
}
