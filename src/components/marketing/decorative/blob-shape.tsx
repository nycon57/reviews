"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { blobFloat, blobFloatRotate } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface BlobShapeProps {
  className?: string;
  /** Blob color variant */
  variant?: "blue" | "frost" | "iris" | "amber" | "gradient";
  /** Animation style */
  animation?: "float" | "rotate" | "none";
  /** Blur amount */
  blur?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  /** Opacity (0-100) */
  opacity?: number;
  /** Size class override */
  size?: string;
}

const variantStyles = {
  blue: "bg-brand-blue/20",
  frost: "bg-brand-frost",
  iris: "bg-brand-iris/20",
  amber: "bg-brand-amber/20",
  gradient: "bg-gradient-to-br from-brand-blue/15 via-brand-iris/10 to-brand-frost",
};

const blurStyles = {
  sm: "blur-sm",
  md: "blur-md",
  lg: "blur-lg",
  xl: "blur-xl",
  "2xl": "blur-2xl",
  "3xl": "blur-3xl",
};

export function BlobShape({
  className,
  variant = "frost",
  animation = "float",
  blur = "3xl",
  opacity = 60,
  size = "h-72 w-72",
}: BlobShapeProps) {
  const animationVariants = animation === "rotate" ? blobFloatRotate : animation === "float" ? blobFloat : {};

  return (
    <motion.div
      initial={animation !== "none" ? "initial" : undefined}
      animate={animation !== "none" ? "animate" : undefined}
      variants={animationVariants}
      className={cn(
        "absolute rounded-full pointer-events-none",
        size,
        variantStyles[variant],
        blurStyles[blur],
        className
      )}
      style={{ opacity: opacity / 100 }}
    />
  );
}

// Pre-configured blob compositions for common use cases
export function HeroBlobs() {
  return (
    <>
      <BlobShape
        variant="gradient"
        animation="float"
        className="-top-20 -right-20"
        size="h-96 w-96"
        opacity={50}
      />
      <BlobShape
        variant="iris"
        animation="rotate"
        className="-bottom-32 -left-32"
        size="h-80 w-80"
        opacity={30}
      />
    </>
  );
}

export function SectionBlobs() {
  return (
    <>
      <BlobShape
        variant="frost"
        animation="float"
        className="top-1/4 -right-40"
        size="h-64 w-64"
        opacity={40}
      />
      <BlobShape
        variant="blue"
        animation="rotate"
        className="bottom-1/4 -left-40"
        size="h-56 w-56"
        opacity={25}
      />
    </>
  );
}
