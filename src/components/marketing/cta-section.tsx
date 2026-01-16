"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { fadeInUp, staggerChildrenDelayed, blobFloat } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  /** Main heading */
  title: string;
  /** Supporting text */
  description?: string;
  /** Primary CTA button */
  primaryCta: {
    label: string;
    href: string;
  };
  /** Optional secondary CTA button */
  secondaryCta?: {
    label: string;
    href: string;
  };
  className?: string;
  /** Visual style variant */
  variant?: "default" | "gradient" | "dark" | "subtle";
  /** Show decorative elements */
  withDecoration?: boolean;
}

const variantStyles = {
  default: "bg-repwell-sage-100",
  gradient: "bg-gradient-to-br from-repwell-teal-300 to-repwell-teal-300 text-white",
  dark: "bg-repwell-teal-500 text-white",
  subtle: "bg-repwell-sage-100",
};

export function CTASection({
  title,
  description,
  primaryCta,
  secondaryCta,
  className,
  variant = "default",
  withDecoration = true,
}: CTASectionProps) {
  const isDark = variant === "gradient" || variant === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 md:py-24",
        variantStyles[variant],
        className
      )}
    >
      {/* Decorative elements */}
      {withDecoration && (
        <>
          <motion.div
            initial="initial"
            animate="animate"
            variants={blobFloat}
            className={cn(
              "absolute -top-20 -right-20 h-64 w-64 rounded-full blur-3xl",
              isDark ? "bg-white/10" : "bg-repwell-teal-300/10"
            )}
          />
          <motion.div
            initial="initial"
            animate="animate"
            variants={blobFloat}
            className={cn(
              "absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl",
              isDark ? "bg-white/5" : "bg-repwell-teal-300/10"
            )}
          />
        </>
      )}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerChildrenDelayed}
        className="container relative mx-auto px-4 text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className={cn(
            "text-heading-xl md:text-display-sm max-w-3xl mx-auto",
            isDark ? "text-white" : "text-repwell-teal-500"
          )}
        >
          {title}
        </motion.h2>

        {description && (
          <motion.p
            variants={fadeInUp}
            className={cn(
              "mt-4 text-body-lg max-w-2xl mx-auto",
              isDark ? "text-white/80" : "text-repwell-teal-400"
            )}
          >
            {description}
          </motion.p>
        )}

        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link href={primaryCta.href}>
            <Button
              size="lg"
              variant={isDark ? "secondary" : "default"}
              className={cn(
                "group",
                isDark && "bg-white text-repwell-teal-500 hover:bg-white/90"
              )}
            >
              {primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          {secondaryCta && (
            <Link href={secondaryCta.href}>
              <Button
                size="lg"
                variant={isDark ? "ghost" : "outline"}
                className={cn(
                  isDark && "text-white border-white/30 hover:bg-white/10 hover:border-white/50"
                )}
              >
                {secondaryCta.label}
              </Button>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
