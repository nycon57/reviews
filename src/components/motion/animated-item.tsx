"use client";

import { motion, type Variants, type HTMLMotionProps } from "framer-motion";
import { fadeInUp, transitions } from "@/lib/motion";

type AnimatedItemProps = {
  variants?: Variants;
  layout?: boolean;
} & HTMLMotionProps<"div">;

const defaultVariants: Variants = {
  ...fadeInUp,
  exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
};

export function AnimatedItem({
  children,
  variants = defaultVariants,
  layout = false,
  ...rest
}: AnimatedItemProps) {
  return (
    <motion.div variants={variants} layout={layout} {...rest}>
      {children}
    </motion.div>
  );
}
