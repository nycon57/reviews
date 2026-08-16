"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildrenDelayed } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FloatingAvatar {
  /** Avatar image URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Ring color class (e.g., "ring-repwell-teal-300") */
  ringColor?: string;
  /** Position classes */
  position: string;
  /** Animation delay in seconds */
  delay?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "default" | "outline";
}

interface FloatingAvatarsHeroProps {
  /** Badge text above title */
  badge?: string;
  /** Main headline (can include JSX for styling) */
  title: React.ReactNode;
  /** Supporting description */
  description?: string;
  /** CTA buttons (1-2 recommended) */
  cta?: CTAButton | CTAButton[];
  /** Floating avatar configurations */
  avatars?: FloatingAvatar[];
  /** Additional className */
  className?: string;
  /** Small copy below the primary CTAs */
  microcopy?: string;
}

// Default professional avatar placeholders with varied positions and sizes
const defaultAvatars: FloatingAvatar[] = [
  {
    src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    alt: "Professional",
    ringColor: "ring-repwell-teal-300",
    position: "top-20 left-[8%] md:left-[12%]",
    delay: 0,
    size: "lg",
  },
  {
    src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face",
    alt: "Branch manager",
    ringColor: "ring-repwell-sage-200",
    position: "top-28 right-[6%] md:right-[10%]",
    delay: 0.15,
    size: "md",
  },
  {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    alt: "Client-facing professional",
    ringColor: "ring-repwell-teal-400",
    position: "top-[45%] -translate-y-1/2 left-[3%] md:left-[6%]",
    delay: 0.3,
    size: "md",
  },
  {
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    alt: "Team lead",
    ringColor: "ring-repwell-sage-200",
    position: "top-[55%] -translate-y-1/2 right-[4%] md:right-[7%]",
    delay: 0.45,
    size: "lg",
  },
  {
    src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    alt: "Loan consultant",
    ringColor: "ring-repwell-teal-300",
    position: "bottom-28 left-[10%] md:left-[15%]",
    delay: 0.6,
    size: "sm",
  },
  {
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face",
    alt: "Account manager",
    ringColor: "ring-repwell-teal-400",
    position: "bottom-20 right-[8%] md:right-[12%]",
    delay: 0.75,
    size: "md",
  },
];

// Enhanced decorative shapes with more variety
const decorativeShapes = [
  {
    type: "circle",
    className: "w-4 h-4 bg-repwell-teal-300/60 rounded-full",
    position: "top-36 left-[22%]",
    delay: 0.2,
  },
  {
    type: "square",
    className: "w-3 h-3 bg-repwell-sage-100 rounded-sm rotate-12",
    position: "bottom-32 left-[18%]",
    delay: 0.6,
  },
  {
    type: "circle",
    className: "w-5 h-5 bg-repwell-sage-100/60 rounded-full",
    position: "bottom-36 right-[22%]",
    delay: 0.8,
  },
  {
    type: "diamond",
    className: "w-3 h-3 bg-repwell-teal-300/40 rotate-45",
    position: "top-[38%] left-[26%]",
    delay: 1.0,
  },
];

// Custom float animation variants for avatars
const avatarFloat = (delay: number = 0) => ({
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: [0, -4, 2, 0],
    x: [0, 2, -2, 0],
    transition: {
      opacity: { duration: 0.6, delay },
      scale: { duration: 0.6, delay },
      y: {
        duration: 11,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: delay + 0.5,
      },
      x: {
        duration: 13,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: delay + 0.5,
      },
    },
  },
});

const shapeFloat = (delay: number = 0) => ({
  initial: { opacity: 0 },
  animate: {
    opacity: [0.26, 0.46, 0.26],
    y: [0, -3, 0],
    transition: {
      opacity: { duration: 7, repeat: Infinity, ease: "easeInOut" as const, delay },
      y: { duration: 9, repeat: Infinity, ease: "easeInOut" as const, delay },
    },
  },
});

// Size variant classes for avatars
const avatarSizeClasses = {
  sm: "w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14",
  md: "w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20",
  lg: "w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24",
};

const avatarDecorativeSize = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function FloatingAvatarsHero({
  badge,
  title,
  description,
  cta,
  avatars = defaultAvatars,
  className,
  microcopy,
}: FloatingAvatarsHeroProps) {
  const ctaButtons = cta ? (Array.isArray(cta) ? cta : [cta]) : [];

  return (
    <section
      className={cn(
        "relative min-h-[600px] overflow-hidden py-20 md:min-h-[700px] md:py-28 lg:py-36",
        className
      )}
    >
      {/* Subtle dot grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-dark-slate-grey-700) 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Floating avatars (hidden on very small screens) */}
      <div className="hidden sm:block">
        {avatars.slice(0, 4).map((avatar, index) => (
          <motion.div
            key={index}
            initial="initial"
            animate="animate"
            variants={avatarFloat(avatar.delay || index * 0.2)}
            className={cn("absolute z-10", avatar.position)}
          >
            <div className="relative">
              <img
                src={avatar.src}
                alt={avatar.alt}
                className={cn(
                  "rounded-full object-cover shadow-lg",
                  "ring-4 ring-offset-2 ring-offset-white",
                  avatarSizeClasses[avatar.size || "md"],
                  avatar.ringColor || "ring-repwell-teal-300"
                )}
              />
              {/* Decorative shape behind some avatars */}
              {index % 2 === 0 && (
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 rounded-md",
                    avatarDecorativeSize[avatar.size || "md"],
                    index % 4 === 0
                      ? "rotate-12 bg-repwell-sage-200"
                      : "-rotate-12 bg-repwell-teal-300"
                  )}
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Decorative floating shapes */}
      <div className="hidden md:block">
        {decorativeShapes.map((shape, index) => (
          <motion.div
            key={index}
            initial="initial"
            animate="animate"
            variants={shapeFloat(shape.delay)}
            className={cn("absolute", shape.position, shape.className)}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildrenDelayed}
          className="mx-auto max-w-4xl text-center"
        >
          {/* Badge */}
          {badge && (
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 bg-white/80 px-4 py-1.5 text-sm text-repwell-teal-400 backdrop-blur-sm"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {/* Title - using serif font for that premium feel */}
          <motion.h1
            variants={fadeInUp}
            className="mb-6 font-display text-4xl font-bold tracking-tight text-repwell-teal-500 sm:text-5xl md:text-6xl lg:text-7xl"
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-10 max-w-2xl font-sans text-lg leading-relaxed text-repwell-teal-400 md:text-xl"
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {ctaButtons.length > 0 && (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col justify-center gap-4 sm:flex-row"
            >
              {ctaButtons.map((button, index) => (
                <Button
                  key={button.href}
                  asChild
                  size="lg"
                  variant={button.variant || (index === 0 ? "default" : "outline")}
                  className={cn(
                    "min-w-[180px]",
                    index === 0 && "shadow-lg shadow-repwell-teal-300/20"
                  )}
                >
                  <Link href={button.href}>{button.label}</Link>
                </Button>
              ))}
            </motion.div>
          )}

          {microcopy && (
            <motion.p
              variants={fadeInUp}
              className="mt-4 font-sans text-sm text-repwell-teal-400/70"
            >
              {microcopy}
            </motion.p>
          )}
        </motion.div>
      </div>
    </section>
  );
}
