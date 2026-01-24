"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle as CheckCircle2,
} from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";
import { BrowserMockup } from "./browser-mockup";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TabItem {
  id: string;
  label: string;
  headline: string;
  description: string;
  features: string[];
  /** Screenshot image URL or placeholder */
  imageSrc: string;
  imageAlt: string;
  /** Reverse the column order (image left, text right) */
  reversed?: boolean;
}

interface TabNavigationSectionProps {
  /** Section badge text */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Tab items (uses defaults if not provided) */
  tabs?: TabItem[];
  /** Additional className */
  className?: string;
}

// Default tabs for RepWell homepage
const defaultTabs: TabItem[] = [
  {
    id: "loan-officers",
    label: "Loan Officers",
    headline: "Personal Reputation Dashboard",
    description:
      "Individual loan officers get their own dashboard to track reviews, monitor NPS scores, and see how they rank against their peers.",
    features: [
      "Personal review collection links",
      "Individual NPS and CSAT tracking",
      "Leaderboard rankings and badges",
      "Automated review request sequences",
    ],
    imageSrc: "/images/screenshots/lo-dashboard.png",
    imageAlt: "Loan officer dashboard showing personal metrics",
  },
  {
    id: "branches",
    label: "Branches",
    headline: "Branch Performance Analytics",
    description:
      "Branch managers see aggregated metrics across their team, identify top performers, and spot coaching opportunities.",
    features: [
      "Team performance overview",
      "Branch-level NPS trends",
      "Individual LO comparisons",
      "Goal setting and tracking",
    ],
    imageSrc: "/images/screenshots/branch-dashboard.png",
    imageAlt: "Branch manager dashboard with team analytics",
    reversed: true,
  },
  {
    id: "marketing",
    label: "Marketing",
    headline: "Testimonial & Social Publishing",
    description:
      "Marketing teams curate the best reviews into testimonials and publish them across social channels with one click.",
    features: [
      "Testimonial approval workflow",
      "Social media auto-publishing",
      "Website widget embeds",
      "Video testimonial collection",
    ],
    imageSrc: "/images/screenshots/marketing-dashboard.png",
    imageAlt: "Marketing dashboard with testimonial management",
  },
  {
    id: "compliance",
    label: "Compliance",
    headline: "Audit-Ready Reporting",
    description:
      "Compliance officers get full visibility into survey data, consent tracking, and exportable audit logs.",
    features: [
      "GDPR & CCPA consent tracking",
      "Exportable audit logs",
      "Data retention controls",
      "Role-based access reports",
    ],
    imageSrc: "/images/screenshots/compliance-dashboard.png",
    imageAlt: "Compliance dashboard with audit tools",
    reversed: true,
  },
];

// Animation variants for tab content
const tabContentVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

export function TabNavigationSection({
  badge = "Built for Every Role",
  heading = "One Platform, Every Team",
  subheading = "RepWell adapts to the needs of each role in your organization.",
  tabs = defaultTabs,
  className,
}: TabNavigationSectionProps) {
  const [activeTab, setActiveTab] = React.useState(tabs[0]?.id || "");

  const activeTabData = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn("py-16 md:py-24 lg:py-32 bg-white", className)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          {badge && (
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {heading && (
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
            >
              {heading}
            </motion.h2>
          )}

          {subheading && (
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* Tab navigation */}
        <motion.div variants={fadeInUp} className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative px-4 py-2 md:px-6 md:py-3 rounded-lg font-sans font-medium text-sm md:text-base transition-all duration-200",
                  activeTab === tab.id
                    ? "text-white"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {/* Active indicator background */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabBg"
                    className="absolute inset-0 bg-repwell-teal-300 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "grid lg:grid-cols-2 gap-8 lg:gap-12 items-center",
              activeTabData.reversed && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1"
            )}
          >
            {/* Text content */}
            <div>
              <h3 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 mb-4">
                {activeTabData.headline}
              </h3>
              <p className="font-sans text-lg text-repwell-teal-400 leading-relaxed mb-8">
                {activeTabData.description}
              </p>

              {/* Feature list */}
              <ul className="space-y-4">
                {activeTabData.features.map((feature, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.2 }}
                    className="flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                    <span className="font-sans text-repwell-teal-400">
                      {feature}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Screenshot in browser mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <BrowserMockup url="app.repwell.ai/dashboard">
                <div className="aspect-[4/3] bg-gradient-to-br from-repwell-sage-100/30 to-white flex items-center justify-center">
                  {/* Placeholder for screenshot - in production, use actual images */}
                  <div className="text-center p-8">
                    <div className="w-16 h-16 mx-auto mb-4 bg-repwell-sage-100 rounded-xl flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-repwell-teal-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-repwell-teal-400 font-sans text-sm">
                      {activeTabData.imageAlt}
                    </p>
                  </div>
                </div>
              </BrowserMockup>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
