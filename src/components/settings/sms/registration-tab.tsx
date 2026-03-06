'use client';

import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import { RegistrationWizard } from './registration-wizard';

export function RegistrationTab() {
  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-heading tracking-tight">
          10DLC Registration
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Register your brand and messaging campaign for A2P 10DLC compliance. Required to send SMS messages without carrier filtering.
        </p>
      </motion.div>

      <RegistrationWizard />
    </motion.div>
  );
}
