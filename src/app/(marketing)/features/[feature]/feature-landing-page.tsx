"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import {
  ArrowRight,
  CheckCircle,
  Star,
  Question,
  type IconProps,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FeaturePageConfig } from "@/lib/features/types";
import { PainPointSection } from "@/components/marketing/pain-point-section";
import { getFeaturePageConfigBySlug } from "@/config/feature-pages";
import { getSolutionPageConfigBySlug } from "@/config/solution-pages";

interface FeatureLandingPageProps {
  config: FeaturePageConfig;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

/**
 * Get Phosphor icon component by name
 */
function getIconByName(name: string): React.ComponentType<IconProps> {
  // SAFETY: page configs only ever name Phosphor icon exports, and every icon
  // export is a component; the module's few non-component exports (IconContext,
  // SSR helpers) are never referenced by name here.
  const icon = PhosphorIcons[name as keyof typeof PhosphorIcons] as
    | React.ComponentType<IconProps>
    | undefined;
  return icon || Question;
}

/**
 * Hero Section
 */
function HeroSection({ config }: { config: FeaturePageConfig }) {
  return (
    <section className="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-repwell-sage-100/20 to-transparent" />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-repwell-teal-300 rounded-full opacity-60" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-repwell-sage-200 rounded-full opacity-40" />
        <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-repwell-sage-100 transform rotate-12" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-repwell-teal-300/30 transform rotate-45" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
            >
              {config.hero.badge}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            {config.hero.title}
            {config.hero.titleAccent && (
              <span className="text-repwell-sage-200">
                {config.hero.titleAccent}
              </span>
            )}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            {config.hero.description}
          </motion.p>

          {/* Stat highlight */}
          {config.hero.stat && (
            <motion.div variants={fadeInUp} className="mb-10">
              <div className="inline-flex items-center gap-4 px-6 py-3 bg-repwell-sage-100/50 rounded-full">
                <span className="font-display text-3xl font-bold text-repwell-teal-300">
                  {config.hero.stat.value}
                </span>
                <span className="font-sans text-sm text-repwell-teal-400">
                  {config.hero.stat.label}
                </span>
              </div>
            </motion.div>
          )}

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild>
              <Link href="/signup">
                {config.hero.primaryCta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">{config.hero.secondaryCta}</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Capabilities Section
 */
function CapabilitiesSection({ config }: { config: FeaturePageConfig }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Capabilities
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            What {config.title} Does
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Everything you need to {config.title.toLowerCase()} effectively and at scale.
          </p>
        </motion.div>

        {/* Capabilities grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {config.capabilities.map((capability, index) => {
            const Icon = getIconByName(capability.icon);
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-6 bg-white border border-border rounded-2xl hover:shadow-lg transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2">
                  {capability.title}
                </h3>
                <p className="font-sans text-sm text-repwell-teal-400 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * How It Works Section
 */
function HowItWorksSection({ config }: { config: FeaturePageConfig }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Simple Process
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            How It Works
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Get started in minutes. Our team handles the heavy lifting.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {config.howItWorks.map((step, index) => {
            const Icon = getIconByName(step.icon);
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative"
              >
                {/* Connector line */}
                {index < config.howItWorks.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-repwell-sage-200/50 -translate-y-1/2" />
                )}

                <div className="flex flex-col items-center text-center">
                  {/* Step number */}
                  <div className="relative mb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-repwell-teal-300 text-white shadow-lg">
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-repwell-sage-200 rounded-full flex items-center justify-center text-xs font-bold text-white">
                      {step.step}
                    </div>
                  </div>

                  <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2">
                    {step.title}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Use Cases Section
 */
function UseCasesSection({ config }: { config: FeaturePageConfig }) {
  const [activeRole, setActiveRole] = React.useState(config.useCases[0].role);
  const activeTab = config.useCases.find((uc) => uc.role === activeRole) || config.useCases[0];

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Use Cases
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Built For Your Role
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Whether you&apos;re an individual or managing an enterprise, we have you covered.
          </p>
        </motion.div>

        {/* Role tabs */}
        <div className="flex justify-center gap-2 md:gap-4 mb-12">
          {config.useCases.map((uc) => {
            const isActive = activeRole === uc.role;
            return (
              <button
                key={uc.role}
                onClick={() => setActiveRole(uc.role)}
                className={cn(
                  "relative px-4 py-2 md:px-6 md:py-3 rounded-lg font-sans font-medium text-sm md:text-base transition-all duration-200",
                  isActive
                    ? "bg-repwell-teal-300 text-white"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {uc.label}
              </button>
            );
          })}
        </div>

        {/* Active tab content */}
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid md:grid-cols-2 gap-12 items-center"
        >
          <div>
            <h3 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 mb-4">
              {activeTab.label}
            </h3>
            <p className="font-sans text-lg text-repwell-teal-400 mb-8">
              {activeTab.description}
            </p>
            <ul className="space-y-4">
              {activeTab.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                  <span className="font-sans text-repwell-teal-400">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/20 rounded-2xl flex items-center justify-center">
              <div className="text-repwell-teal-300/40 text-sm font-sans">
                Dashboard Preview
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Testimonials Section
 */
function TestimonialsSection({ config }: { config: FeaturePageConfig }) {
  if (config.testimonials.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Success Stories
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Real Results
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 lg:gap-8"
        >
          {config.testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-white border border-border rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Rating stars */}
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-repwell-sage-200 text-repwell-sage-200"
                    />
                  ))}
                </div>
              )}

              {/* Quote */}
              <blockquote className="font-sans text-repwell-teal-400 leading-relaxed mb-6">
                &ldquo;{testimonial.quote}&rdquo;
              </blockquote>

              {/* Result highlight */}
              {testimonial.result && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-repwell-sage-100/50 rounded-full mb-6">
                  <span className="font-display text-lg font-bold text-repwell-teal-300">
                    {testimonial.result}
                  </span>
                </div>
              )}

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-repwell-sage-100 flex items-center justify-center">
                  <span className="font-sans font-semibold text-repwell-teal-400">
                    {testimonial.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-sans font-semibold text-repwell-teal-500">
                    {testimonial.name}
                  </div>
                  <div className="font-sans text-sm text-repwell-teal-400">
                    {testimonial.title}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Related Features Section
 */
function RelatedFeaturesSection({ config }: { config: FeaturePageConfig }) {
  if (config.relatedFeatures.length === 0) return null;

  const relatedConfigs = config.relatedFeatures
    .map((slug) => getFeaturePageConfigBySlug(slug))
    .filter(Boolean);

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Related Features
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Works Great With
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Combine {config.shortTitle} with these features for even better results.
          </p>
        </motion.div>

        {/* Related features grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {relatedConfigs.map((related) => {
            if (!related) return null;
            const Icon = getIconByName(related.icon);
            return (
              <motion.div key={related.slug} variants={fadeInUp}>
                <Link
                  href={`/features/${related.slug}`}
                  className="block group p-6 bg-white border border-border rounded-2xl hover:shadow-lg hover:border-repwell-teal-300/50 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2 group-hover:text-repwell-teal-300 transition-colors">
                    {related.title}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {related.hero.description.slice(0, 100)}...
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-repwell-teal-300 text-sm font-medium">
                    Learn more
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Related Solutions Section
 */
function RelatedSolutionsSection({ config }: { config: FeaturePageConfig }) {
  if (!config.relatedSolutions || config.relatedSolutions.length === 0) return null;

  const relatedConfigs = config.relatedSolutions
    .map((slug) => getSolutionPageConfigBySlug(slug))
    .filter(Boolean);

  if (relatedConfigs.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Related Solutions
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Solutions This Powers
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            See how {config.shortTitle} drives results across these solutions.
          </p>
        </motion.div>

        {/* Related solutions grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className={cn(
            "grid gap-6",
            relatedConfigs.length === 1 ? "max-w-md mx-auto" : "md:grid-cols-2 max-w-3xl mx-auto"
          )}
        >
          {relatedConfigs.map((related) => {
            if (!related) return null;
            const Icon = getIconByName(related.icon);
            return (
              <motion.div key={related.slug} variants={fadeInUp}>
                <Link
                  href={`/solutions/${related.slug}`}
                  className="block group p-6 bg-white border border-border rounded-2xl hover:shadow-lg hover:border-repwell-teal-300/50 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2 group-hover:text-repwell-teal-300 transition-colors">
                    {related.title}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {related.hero.description.slice(0, 120)}...
                  </p>
                  <div className="flex items-center gap-1 mt-4 text-repwell-teal-300 text-sm font-medium">
                    Explore solution
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section
 */
function FinalCTASection({ config }: { config: FeaturePageConfig }) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative bg-repwell-teal-500 rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-repwell-teal-400/50 to-transparent" />

          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              {config.cta.headline}
            </h2>
            <p className="font-sans text-lg text-repwell-sage-100/80 mb-10">
              {config.cta.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100"
                asChild
              >
                <Link href="/signup">
                  {config.cta.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">{config.cta.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Main Feature Landing Page Component
 */
export function FeatureLandingPage({ config }: FeatureLandingPageProps) {
  // Convert problems to pain points format for reusable component
  const painPoints = config.problems.map((problem) => ({
    icon: problem.icon,
    title: problem.title,
    description: problem.description,
    stat: problem.stat,
  }));

  return (
    <main>
      {/* 1. Hero Section */}
      <HeroSection config={config} />

      {/* 2. Pain Points Section */}
      <PainPointSection
        badge="Common Challenges"
        heading="Sound Familiar?"
        subheading="These problems are costing you time, money, and growth every day."
        painPoints={painPoints}
      />

      {/* 3. Capabilities */}
      <CapabilitiesSection config={config} />

      {/* 4. How It Works */}
      <HowItWorksSection config={config} />

      {/* 5. Use Cases by Role */}
      <UseCasesSection config={config} />

      {/* 6. Testimonials */}
      <TestimonialsSection config={config} />

      {/* 7. Related Features */}
      <RelatedFeaturesSection config={config} />

      {/* 8. Related Solutions */}
      <RelatedSolutionsSection config={config} />

      {/* 9. Final CTA */}
      <FinalCTASection config={config} />
    </main>
  );
}
