"use client";

import { motion, type Variants } from "framer-motion";
import { fadeInUp, viewportOnce } from "@/lib/motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
  once?: boolean;
}

export function AnimatedSection({
  children,
  className,
  variants = fadeInUp,
  delay,
  once = true,
}: AnimatedSectionProps) {
  const delayedVariants: Variants | undefined = delay
    ? {
        ...variants,
        visible: {
          ...(typeof variants.visible === "object" ? variants.visible : {}),
          transition: {
            ...(typeof variants.visible === "object" && "transition" in variants.visible
              ? (variants.visible.transition as Record<string, unknown>)
              : {}),
            delay,
          },
        },
      }
    : undefined;

  return (
    <motion.div
      variants={delayedVariants ?? variants}
      initial="hidden"
      whileInView="visible"
      viewport={once ? viewportOnce : { once: false }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
