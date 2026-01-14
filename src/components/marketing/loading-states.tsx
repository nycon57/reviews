"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  loadingDotsContainer,
  loadingDot,
  spinAnimation,
  pulseAnimation,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated loading dots that bounce in sequence
 */
export function LoadingDots({ className, size = "md" }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-3 w-3",
  };

  const gapClasses = {
    sm: "gap-1",
    md: "gap-1.5",
    lg: "gap-2",
  };

  return (
    <motion.div
      variants={loadingDotsContainer}
      initial="initial"
      animate="animate"
      className={cn("flex items-center", gapClasses[size], className)}
    >
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          variants={loadingDot}
          className={cn("rounded-full bg-primary", sizeClasses[size])}
        />
      ))}
    </motion.div>
  );
}

interface AnimatedSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Animated spinner with framer-motion for smoother animation
 */
export function AnimatedSpinner({
  className,
  size = "md",
}: AnimatedSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <motion.div
      variants={spinAnimation}
      initial="initial"
      animate="spin"
      className={cn(
        "rounded-full border-2 border-muted border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );
}

interface PulsingDotProps {
  className?: string;
  color?: "primary" | "success" | "warning" | "error";
}

/**
 * Pulsing dot indicator (useful for status indicators)
 */
export function PulsingDot({
  className,
  color = "primary",
}: PulsingDotProps) {
  const colorClasses = {
    primary: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <motion.div
      variants={pulseAnimation}
      initial="initial"
      animate="pulse"
      className={cn(
        "h-2 w-2 rounded-full",
        colorClasses[color],
        className
      )}
    />
  );
}

interface SkeletonShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * Animated skeleton with shimmer effect
 */
export function SkeletonShimmer({
  className,
  width,
  height,
}: SkeletonShimmerProps) {
  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ width, height }}
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]",
        className
      )}
    />
  );
}

interface LoadingCardProps {
  className?: string;
}

/**
 * Animated loading card placeholder
 */
export function LoadingCard({ className }: LoadingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("rounded-lg border bg-card p-6", className)}
    >
      <div className="space-y-3">
        <SkeletonShimmer height={20} className="w-3/4" />
        <SkeletonShimmer height={16} className="w-full" />
        <SkeletonShimmer height={16} className="w-5/6" />
      </div>
    </motion.div>
  );
}

interface PageLoadingProps {
  message?: string;
}

/**
 * Full page loading state with animated elements
 */
export function PageLoadingAnimated({ message = "Loading..." }: PageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[400px] flex-col items-center justify-center gap-4"
    >
      <AnimatedSpinner size="lg" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        {message}
      </motion.p>
    </motion.div>
  );
}

interface ContentLoadingProps {
  lines?: number;
  className?: string;
}

/**
 * Content loading placeholder with staggered animation
 */
export function ContentLoading({ lines = 3, className }: ContentLoadingProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className={cn("space-y-3", className)}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1, duration: 0.3 }}
        >
          <SkeletonShimmer
            height={16}
            className={cn(
              "w-full",
              i === lines - 1 && "w-3/4"
            )}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
