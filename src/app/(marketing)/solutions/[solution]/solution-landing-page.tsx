"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SolutionPageConfig } from "@/lib/solutions/types";

interface SolutionLandingPageProps {
  config: SolutionPageConfig;
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
 * Get Lucide icon component by name
 */
function getIconByName(name: string): LucideIcon {
  const icons = LucideIcons as unknown as Record<string, LucideIcon>;
  return icons[name] || LucideIcons.HelpCircle;
}

/**
 * Hero Section - Solution focused with stat highlight
 */
function HeroSection({ config }: { config: SolutionPageConfig }) {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
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
 * Challenges Section - The current state/pain
 */
function ChallengesSection({ config }: { config: SolutionPageConfig }) {
  return (
    <section className="py-16 md:py-24 bg-repwell-teal-500">
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
            className="px-4 py-1.5 text-sm border-white/30 text-white/80 mb-4"
          >
            Current Reality
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Sound Familiar?
          </h2>
          <p className="font-sans text-lg text-white/70 max-w-2xl mx-auto">
            These challenges are holding you back. We get it.
          </p>
        </motion.div>

        {/* Challenges grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 lg:gap-8"
        >
          {config.challenges.map((challenge, index) => {
            const Icon = getIconByName(challenge.icon);
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white flex-shrink-0">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-sans text-lg font-semibold text-white mb-2">
                      {challenge.title}
                    </h3>
                    <p className="font-sans text-sm text-white/70 leading-relaxed">
                      {challenge.description}
                    </p>
                    {challenge.stat && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="font-display text-2xl font-bold text-repwell-sage-200">
                          {challenge.stat.value}
                        </span>
                        <span className="font-sans text-xs text-white/60">
                          {challenge.stat.label}
                        </span>
                      </div>
                    )}
                  </div>
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
 * Approaches Section - The solution/how we solve it
 */
function ApproachesSection({ config }: { config: SolutionPageConfig }) {
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
            The Solution
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            How RepWell Solves This
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            A systematic approach that delivers results, not just features.
          </p>
        </motion.div>

        {/* Approaches grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 lg:gap-8"
        >
          {config.approaches.map((approach, index) => {
            const Icon = getIconByName(approach.icon);
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="group p-6 lg:p-8 bg-white border border-border rounded-2xl hover:shadow-lg hover:border-repwell-teal-300/50 transition-all duration-300"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-3">
                  {approach.title}
                </h3>
                <p className="font-sans text-repwell-teal-400 leading-relaxed mb-4">
                  {approach.description}
                </p>
                {approach.features && approach.features.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {approach.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 text-xs font-medium bg-repwell-sage-100/50 text-repwell-teal-400 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Impact Section - Metrics and outcomes
 */
function ImpactSection({ config }: { config: SolutionPageConfig }) {
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
            The Impact
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Results You Can Expect
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Real metrics from real customers using RepWell.
          </p>
        </motion.div>

        {/* Impact metrics */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {config.impacts.map((impact, index) => {
            const Icon = impact.icon ? getIconByName(impact.icon) : null;
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="text-center p-6 bg-white rounded-2xl border border-border"
              >
                {Icon && (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100 text-repwell-teal-300 mx-auto mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="font-display text-4xl md:text-5xl font-bold text-repwell-teal-300 mb-2">
                  {impact.value}
                </div>
                <div className="font-sans text-sm font-medium text-repwell-teal-500 mb-1">
                  {impact.label}
                </div>
                <div className="font-sans text-xs text-repwell-teal-400">
                  {impact.description}
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
 * Features Section - Features that power this solution
 */
function FeaturesSection({ config }: { config: SolutionPageConfig }) {
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
            Powered By
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Features That Make It Work
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            This solution combines multiple RepWell features for maximum impact.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {config.features.map((feature) => {
            const Icon = getIconByName(feature.icon);
            return (
              <motion.div key={feature.slug} variants={fadeInUp}>
                <Link
                  href={`/features/${feature.slug}`}
                  className="block group p-6 bg-white border border-border rounded-xl hover:shadow-md hover:border-repwell-teal-300/50 transition-all duration-300"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-repwell-teal-500 mb-2">
                    {feature.title}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {feature.contribution}
                  </p>
                  <div className="flex items-center gap-1 mt-3 text-repwell-teal-300 text-xs font-medium">
                    Learn more
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
 * Industry Applications Section
 */
function IndustryAppsSection({ config }: { config: SolutionPageConfig }) {
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
            Industry Applications
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Works for Your Industry
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            See how {config.shortTitle.toLowerCase()} applies to your specific industry.
          </p>
        </motion.div>

        {/* Industry applications grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {config.industryApps.map((app) => {
            const Icon = getIconByName(app.icon);
            return (
              <motion.div key={app.slug} variants={fadeInUp}>
                <Link
                  href={`/for/${app.slug}`}
                  className="block group p-6 bg-white border border-border rounded-xl hover:shadow-md hover:border-repwell-teal-300/50 transition-all duration-300 h-full"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-sans text-base font-semibold text-repwell-teal-500 mb-2">
                    {app.industry}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {app.application}
                  </p>
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
 * Success Stories Section
 */
function SuccessStoriesSection({ config }: { config: SolutionPageConfig }) {
  if (config.successStories.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
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

        {/* Success stories grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-6 lg:gap-8"
        >
          {config.successStories.map((story, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="bg-white border border-border rounded-2xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              {/* Result highlight */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-repwell-sage-100/50 rounded-full">
                  <Star className="w-4 h-4 fill-repwell-sage-200 text-repwell-sage-200" />
                  <span className="font-display text-xl font-bold text-repwell-teal-300">
                    {story.result.value}
                  </span>
                  <span className="font-sans text-xs text-repwell-teal-400">
                    {story.result.label}
                  </span>
                </div>
                {story.industry && (
                  <Badge variant="outline" className="text-xs">
                    {story.industry}
                  </Badge>
                )}
              </div>

              {/* Quote */}
              <blockquote className="font-sans text-repwell-teal-400 leading-relaxed mb-6">
                &ldquo;{story.quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-repwell-sage-100 flex items-center justify-center">
                  <span className="font-sans font-semibold text-repwell-teal-400">
                    {story.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-sans font-semibold text-repwell-teal-500">
                    {story.name}
                  </div>
                  <div className="font-sans text-sm text-repwell-teal-400">
                    {story.title}, {story.company}
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
 * Getting Started Section
 */
function GettingStartedSection({ config }: { config: SolutionPageConfig }) {
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
            Get Started
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Start in Minutes
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Three simple steps to {config.title.toLowerCase()}.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8"
        >
          {config.gettingStarted.map((step, index) => {
            const Icon = getIconByName(step.icon);
            return (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="relative"
              >
                {/* Connector line */}
                {index < config.gettingStarted.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-repwell-sage-200/50 -translate-y-1/2" />
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
 * Final CTA Section
 */
function FinalCTASection({ config }: { config: SolutionPageConfig }) {
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
 * Main Solution Landing Page Component
 * Follows Pain-Solution-Impact Framework
 */
export function SolutionLandingPage({ config }: SolutionLandingPageProps) {
  return (
    <main>
      {/* 1. Hero Section - Solution focus with stat highlight */}
      <HeroSection config={config} />

      {/* 2. Challenges Section - Current state/pain (empathetic) */}
      <ChallengesSection config={config} />

      {/* 3. Approaches Section - The solution/how we solve it */}
      <ApproachesSection config={config} />

      {/* 4. Impact Section - Metrics and outcomes */}
      <ImpactSection config={config} />

      {/* 5. Features Section - Features that power this solution */}
      <FeaturesSection config={config} />

      {/* 6. Industry Applications */}
      <IndustryAppsSection config={config} />

      {/* 7. Success Stories with results */}
      <SuccessStoriesSection config={config} />

      {/* 8. Getting Started - 3 steps */}
      <GettingStartedSection config={config} />

      {/* 9. Final CTA */}
      <FinalCTASection config={config} />
    </main>
  );
}
