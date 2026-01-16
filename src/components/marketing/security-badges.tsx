"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Shield, Lock, FileCheck, Globe, Server } from "lucide-react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SecurityBadge {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const defaultBadges: SecurityBadge[] = [
  {
    id: "soc2",
    name: "SOC 2 Type II",
    description: "Independently audited security controls and practices",
    icon: Shield,
  },
  {
    id: "gdpr",
    name: "GDPR Compliant",
    description: "Full compliance with EU data protection regulations",
    icon: Globe,
  },
  {
    id: "glba",
    name: "GLBA Ready",
    description: "Meets financial services privacy requirements",
    icon: FileCheck,
  },
  {
    id: "ccpa",
    name: "CCPA Compliant",
    description: "California Consumer Privacy Act compliance",
    icon: FileCheck,
  },
  {
    id: "encryption",
    name: "256-bit Encryption",
    description: "Bank-level encryption for data at rest and in transit",
    icon: Lock,
  },
  {
    id: "uptime",
    name: "99.9% Uptime",
    description: "Enterprise-grade reliability with SLA guarantee",
    icon: Server,
  },
];

interface SecurityBadgesProps {
  /** Custom badges (uses defaults if not provided) */
  badges?: SecurityBadge[];
  /** Link to security page */
  securityPageHref?: string;
  /** Section heading */
  heading?: string;
  /** Additional classes */
  className?: string;
}

export function SecurityBadges({
  badges = defaultBadges,
  securityPageHref = "/security",
  heading = "Enterprise-Grade Security",
  className,
}: SecurityBadgesProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("py-12 md:py-16 bg-background-subtle", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading && (
          <motion.p
            variants={fadeInUp}
            className="text-center text-body-sm font-medium text-repwell-teal-300 mb-8"
          >
            {heading}
          </motion.p>
        )}

        <TooltipProvider delayDuration={200}>
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-8 lg:gap-12"
          >
            {badges.map((badge, index) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 text-repwell-teal-400 hover:text-repwell-teal-500 transition-colors cursor-pointer"
                  >
                    <badge.icon className="w-5 h-5 text-repwell-teal-300" />
                    <span className="text-body-sm font-medium">
                      {badge.name}
                    </span>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  className="bg-repwell-teal-500 text-white border-repwell-teal-400"
                >
                  <p className="text-sm max-w-xs">{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </motion.div>
        </TooltipProvider>

        {securityPageHref && (
          <motion.div variants={fadeInUp} className="text-center mt-6">
            <Link
              href={securityPageHref}
              className="text-body-sm text-repwell-teal-300 hover:text-repwell-teal-400 underline-offset-4 hover:underline transition-colors"
            >
              Learn more about our security practices
            </Link>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}
