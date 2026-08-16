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
  const visible = typeof variants.visible === "object" ? variants.visible : undefined;
  const baseTransition = visible && "transition" in visible ? visible.transition : undefined;

  const delayedVariants: Variants | undefined = delay
    ? {
        ...variants,
        visible: {
          ...visible,
          transition: { ...baseTransition, delay },
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
