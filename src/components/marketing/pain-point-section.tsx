"use client";

import * as React from "react";
import { motion } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface PainPoint {
  /** Icon name (Lucide icon) */
  icon: string;
  /** Pain point title */
  title: string;
  /** Description of the problem */
  description: string;
  /** Associated stat/metric (optional) */
  stat?: {
    value: string;
    label: string;
  };
}

interface PainPointSectionProps {
  className?: string;
  /** Badge text */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Array of pain points */
  painPoints: PainPoint[];
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
function getIconByName(name: string): React.ComponentType<IconProps> {
  const icons = PhosphorIcons as unknown as Record<string, React.ComponentType<IconProps>>;
  return icons[name] || PhosphorIcons.Question;
}

export function PainPointSection({
  className,
  badge = "Common Challenges",
  heading = "Sound Familiar?",
  subheading = "These problems are costing you referrals, revenue, and reputation every day.",
  painPoints,
}: PainPointSectionProps) {
  return (
    <section
      className={cn(
        "py-16 md:py-24 lg:py-32 bg-repwell-teal-500 relative overflow-hidden",
        className
      )}
    >
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            className="px-4 py-1.5 text-sm border-repwell-sage-100/30 text-repwell-sage-100 bg-white/5 mb-4"
          >
            {badge}
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {heading}
          </h2>
          <p className="font-sans text-lg text-repwell-sage-100/80 max-w-2xl mx-auto">
            {subheading}
          </p>
        </motion.div>

        {/* Pain points grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {painPoints.map((point, index) => {
            const Icon = getIconByName(point.icon);
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-colors duration-300"
              >
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 mb-5">
                  <Icon className="w-6 h-6 text-repwell-sage-100" />
                </div>

                {/* Title */}
                <h3 className="font-sans text-xl font-semibold text-white mb-3">
                  {point.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-repwell-sage-100/70 leading-relaxed mb-4">
                  {point.description}
                </p>

                {/* Optional stat */}
                {point.stat && (
                  <div className="flex items-baseline gap-2 pt-4 border-t border-white/10">
                    <span className="font-display text-2xl font-bold text-repwell-sage-200">
                      {point.stat.value}
                    </span>
                    <span className="text-sm text-repwell-sage-100/60">
                      {point.stat.label}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
