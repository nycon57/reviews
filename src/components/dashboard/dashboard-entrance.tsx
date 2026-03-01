"use client";

import { motion } from "framer-motion";
import { fadeIn } from "@/lib/motion";

interface DashboardEntranceProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardEntrance({ children, className }: DashboardEntranceProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}
