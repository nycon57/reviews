"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildrenDelayed, blobFloat, blobFloatRotate } from "@/lib/motion";
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
  { type: "circle", className: "w-4 h-4 bg-repwell-teal-300/60 rounded-full", position: "top-36 left-[22%]", delay: 0.2 },
  { type: "circle", className: "w-2 h-2 bg-repwell-sage-200/80 rounded-full", position: "top-24 right-[28%]", delay: 0.4 },
  { type: "square", className: "w-3 h-3 bg-repwell-sage-100 rounded-sm rotate-12", position: "bottom-32 left-[18%]", delay: 0.6 },
  { type: "circle", className: "w-5 h-5 bg-repwell-sage-100/60 rounded-full", position: "bottom-36 right-[22%]", delay: 0.8 },
  { type: "diamond", className: "w-3 h-3 bg-repwell-teal-300/40 rotate-45", position: "top-[38%] left-[26%]", delay: 1.0 },
  { type: "circle", className: "w-2.5 h-2.5 bg-repwell-sage-200/50 rounded-full", position: "top-[35%] right-[24%]", delay: 1.2 },
  { type: "square", className: "w-2 h-2 bg-repwell-teal-400/30 rounded-sm -rotate-6", position: "bottom-[40%] left-[28%]", delay: 1.4 },
  { type: "circle", className: "w-1.5 h-1.5 bg-repwell-teal-300/70 rounded-full", position: "top-[60%] right-[30%]", delay: 1.6 },
];

// Custom float animation variants for avatars
const avatarFloat = (delay: number = 0) => ({
  initial: { opacity: 0, scale: 0.8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: [0, -8, 4, 0],
    x: [0, 4, -4, 0],
    transition: {
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: delay + 0.5,
      },
      x: {
        duration: 8,
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
    opacity: [0.4, 0.7, 0.4],
    y: [0, -6, 0],
    transition: {
      opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" as const, delay },
      y: { duration: 4, repeat: Infinity, ease: "easeInOut" as const, delay },
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
}: FloatingAvatarsHeroProps) {
  const ctaButtons = cta ? (Array.isArray(cta) ? cta : [cta]) : [];

  return (
    <section
      className={cn(
        "relative overflow-hidden py-20 md:py-28 lg:py-36 min-h-[600px] md:min-h-[700px]",
        className
      )}
    >
      {/* Subtle dot grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-dark-slate-grey-700) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Background gradient blobs */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloat}
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-repwell-sage-100/40 to-repwell-teal-300/10 blur-3xl"
      />
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloatRotate}
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-sage-100/30 blur-3xl"
      />

      {/* Floating avatars (hidden on very small screens) */}
      <div className="hidden sm:block">
        {avatars.map((avatar, index) => (
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
                      ? "bg-repwell-sage-200 rotate-12"
                      : "bg-repwell-teal-300 -rotate-12"
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
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildrenDelayed}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          {badge && (
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 bg-white/80 backdrop-blur-sm"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {/* Title - using serif font for that premium feel */}
          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            {title}
          </motion.h1>

          {/* Description */}
          {description && (
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed max-w-2xl mx-auto mb-10"
            >
              {description}
            </motion.p>
          )}

          {/* CTA Buttons */}
          {ctaButtons.length > 0 && (
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
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
        </motion.div>
      </div>
    </section>
  );
}
