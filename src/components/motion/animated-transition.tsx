"use client";

import { AnimatePresence, motion } from "framer-motion";
import { transitions } from "@/lib/motion";

type SlotState = "loading" | "content" | "empty" | "error";

interface AnimatedTransitionProps {
  state: SlotState;
  loading?: React.ReactNode;
  content?: React.ReactNode;
  empty?: React.ReactNode;
  error?: React.ReactNode;
  className?: string;
}

const slotVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: transitions.default },
  exit: { opacity: 0, y: -4, transition: transitions.fast },
};

export function AnimatedTransition({
  state,
  loading,
  content,
  empty,
  error,
  className,
}: AnimatedTransitionProps) {
  const slots: Record<SlotState, React.ReactNode | undefined> = {
    loading,
    content,
    empty,
    error,
  };

  const activeSlot = slots[state];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={state}
        variants={slotVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {activeSlot}
      </motion.div>
    </AnimatePresence>
  );
}
