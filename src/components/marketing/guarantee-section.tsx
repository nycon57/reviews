"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import { CheckCircle, type Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/** Names of the icon components in the Phosphor namespace (excludes IconContext, SSR). */
type PhosphorIconName = {
  [K in keyof typeof PhosphorIcons]: (typeof PhosphorIcons)[K] extends Icon ? K : never;
}[keyof typeof PhosphorIcons];

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
  trustBadgeText?: string;
  itemBadgeText?: string;
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
 * Get Phosphor icon component by name
 */
function getIconByName(name: string): Icon {
  // SAFETY: `icon` holds a Phosphor export name chosen by the caller. Names that are
  // not exported resolve to undefined at runtime, which the `??` below replaces with
  // the Shield fallback.
  const icon = PhosphorIcons[name as PhosphorIconName];
  return icon ?? PhosphorIcons.Shield;
}

export function GuaranteeSection({
  className,
  badge = "Our Promise",
  heading = "Risk-Free Guarantee",
  subheading = "We're confident in our platform. If you're not completely satisfied, we'll make it right.",
  guarantees,
  variant = "default",
  trustBadgeText = "Backed by our 100% satisfaction guarantee",
  itemBadgeText = "Guaranteed",
}: GuaranteeSectionProps) {
  return (
    <section
      className={cn(
        "py-16 md:py-24 lg:py-32",
        variant === "accent" ? "bg-repwell-sage-100/30" : "bg-white",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center md:mb-16"
        >
          <Badge
            variant="outline"
            className="mb-4 border-repwell-teal-300/50 px-4 py-1.5 text-sm text-repwell-teal-400"
          >
            {badge}
          </Badge>
          <h2 className="mb-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl lg:text-5xl">
            {heading}
          </h2>
          <p className="mx-auto max-w-2xl font-sans text-lg text-repwell-teal-400">{subheading}</p>
        </motion.div>

        {/* Guarantees grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8"
        >
          {guarantees.map((guarantee, index) => {
            const Icon = getIconByName(guarantee.icon);
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="relative rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:p-8"
              >
                {/* Colored accent bar */}
                <div className="absolute left-6 right-6 top-0 h-1 rounded-full bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200" />

                {/* Icon */}
                <div className="mb-5 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-sage-100/50">
                  <Icon className="h-7 w-7 text-repwell-teal-300" />
                </div>

                {/* Title */}
                <h3 className="mb-3 font-sans text-xl font-semibold text-repwell-teal-500">
                  {guarantee.title}
                </h3>

                {/* Description */}
                <p className="font-sans leading-relaxed text-repwell-teal-400">
                  {guarantee.description}
                </p>

                {/* Checkmark indicator */}
                <div className="mt-6 flex items-center gap-2 text-repwell-sage-200">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">{itemBadgeText}</span>
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
          className="mt-12 text-center md:mt-16"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-repwell-teal-500 px-6 py-3 text-white">
            <PhosphorIcons.Shield className="h-5 w-5" />
            <span className="font-sans font-medium">{trustBadgeText}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
