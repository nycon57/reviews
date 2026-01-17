"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IndustryPageConfig } from "@/lib/industry/types";
import { PainPointSection } from "@/components/marketing/pain-point-section";
import { GuaranteeSection } from "@/components/marketing/guarantee-section";
import { FeatureTabsShowcase } from "@/components/marketing/feature-tabs-showcase";

interface IndustryLandingPageProps {
  config: IndustryPageConfig;
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
 * Hero Section
 */
function HeroSection({ config }: { config: IndustryPageConfig }) {
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
 * Stats Bar Section
 */
function StatsSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section className="py-12 md:py-16 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {config.stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="text-center"
            >
              <div className="font-display text-4xl md:text-5xl font-bold text-repwell-teal-300 mb-1">
                {stat.value}
              </div>
              <div className="font-sans text-sm font-medium text-repwell-teal-500">
                {stat.label}
              </div>
              {stat.description && (
                <div className="font-sans text-xs text-repwell-teal-400 mt-1">
                  {stat.description}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Role Tabs Section
 */
function RoleTabsSection({ config }: { config: IndustryPageConfig }) {
  const [activeRole, setActiveRole] = React.useState(config.roleTabs[0].role);
  const activeTab = config.roleTabs.find((tab) => tab.role === activeRole) || config.roleTabs[0];

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
            Built For Your Role
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Features for Every Level
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Whether you&apos;re an individual professional or managing an enterprise, we have you covered.
          </p>
        </motion.div>

        {/* Role tabs */}
        <div className="flex justify-center gap-2 md:gap-4 mb-12">
          {config.roleTabs.map((tab) => {
            const isActive = activeRole === tab.role;
            return (
              <button
                key={tab.role}
                onClick={() => setActiveRole(tab.role)}
                className={cn(
                  "relative px-4 py-2 md:px-6 md:py-3 rounded-lg font-sans font-medium text-sm md:text-base transition-all duration-200",
                  isActive
                    ? "bg-repwell-teal-300 text-white"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {tab.label}
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
              {activeTab.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                  <span className="font-sans text-repwell-teal-400">{feature}</span>
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
 * How It Works Section
 */
function HowItWorksSection({ config }: { config: IndustryPageConfig }) {
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
            Simple Setup
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            How It Works
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Get started in minutes, not weeks. Our team handles the heavy lifting.
          </p>
        </motion.div>

        {/* Timeline */}
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
 * Testimonials Section
 */
function TestimonialsSection({ config }: { config: IndustryPageConfig }) {
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
            Success Stories
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Trusted by Industry Leaders
          </h2>
        </motion.div>

        {/* Testimonials grid */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
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
 * Integrations Section
 */
function IntegrationsSection({ config }: { config: IndustryPageConfig }) {
  return (
    <section className="py-16 md:py-24 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Integrations
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Works With Your Tools
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Connect with the software you already use. No manual data entry required.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {config.integrations.map((integration, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-border hover:shadow-md transition-shadow duration-300"
            >
              <div className="w-12 h-12 bg-repwell-sage-100/50 rounded-lg flex items-center justify-center mb-3">
                <span className="text-repwell-teal-400 text-xs font-medium">
                  {integration.name.charAt(0)}
                </span>
              </div>
              <div className="font-sans text-sm font-medium text-repwell-teal-500 text-center">
                {integration.name}
              </div>
              <div className="font-sans text-xs text-repwell-teal-400 mt-1">
                {integration.category}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Final CTA Section
 */
function FinalCTASection({ config }: { config: IndustryPageConfig }) {
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

            {config.cta.urgencyText && (
              <div className="mb-8">
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  {config.cta.urgencyText}
                </Badge>
              </div>
            )}

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
 * Main Industry Landing Page Component
 */
export function IndustryLandingPage({ config }: IndustryLandingPageProps) {
  // Convert feature tabs to the format expected by FeatureTabsShowcase
  // For now, we'll use the generic showcase - can be enhanced later

  return (
    <main>
      {/* 1. Hero Section */}
      <HeroSection config={config} />

      {/* 2. Pain Points Section */}
      <PainPointSection
        badge="Common Challenges"
        heading="Sound Familiar?"
        subheading="These problems are costing you referrals, revenue, and reputation every day."
        painPoints={config.painPoints}
      />

      {/* 3. Stats Bar */}
      <StatsSection config={config} />

      {/* 4. Feature Tabs Showcase */}
      <FeatureTabsShowcase
        badge="Core Features"
        heading="Everything You Need"
        subheading="A complete platform for collecting reviews, tracking metrics, and building your reputation."
      />

      {/* 5. Role-Based Features */}
      <RoleTabsSection config={config} />

      {/* 6. How It Works */}
      <HowItWorksSection config={config} />

      {/* 7. Testimonials */}
      <TestimonialsSection config={config} />

      {/* 8. Integrations */}
      <IntegrationsSection config={config} />

      {/* 9. Guarantees */}
      <GuaranteeSection
        badge="Our Promise"
        heading="Risk-Free Guarantee"
        subheading="We're confident in our platform. If you're not completely satisfied, we'll make it right."
        guarantees={config.guarantees}
      />

      {/* 10. Final CTA */}
      <FinalCTASection config={config} />
    </main>
  );
}
