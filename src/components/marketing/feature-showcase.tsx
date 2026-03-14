"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  CheckCircle as CheckCircle2,
  X,
  ArrowRight,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface TimelineStep {
  /** Step number (e.g., "01", "02") */
  stepNumber: string;
  /** Step title */
  title: string;
  /** Short summary for card view */
  summary: string;
  /** Full description for expanded view */
  description: string;
  /** Feature bullet points */
  features: string[];
  /** Optional background image */
  image?: string;
  /** Image alt text */
  imageAlt?: string;
}

interface FeatureShowcaseProps {
  /** Section badge */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Array of timeline steps (uses defaults if not provided) */
  steps?: TimelineStep[];
  /** Additional className */
  className?: string;
}

// Default timeline steps for RepWell "How It Works"
const defaultSteps: TimelineStep[] = [
  {
    stepNumber: "01",
    title: "Send Survey",
    summary: "Automated delivery after each transaction",
    description:
      "Send perfectly-timed surveys after every transaction closes. Smart sequences with reminders maximize response rates without annoying your clients. Multi-channel delivery ensures you reach everyone.",
    features: [
      "Triggered automatically after transactions",
      "Email, SMS, and in-app delivery options",
      "Smart reminder sequences",
      "Fully customizable branding",
    ],
    image: "/images/how-it-works/step-01-send-survey.png",
    imageAlt: "Automated survey email being sent from a laptop",
  },
  {
    stepNumber: "02",
    title: "Collect Feedback",
    summary: "NPS + satisfaction scores captured",
    description:
      "Capture Net Promoter Scores and detailed satisfaction feedback. Our survey engine is optimized for industry-specific questions that give you actionable insights about your service quality.",
    features: [
      "Industry-standard NPS methodology",
      "Custom question templates",
      "Mobile-optimized surveys",
      "Real-time response tracking",
    ],
    image: "/images/how-it-works/step-02-collect-feedback.png",
    imageAlt: "Mobile phone showing star ratings and satisfaction scores",
  },
  {
    stepNumber: "03",
    title: "AI Analysis",
    summary: "Sentiment detection, insights generated",
    description:
      "Our AI analyzes every response to extract sentiment, identify trends, and surface actionable insights. Know exactly what clients love and where to improve—automatically.",
    features: [
      "Real-time sentiment analysis",
      "Key phrase extraction",
      "Theme and trend detection",
      "AI-generated response suggestions",
    ],
    image: "/images/how-it-works/step-03-ai-analysis.png",
    imageAlt: "Neural network analyzing sentiment data and generating insights",
  },
  {
    stepNumber: "04",
    title: "Amplify Reviews",
    summary: "Route to Google, social & beyond",
    description:
      "Turn happy clients into public advocates. Route positive reviews to Google and top industry sites, capture video testimonials, and publish to social media with one click.",
    features: [
      "Google Business Profile integration",
      "Industry review site syndication",
      "Video testimonial requests",
      "Social media auto-publishing",
    ],
    image: "/images/how-it-works/step-04-amplify-reviews.png",
    imageAlt: "Five-star review radiating out to multiple platforms",
  },
];

// Shared spring transition for fluid motion
const springTransition = {
  type: "spring" as const,
  stiffness: 280,
  damping: 32,
  mass: 1,
};

// Content fade variants
const contentFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delay: 0.15, duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.1 },
  },
};

// Expanded content stagger
const expandedContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delay: 0.2,
      duration: 0.3,
      staggerChildren: 0.05,
      delayChildren: 0.25,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const expandedItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

// Timeline Card Component
function TimelineCard({
  step,
  index,
  isHovered,
  hoveredIndex,
  isExpanded,
  onHover,
  onClick,
}: {
  step: TimelineStep;
  index: number;
  isHovered: boolean;
  hoveredIndex: number | null;
  isExpanded: boolean;
  onHover: (index: number | null) => void;
  onClick: () => void;
}) {
  const getScale = () => {
    if (isExpanded) return 1;
    if (hoveredIndex === null) return 1;
    if (isHovered) return 1.02;
    return 0.98;
  };

  const getOpacity = () => {
    if (isExpanded) return 0;
    if (hoveredIndex === null) return 1;
    if (isHovered) return 1;
    return 0.5;
  };

  return (
    <motion.div
      className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] lg:w-[280px] xl:w-[300px]"
      animate={{
        scale: getScale(),
        opacity: getOpacity(),
      }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <motion.div
        layoutId={`card-container-${index}`}
        className="relative bg-white rounded-xl border border-border overflow-hidden cursor-pointer group"
        style={{ originX: 0.5, originY: 0.5 }}
        transition={springTransition}
      >
        {/* Image at top */}
        <motion.div
          layoutId={`card-image-${index}`}
          className="relative h-36 overflow-hidden"
          transition={springTransition}
        >
          {step.image ? (
            <Image
              src={step.image}
              alt={step.imageAlt || step.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, (max-width: 1024px) 320px, 300px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/50 to-repwell-teal-300/20" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

          {/* Step number badge */}
          <motion.div
            layoutId={`card-badge-${index}`}
            className="absolute top-3 left-3 px-3 py-1.5 bg-repwell-teal-300 text-white text-xs font-semibold rounded-full shadow-md"
            transition={springTransition}
          >
            Step {step.stepNumber}
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          layoutId={`card-content-${index}`}
          className="p-5"
          transition={springTransition}
        >
          {/* Title */}
          <motion.h3
            layoutId={`card-title-${index}`}
            className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2"
            transition={springTransition}
          >
            {step.title}
          </motion.h3>

          {/* Summary - fades out when expanded */}
          <AnimatePresence mode="wait">
            {!isExpanded && (
              <motion.div
                variants={contentFadeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <p className="font-sans text-sm text-repwell-teal-400 leading-relaxed mb-4">
                  {step.summary}
                </p>

                {/* Learn more hint */}
                <div className="flex items-center gap-2 text-repwell-teal-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs font-medium">See how it works</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Hover border accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </motion.div>
    </motion.div>
  );
}

// Expanded Card Modal with shared element transition
function ExpandedCard({
  step,
  index,
  onClose,
}: {
  step: TimelineStep;
  index: number;
  onClose: () => void;
}) {
  // Handle escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-repwell-teal-500/50 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />

      {/* Expanded card container - vertical layout matches card structure */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 pointer-events-none">
        <motion.div
          layoutId={`card-container-${index}`}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
          style={{ originX: 0.5, originY: 0.5 }}
          transition={springTransition}
        >
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.2 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-colors text-repwell-teal-400 hover:text-repwell-teal-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </motion.button>

          {/* Scrollable content area */}
          <div className="max-h-[90vh] overflow-y-auto">
            {/* Image section - stays on top, just gets taller */}
            <motion.div
              layoutId={`card-image-${index}`}
              className="relative h-56 md:h-64 w-full"
              transition={springTransition}
            >
              {step.image ? (
                <Image
                  src={step.image}
                  alt={step.imageAlt || step.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/30" />
              )}
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

              {/* Badge on image */}
              <motion.div
                layoutId={`card-badge-${index}`}
                className="absolute top-4 left-4 px-4 py-2 bg-repwell-teal-300 text-white text-sm font-semibold rounded-full shadow-lg"
                transition={springTransition}
              >
                Step {step.stepNumber}
              </motion.div>
            </motion.div>

            {/* Content section - below image */}
            <motion.div
              layoutId={`card-content-${index}`}
              className="p-6 md:p-8"
              transition={springTransition}
            >
              {/* Title */}
              <motion.h2
                layoutId={`card-title-${index}`}
                className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 mb-4"
                transition={springTransition}
              >
                {step.title}
              </motion.h2>

              {/* Expanded content with stagger animation */}
              <motion.div
                variants={expandedContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.p
                  variants={expandedItemVariants}
                  className="font-sans text-base md:text-lg text-repwell-teal-400 leading-relaxed mb-6"
                >
                  {step.description}
                </motion.p>

                <motion.h4
                  variants={expandedItemVariants}
                  className="font-sans text-sm font-semibold uppercase tracking-wider text-repwell-teal-300 mb-4"
                >
                  Key Features
                </motion.h4>

                <ul className="space-y-3 mb-6">
                  {step.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      variants={expandedItemVariants}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2 className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                      <span className="font-sans text-repwell-teal-400">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA */}
                <motion.div variants={expandedItemVariants}>
                  <button
                    onClick={onClose}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white font-semibold rounded-lg transition-colors"
                  >
                    Got it
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// Timeline Connector
function TimelineConnector({
  stepCount,
  activeIndex,
}: {
  stepCount: number;
  activeIndex: number | null;
}) {
  return (
    <div className="relative h-8 mt-6 mb-2 hidden lg:block">
      <div className="absolute left-[calc(140px-6px)] right-[calc(140px-6px)] top-1/2 -translate-y-1/2">
        {/* Background line */}
        <div className="h-0.5 bg-repwell-sage-100 rounded-full" />

        {/* Step dots */}
        <div className="absolute inset-0 flex justify-between items-center">
          {Array.from({ length: stepCount }).map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "w-3 h-3 rounded-full border-2 transition-all duration-300",
                activeIndex === idx
                  ? "bg-repwell-teal-300 border-repwell-teal-300 scale-125"
                  : "bg-white border-repwell-sage-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FeatureShowcase({
  badge,
  heading,
  subheading,
  steps = defaultSteps,
  className,
}: FeatureShowcaseProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(null);

  return (
    <section
      className={cn(
        "py-16 md:py-24 lg:py-32 bg-background-subtle overflow-hidden",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        {(badge || heading || subheading) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            {badge && (
              <span className="inline-block px-4 py-1.5 text-sm font-semibold border border-repwell-teal-300/50 text-repwell-teal-400 rounded-full mb-4">
                {badge}
              </span>
            )}

            {heading && (
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
                {heading}
              </h2>
            )}

            {subheading && (
              <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
                {subheading}
              </p>
            )}
          </motion.div>
        )}

        {/* Timeline connector (desktop only) */}
        <TimelineConnector stepCount={steps.length} activeIndex={hoveredIndex} />

        {/* Cards container with LayoutGroup for shared transitions */}
        <LayoutGroup>
          <div className="relative">
            {/* Cards row */}
            <div
              className="flex gap-4 md:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory lg:snap-none lg:justify-center lg:overflow-visible"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="snap-center"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <TimelineCard
                    step={step}
                    index={index}
                    isHovered={hoveredIndex === index}
                    hoveredIndex={hoveredIndex}
                    isExpanded={expandedIndex === index}
                    onHover={setHoveredIndex}
                    onClick={() => setExpandedIndex(index)}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Mobile scroll hint */}
          <div className="flex justify-center mt-6 lg:hidden">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    hoveredIndex === idx
                      ? "bg-repwell-teal-300"
                      : "bg-repwell-sage-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Expanded card modal with shared element transition */}
          <AnimatePresence mode="wait">
            {expandedIndex !== null && (
              <ExpandedCard
                step={steps[expandedIndex]}
                index={expandedIndex}
                onClose={() => setExpandedIndex(null)}
              />
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
}
