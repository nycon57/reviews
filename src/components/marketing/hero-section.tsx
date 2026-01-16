"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildrenDelayed, blobFloat, blobFloatRotate } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "default" | "outline";
}

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  cta?: CTAButton | CTAButton[];
  className?: string;
  children?: React.ReactNode;
  compact?: boolean;
  /** Show decorative blob shapes in background */
  withBlobs?: boolean;
  /** Layout variant */
  layout?: "center" | "split";
  /** Image/content for split layout (appears on right) */
  media?: React.ReactNode;
  /** Badge text above subtitle */
  badge?: string;
}

export function HeroSection({
  title,
  subtitle,
  description,
  cta,
  className,
  children,
  compact = false,
  withBlobs = false,
  layout = "center",
  media,
  badge,
}: HeroSectionProps) {
  const ctaButtons = cta ? (Array.isArray(cta) ? cta : [cta]) : [];

  const content = (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerChildrenDelayed}
      className={cn(
        layout === "split" ? "text-left" : "text-center",
        layout === "split" && "max-w-xl"
      )}
    >
      {badge && (
        <motion.div variants={fadeInUp} className="mb-4">
          <Badge variant="subtle" className="px-3 py-1 text-xs">
            {badge}
          </Badge>
        </motion.div>
      )}

      {subtitle && (
        <motion.p
          variants={fadeInUp}
          className="mb-4 text-body-md font-semibold uppercase tracking-wider text-repwell-teal-300"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.h1
        variants={fadeInUp}
        className="mb-6 text-display-sm md:text-display-lg text-repwell-teal-500"
      >
        {title}
      </motion.h1>

      {description && (
        <motion.p
          variants={fadeInUp}
          className={cn(
            "mb-8 text-body-lg text-repwell-teal-400",
            layout === "center" && "mx-auto max-w-2xl"
          )}
        >
          {description}
        </motion.p>
      )}

      {ctaButtons.length > 0 && (
        <motion.div
          variants={fadeInUp}
          className={cn(
            "flex flex-wrap gap-4",
            layout === "center" && "justify-center"
          )}
        >
          {ctaButtons.map((button, index) => (
            <Link key={button.href} href={button.href}>
              <Button
                size="lg"
                variant={button.variant || (index === 0 ? "default" : "outline")}
              >
                {button.label}
              </Button>
            </Link>
          ))}
        </motion.div>
      )}

      {children && (
        <motion.div variants={fadeInUp} className="mt-8">
          {children}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        compact ? "py-12 md:py-16" : "py-16 md:py-24 lg:py-32",
        className
      )}
    >
      {/* Decorative blob shapes */}
      {withBlobs && (
        <>
          <motion.div
            initial="initial"
            animate="animate"
            variants={blobFloat}
            className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-100 opacity-60 blur-3xl"
          />
          <motion.div
            initial="initial"
            animate="animate"
            variants={blobFloatRotate}
            className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-teal-300/10 opacity-40 blur-3xl"
          />
        </>
      )}

      <div className="container relative mx-auto px-4">
        {layout === "split" ? (
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {content}
            {media && (
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                {media}
              </motion.div>
            )}
          </div>
        ) : (
          content
        )}
      </div>
    </section>
  );
}
