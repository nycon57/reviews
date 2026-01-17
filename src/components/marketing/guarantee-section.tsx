"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Guarantee {
  /** Icon name (Lucide icon) */
  icon: string;
  /** Guarantee title */
  title: string;
  /** Guarantee description */
  description: string;
}

interface GuaranteeSectionProps {
  className?: string;
  /** Badge text */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Array of guarantees */
  guarantees: Guarantee[];
  /** Highlight color variant */
  variant?: "default" | "accent";
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Get Lucide icon component by name
 */
function getIconByName(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] || LucideIcons.Shield;
}

export function GuaranteeSection({
  className,
  badge = "Our Promise",
  heading = "Risk-Free Guarantee",
  subheading = "We're confident in our platform. If you're not completely satisfied, we'll make it right.",
  guarantees,
  variant = "default",
}: GuaranteeSectionProps) {
  return (
    <section
      className={cn(
        "py-16 md:py-24 lg:py-32",
        variant === "accent" ? "bg-repwell-sage-100/30" : "bg-white",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            {badge}
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            {heading}
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Guarantees grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {guarantees.map((guarantee, index) => {
            const Icon = getIconByName(guarantee.icon);
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative bg-white border border-border rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                {/* Colored accent bar */}
                <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200 rounded-full" />

                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-sage-100/50 mb-5 mt-2">
                  <Icon className="w-7 h-7 text-repwell-teal-300" />
                </div>

                {/* Title */}
                <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-3">
                  {guarantee.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-repwell-teal-400 leading-relaxed">
                  {guarantee.description}
                </p>

                {/* Checkmark indicator */}
                <div className="mt-6 flex items-center gap-2 text-repwell-sage-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Guaranteed</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 md:mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-repwell-teal-500 text-white px-6 py-3 rounded-full">
            <LucideIcons.Shield className="w-5 h-5" />
            <span className="font-sans font-medium">
              Backed by our 100% satisfaction guarantee
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
