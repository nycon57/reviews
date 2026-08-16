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
  /** Small copy below the CTA buttons */
  microcopy?: string;
}

const enterpriseFeatures = [
  {
    icon: Lock,
    text: "SSO/SAML & white-label",
  },
  {
    icon: Building2,
    text: "Team management & leaderboards",
  },
  {
    icon: Shield,
    text: "Manager dashboard with org-wide analytics",
  },
  {
    icon: FileText,
    text: "Webhooks & CSV bulk import",
  },
  {
    icon: Users,
    text: "Unlimited team members",
  },
  {
    icon: Settings2,
    text: "Unlimited surveys & API",
  },
  {
    icon: Clock,
    text: "Employee experience surveys",
  },
  {
    icon: Headphones,
    text: "Dedicated success manager",
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
  microcopy,
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
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42rem] overflow-hidden xl:block"
        >
          <div className="absolute right-[-5rem] top-[-4rem] h-[42rem] w-56 rotate-12 bg-white/10" />
          <div className="absolute right-44 top-[-4rem] h-[42rem] w-36 rotate-12 bg-repwell-sage-100/20" />
          <div className="absolute right-[21rem] top-[-4rem] h-[42rem] w-24 rotate-12 bg-white/10" />
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
                Bring team-level reputation workflows, analytics, and controls into one workspace.
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
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="group w-full bg-white text-repwell-teal-500 shadow-lg hover:bg-repwell-sage-100 sm:w-fit"
                  >
                    <Link href={primaryCta.href}>
                      {primaryCta.label}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  {secondaryCta && (
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="w-full border-white/40 bg-transparent text-white hover:bg-white/10 sm:w-fit"
                    >
                      <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                    </Button>
                  )}
                </div>
                {microcopy && <p className="mt-4 font-sans text-sm text-white/80">{microcopy}</p>}
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
    gradient: "bg-gradient-to-br from-repwell-teal-400 to-repwell-teal-300 text-white",
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

        <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href={primaryCta.href}>
            <Button
              size="lg"
              variant={isDark ? "secondary" : "default"}
              className={cn("group", isDark && "bg-white text-repwell-teal-500 hover:bg-white/90")}
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
                  isDark && "border-white/30 text-white hover:border-white/50 hover:bg-white/10"
                )}
              >
                {secondaryCta.label}
              </Button>
            </Link>
          )}
        </motion.div>
        {microcopy && (
          <motion.p
            variants={fadeInUp}
            className={cn(
              "mt-4 font-sans text-sm",
              isDark ? "text-white/75" : "text-repwell-teal-400/70"
            )}
          >
            {microcopy}
          </motion.p>
        )}
      </motion.div>
    </section>
  );
}
