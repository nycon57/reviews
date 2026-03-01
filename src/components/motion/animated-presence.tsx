"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { transitions } from "@/lib/motion";

const modeVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.default },
    exit: { opacity: 0, transition: transitions.fast },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: transitions.default },
    exit: { opacity: 0, scale: 0.95, transition: transitions.fast },
  },
  "slide-up": {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: transitions.default },
    exit: { opacity: 0, y: -8, transition: transitions.fast },
  },
};

interface AnimatedPresenceProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
  mode?: "fade" | "scale" | "slide-up";
  presenceMode?: "sync" | "wait" | "popLayout";
}

export function AnimatedPresence({
  show,
  children,
  className,
  mode = "fade",
  presenceMode = "sync",
}: AnimatedPresenceProps) {
  return (
    <AnimatePresence mode={presenceMode}>
      {show && (
        <motion.div
          key="animated-presence-child"
          variants={modeVariants[mode]}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
