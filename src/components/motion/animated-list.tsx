"use client";

import { motion, type Variants } from "framer-motion";
import { staggerContainer, staggerContainerFast } from "@/lib/motion";

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  speed?: "default" | "fast";
  viewport?: boolean;
}

const variants: Record<"default" | "fast", Variants> = {
  default: staggerContainer,
  fast: staggerContainerFast,
};

export function AnimatedList({
  children,
  className,
  speed = "default",
  viewport = false,
}: AnimatedListProps) {
  const animateProps = viewport
    ? { initial: "hidden" as const, whileInView: "visible" as const, viewport: { once: true, amount: "some" as const } }
    : { initial: "hidden" as const, animate: "visible" as const };

  return (
    <motion.div variants={variants[speed]} className={className} {...animateProps}>
      {children}
    </motion.div>
  );
}
