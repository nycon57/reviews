"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Star,
  ChartBar as BarChart3,
  Chats as MessageSquare,
  Lightning as Zap,
  CheckCircle,
  type IconProps,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ImageType = {
  src: string;
  alt: string;
};

type LayoutVariant = "single" | "floating" | "wide" | "grid";

interface FeatureTab {
  icon: React.ComponentType<IconProps>;
  title: string;
  tabName: string;
  summary: string;
  bulletPoints?: string[];
  layoutVariant: LayoutVariant;
  images: ImageType[];
  link?: {
    name: string;
    href: string;
  };
  stat?: {
    value: string;
    label: string;
  };
  overlayBadge?: {
    title: string;
    subtitle: string;
  };
}

const FEATURE_TABS: FeatureTab[] = [
  {
    icon: Star,
    title: "Automated Review Collection",
    tabName: "Reviews",
    summary:
      "Perfectly-timed surveys sent when transactions complete, with smart reminders that maximize response rates without annoying clients.",
    bulletPoints: [
      "Trigger surveys at optimal moments post-service",
      "Smart follow-up sequences that boost responses",
      "Customizable templates for your brand voice",
    ],
    layoutVariant: "wide",
    images: [
      {
        src: "/images/product/reviews-hub.png",
        alt: "RepWell reviews hub showing text reviews, video testimonials, requests, and review stats",
      },
    ],
    link: {
      name: "See how it works",
      href: "/features#reviews",
    },
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics & NPS",
    tabName: "Analytics",
    summary:
      "Track NPS, CSAT, and satisfaction trends across your organization with real-time dashboards and scheduled reports.",
    bulletPoints: [
      "Live NPS tracking across all branches",
      "Automated weekly and monthly reports",
      "Compare performance across team members",
    ],
    layoutVariant: "wide",
    images: [
      {
        src: "/images/product/dashboard-home.png",
        alt: "RepWell dashboard with review totals, average rating, response rate, NPS score, and reputation breakdown",
      },
    ],
    link: {
      name: "Explore analytics",
      href: "/features#analytics",
    },
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Insights",
    tabName: "AI Insights",
    summary:
      "Sentiment analysis and AI-generated summaries reveal what customers really think, with actionable recommendations.",
    bulletPoints: [
      "Automatic sentiment detection on every review",
      "Key phrase extraction identifies themes",
      "AI-suggested response templates",
    ],
    layoutVariant: "wide",
    images: [
      {
        src: "/images/product/analytics.png",
        alt: "RepWell analytics with AI-suggested response composition, approval rate, and performance metrics",
      },
    ],
    overlayBadge: {
      title: "AI Analysis",
      subtitle: "Processing insights...",
    },
    link: {
      name: "Learn about AI",
      href: "/features#ai",
    },
  },
  {
    icon: Zap,
    title: "Reputation Amplification",
    tabName: "Amplify",
    summary:
      "Route positive reviews to Google and other platforms. Capture video testimonials. Publish to social media with one click.",
    bulletPoints: [
      "One-click publishing to review platforms",
      "Video testimonial capture and editing",
      "Automated social media sharing",
    ],
    layoutVariant: "wide",
    images: [
      {
        src: "/images/product/share-studio.png",
        alt: "RepWell Share Studio with smart-link performance, published links, and shareable review assets",
      },
    ],
    link: {
      name: "Start amplifying",
      href: "/features#amplify",
    },
  },
];

// Animation variants
const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
      staggerChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
    },
  },
};

// Image layout components
interface ImagesProps {
  images: ImageType[];
  variant: LayoutVariant;
  overlayBadge?: FeatureTab["overlayBadge"];
}

function FeatureImages({ images, variant, overlayBadge }: ImagesProps) {
  // Container ref for drag bounds
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Track which card is on top for z-index stacking
  const [topCardIndex, setTopCardIndex] = React.useState<number | null>(null);

  // Track which card is being dragged for opacity dimming
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);

  // Pile of photos layout - overlapping, intentional stacking
  const pilePositions = [
    { top: "12%", left: "8%", rotate: -6, zIndex: 4, scale: 1 },
    { top: "8%", left: "28%", rotate: 4, zIndex: 3, scale: 0.95 },
    { top: "32%", left: "18%", rotate: -3, zIndex: 2, scale: 0.92 },
    { top: "28%", left: "38%", rotate: 7, zIndex: 1, scale: 0.88 },
  ];

  switch (variant) {
    // Single full-bleed image on the right - fills container
    case "single":
      return (
        <motion.div
          variants={imageVariants}
          className="relative h-full min-h-[400px] lg:min-h-[620px] xl:min-h-[700px]"
        >
          <div className="absolute inset-0 overflow-hidden rounded-2xl lg:rounded-l-2xl lg:rounded-r-none shadow-2xl">
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </motion.div>
      );

    // Pile of photos layout - stacked like scattered polaroids, draggable
    case "floating":
      return (
        <motion.div
          ref={containerRef}
          variants={imageVariants}
          className="relative h-full min-h-[400px] lg:min-h-[620px] xl:min-h-[700px]"
        >
          <div className="relative h-full w-full flex items-center justify-center">
            {images.slice(0, 4).map((img, i) => {
              const position = pilePositions[i];
              const isOnTop = topCardIndex === i;
              const isDragging = draggingIndex === i;
              const isOtherDragging = draggingIndex !== null && draggingIndex !== i;

              return (
                <motion.div
                  key={`pile-${i}`}
                  drag
                  dragConstraints={containerRef}
                  dragElastic={0.1}
                  dragMomentum={true}
                  dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
                  onDragStart={() => {
                    setTopCardIndex(i);
                    setDraggingIndex(i);
                  }}
                  onDragEnd={() => {
                    setDraggingIndex(null);
                  }}
                  initial={{ opacity: 0, scale: 0.6, rotate: 0, y: 40 }}
                  animate={{
                    opacity: isOtherDragging ? 0.7 : 1,
                    scale: position?.scale || 1,
                    rotate: position?.rotate || 0,
                    y: 0,
                  }}
                  whileDrag={{
                    scale: 1.05,
                    rotate: 0,
                    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
                  }}
                  transition={{
                    delay: 0.1 * (i + 1),
                    duration: 0.6,
                    type: "spring",
                    stiffness: 120,
                    damping: 14,
                  }}
                  style={{
                    top: position?.top,
                    left: position?.left,
                    zIndex: isOnTop ? 10 : position?.zIndex,
                    cursor: isDragging ? "grabbing" : "grab",
                    touchAction: "none",
                  }}
                  className={cn(
                    "absolute aspect-[3/4] w-[44%] lg:w-[38%] overflow-hidden rounded-lg bg-white p-2 shadow-2xl",
                    "transition-shadow duration-200",
                    isDragging && "ring-2 ring-repwell-teal-300/30"
                  )}
                >
                  <div className="relative h-full w-full overflow-hidden rounded pointer-events-none">
                    <Image
                      src={img.src}
                      alt={img.alt}
                      fill
                      className="object-cover"
                      sizes="25vw"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      );

    // Wide cinematic image that extends beyond container
    case "wide":
      return (
        <motion.div
          variants={imageVariants}
          className="relative h-full min-h-[400px] lg:min-h-[620px] xl:min-h-[700px]"
        >
          <div className="absolute top-1/2 left-[5%] -translate-y-1/2 w-[130%] aspect-video overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src={images[0].src}
              alt={images[0].alt}
              fill
              className="object-cover"
              sizes="80vw"
              priority
            />
            {/* Gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/30 via-transparent to-transparent" />
          </div>

          {/* Floating badge (per-tab, optional) */}
          {overlayBadge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-repwell-teal-500">{overlayBadge.title}</p>
                  <p className="text-xs text-repwell-teal-400">{overlayBadge.subtitle}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      );

    // Grid layout with 2 small + 1 tall image
    case "grid":
    default:
      return (
        <motion.div
          variants={imageVariants}
          className="relative h-full min-h-[400px] lg:min-h-[620px] xl:min-h-[700px] pl-4 xl:pl-0"
        >
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
            {/* Top left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-start-1 col-end-2 row-start-1 row-end-2 overflow-hidden rounded-xl shadow-lg"
            >
              <div className="relative h-full w-full">
                <Image
                  src={images[0].src}
                  alt={images[0].alt}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            </motion.div>

            {/* Bottom left */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-start-1 col-end-2 row-start-2 row-end-3 overflow-hidden rounded-xl shadow-lg"
            >
              <div className="relative h-full w-full">
                <Image
                  src={images[1].src}
                  alt={images[1].alt}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
              </div>
            </motion.div>

            {/* Right tall */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-start-2 col-end-3 row-start-1 row-end-3 overflow-hidden rounded-l-xl shadow-xl"
            >
              <div className="relative h-full w-full">
                <Image
                  src={images[2].src}
                  alt={images[2].alt}
                  fill
                  className="object-cover"
                  sizes="25vw"
                />
                {/* Overlay with stat */}
                <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/60 to-transparent" />
                <div className="absolute bottom-6 left-6 text-white">
                  <p className="font-display text-4xl font-bold">+300%</p>
                  <p className="text-sm opacity-90">Review growth</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      );
  }
}

interface FeatureTabsShowcaseProps {
  className?: string;
  badge?: string;
  heading?: string;
  subheading?: string;
}

export function FeatureTabsShowcase({
  className,
  badge = "Core Features",
  heading = "Everything You Need",
  subheading = "A complete platform for collecting reviews, tracking metrics, and building your reputation.",
}: FeatureTabsShowcaseProps) {
  const [activeTab, setActiveTab] = React.useState(FEATURE_TABS[0].tabName);
  const activeFeature = FEATURE_TABS.find((tab) => tab.tabName === activeTab) || FEATURE_TABS[0];

  return (
    <section className={cn("py-16 md:py-24 lg:py-32 bg-white overflow-hidden", className)}>
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            {badge}
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            {heading}
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            {subheading}
          </p>
        </motion.div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 lg:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 md:gap-4"
        >
          {FEATURE_TABS.map((tab) => {
            const isActive = activeTab === tab.tabName;
            return (
              <button
                key={tab.tabName}
                onClick={() => setActiveTab(tab.tabName)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg font-sans font-medium text-sm md:text-base transition-all duration-200",
                  isActive
                    ? "text-white"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {/* Active indicator background */}
                {isActive && (
                  <motion.div
                    layoutId="featureTabBg"
                    className="absolute inset-0 bg-repwell-teal-300 rounded-lg"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon
                  className={cn(
                    "relative z-10 w-4 h-4 transition-transform duration-300",
                    isActive && "scale-110"
                  )}
                />
                <span className="relative z-10">{tab.tabName}</span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Full-width content area */}
      <div className="relative overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[500px] lg:min-h-[620px] xl:min-h-[700px]"
          >
            {/* Text content - left side */}
            <motion.div
              variants={contentVariants}
              className="flex flex-col justify-center px-4 sm:px-6 lg:px-0 lg:pl-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:pr-12 xl:pr-16 py-16 lg:py-20 xl:py-24"
            >
              {/* Icon + stat badge */}
              <motion.div variants={itemVariants} className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-teal-300 text-white shadow-lg shadow-repwell-teal-300/20">
                  <activeFeature.icon className="h-7 w-7" />
                </div>
                {activeFeature.stat && (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-repwell-teal-300">
                      {activeFeature.stat.value}
                    </span>
                    <span className="text-sm text-repwell-teal-400">
                      {activeFeature.stat.label}
                    </span>
                  </div>
                )}
              </motion.div>

              {/* Title */}
              <motion.h3
                variants={itemVariants}
                className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-repwell-teal-500 leading-tight mb-5"
              >
                {activeFeature.title}
              </motion.h3>

              {/* Summary */}
              <motion.p
                variants={itemVariants}
                className="text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-8"
              >
                {activeFeature.summary}
              </motion.p>

              {/* Bullet points */}
              {activeFeature.bulletPoints && (
                <motion.ul variants={itemVariants} className="space-y-4 mb-8">
                  {activeFeature.bulletPoints.map((point, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-1" />
                      <span className="text-repwell-teal-400 text-base md:text-lg">{point}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}

              {/* CTA button */}
              {activeFeature.link && (
                <motion.div variants={itemVariants}>
                  <Button asChild size="lg" className="group">
                    <Link href={activeFeature.link.href}>
                      {activeFeature.link.name}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </motion.div>
              )}
            </motion.div>

            {/* Image content - right side with mixed layouts */}
            <div className="h-full w-full">
              <AnimatePresence mode="wait">
                <FeatureImages
                  key={`images-${activeTab}`}
                  variant={activeFeature.layoutVariant}
                  images={activeFeature.images}
                  overlayBadge={activeFeature.overlayBadge}
                />
              </AnimatePresence>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
