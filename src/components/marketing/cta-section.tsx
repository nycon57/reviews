"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BuildingOffice as Building2,
  Clock,
  FileText,
  Headphones,
  Lock,
  GearSix as Settings2,
  Shield,
  Users,
} from "@phosphor-icons/react";
import { fadeInUp, staggerChildrenDelayed } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTASectionProps {
  /** Main heading */
  title?: string;
  /** Supporting text */
  description?: string;
  /** Primary CTA button */
  primaryCta?: {
    label: string;
    href: string;
  };
  /** Optional secondary CTA button */
  secondaryCta?: {
    label: string;
    href: string;
  };
  className?: string;
  /** Visual style variant */
  variant?: "default" | "gradient" | "dark" | "subtle" | "enterprise";
  /** Show decorative elements */
  withDecoration?: boolean;
}

const enterpriseFeatures = [
  {
    icon: Lock,
    text: "Enterprise-grade SSO integration",
  },
  {
    icon: Building2,
    text: "Multi-branch management",
  },
  {
    icon: Shield,
    text: "Workflow governance tools",
  },
  {
    icon: FileText,
    text: "Custom reporting & analytics",
  },
  {
    icon: Users,
    text: "Dedicated account manager",
  },
  {
    icon: Settings2,
    text: "White-label customization",
  },
  {
    icon: Clock,
    text: "Priority SLA support",
  },
  {
    icon: Headphones,
    text: "24/7 phone & chat support",
  },
];

function FeatureList() {
  return (
    <ul className="grid max-w-[36.25rem] grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      {enterpriseFeatures.map((item, i) => (
        <li key={`cta-item-${i}`} className="flex items-center gap-3">
          <item.icon className="h-5 w-5 stroke-white" />
          <span className="font-sans text-sm text-white">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

export function CTASection({
  title = "Ready to Transform Your Customer Experience?",
  description = "Use RepWell to build trust, collect reviews, and manage customer experience workflows.",
  primaryCta = {
    label: "Start Free Trial",
    href: "/signup",
  },
  secondaryCta = {
    label: "Schedule Demo",
    href: "/demo",
  },
  className,
  variant = "enterprise",
  withDecoration = true,
}: CTASectionProps) {
  // Enterprise variant - the new default
  if (variant === "enterprise") {
    return (
      <section
        className={cn(
          "relative overflow-hidden bg-gradient-to-br from-repwell-teal-500 via-repwell-teal-400 to-repwell-teal-300 py-32",
          className
        )}
        suppressHydrationWarning
      >
        {/* Image Collage - positioned to section edges */}
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[46rem] xl:block">
          {/* Top right small image - faded */}
          <div className="absolute right-0 top-8 aspect-[1.15] w-[18rem] opacity-50">
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/fabian-centeno-njeVb6E3XB8-unsplash.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
          {/* Middle right main image */}
          <div className="absolute right-0 top-1/3 z-10 aspect-[0.709] w-[22rem] overflow-hidden rounded-tl-md">
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/jason-goodman-ZJlfUi5rTDU-unsplash.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
          {/* Large background image - very faded */}
          <div className="absolute bottom-0 right-0 aspect-[1.35] w-[46rem] overflow-hidden rounded-tl-2xl opacity-20">
            <img
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/photos/redd-f-5U_28ojjgms-unsplash.jpg"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>
        </div>

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-2xl">
            {/* Content */}
            <div className="flex flex-col gap-6 md:gap-9">
              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-display text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl"
              >
                <span className="block text-repwell-sage-100">Enterprise:</span>
                Scale your reputation
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-sans text-lg text-white/90 md:text-xl lg:text-2xl"
              >
                Empower every team member with AI-powered reputation tools
              </motion.p>

              {/* Feature List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <FeatureList />
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Button
                  asChild
                    size="lg"
                    className="group w-full bg-white text-repwell-teal-500 shadow-lg hover:bg-repwell-sage-100 md:w-fit"
                  >
                  <Link href="/contact">
                    Get in touch to learn more
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Original variants for backwards compatibility
  const isDark = variant === "gradient" || variant === "dark";
  const variantStyles = {
    default: "bg-repwell-sage-100",
    gradient:
      "bg-gradient-to-br from-repwell-teal-400 to-repwell-teal-300 text-white",
    dark: "bg-repwell-teal-500 text-white",
    subtle: "bg-repwell-sage-100/50",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden py-16 md:py-24",
        variantStyles[variant as keyof typeof variantStyles],
        className
      )}
    >
      {/* Decorative elements */}
      {withDecoration && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className={cn(
              "absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl",
              isDark ? "bg-white/10" : "bg-repwell-teal-300/10"
            )}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className={cn(
              "absolute -bottom-20 -left-20 h-48 w-48 rounded-full blur-3xl",
              isDark ? "bg-white/5" : "bg-repwell-teal-300/10"
            )}
          />
        </>
      )}

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerChildrenDelayed}
        className="container relative mx-auto px-4 text-center"
      >
        <motion.h2
          variants={fadeInUp}
          className={cn(
            "mx-auto max-w-3xl font-display text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl",
            isDark ? "text-white" : "text-repwell-teal-500"
          )}
        >
          {title}
        </motion.h2>

        {description && (
          <motion.p
            variants={fadeInUp}
            className={cn(
              "mx-auto mt-4 max-w-2xl font-sans text-lg leading-relaxed",
              isDark ? "text-white/80" : "text-repwell-teal-400"
            )}
          >
            {description}
          </motion.p>
        )}

        <motion.div
          variants={fadeInUp}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link href={primaryCta.href}>
            <Button
              size="lg"
              variant={isDark ? "secondary" : "default"}
              className={cn(
                "group",
                isDark && "bg-white text-repwell-teal-500 hover:bg-white/90"
              )}
            >
              {primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          {secondaryCta && (
            <Link href={secondaryCta.href}>
              <Button
                size="lg"
                variant={isDark ? "ghost" : "outline"}
                className={cn(
                  isDark &&
                    "border-white/30 text-white hover:border-white/50 hover:bg-white/10"
                )}
              >
                {secondaryCta.label}
              </Button>
            </Link>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
