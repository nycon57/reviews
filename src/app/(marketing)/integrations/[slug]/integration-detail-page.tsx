"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Question,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IntegrationPageConfig } from "@/lib/integrations/types";
import { getIntegrationBySlug } from "@/config/integration-pages";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

interface IntegrationDetailPageProps {
  config: IntegrationPageConfig;
}

/** Names of the icon components in the Phosphor namespace (excludes IconContext, SSR). */
type PhosphorIconName = {
  [K in keyof typeof PhosphorIcons]: (typeof PhosphorIcons)[K] extends Icon ? K : never;
}[keyof typeof PhosphorIcons];

/**
 * Get Phosphor icon component by name
 */
function getIconByName(name: string): Icon {
  // SAFETY: `name` holds a Phosphor export name from page config. Names that are not
  // exported resolve to undefined at runtime, which the `??` below replaces with the
  // Question fallback.
  const icon = PhosphorIcons[name as PhosphorIconName];
  return icon ?? Question;
}

/**
 * Render a dynamic Phosphor icon by name.
 * Uses createElement to avoid react-hooks/static-components lint rule
 * that disallows component references created during render.
 */
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  return React.createElement(getIconByName(name), { className });
}

const categoryLabels: Record<string, string> = {
  crm: "CRM Integration",
  reviews: "Review Platform",
  social: "Social Publishing",
  communication: "Communication",
  automation: "Automation",
  los: "Loan Origination",
};

/**
 * Hero Section
 */
function HeroSection({ config }: { config: IntegrationPageConfig }) {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-repwell-sage-100/20 to-transparent" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-repwell-teal-300 rounded-full opacity-60" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-repwell-sage-200 rounded-full opacity-40" />
        <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-repwell-sage-100 transform rotate-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link
            href="/integrations"
            className="inline-flex items-center gap-1.5 text-sm font-sans text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            All Integrations
          </Link>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-4xl"
        >
          {/* Icon + Badge */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center gap-4 mb-6"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-repwell-sage-100 text-repwell-teal-300">
              <DynamicIcon name={config.icon} className="h-8 w-8" />
            </div>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
            >
              {categoryLabels[config.category] ?? config.category}
            </Badge>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            {config.hero.headline}
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-10 max-w-2xl"
          >
            {config.hero.description}
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/demo">Book a Demo</Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Overview Section with data flow
 */
function OverviewSection({ config }: { config: IntegrationPageConfig }) {
  const directionIcons: Record<string, string> = {
    in: "ArrowDown",
    out: "ArrowUp",
    both: "ArrowsDownUp",
  };
  const directionLabels: Record<string, string> = {
    in: "Inbound",
    out: "Outbound",
    both: "Two-Way",
  };

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Overview
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-6">
              How It Works
            </h2>
            <p className="font-sans text-lg text-repwell-teal-400 leading-relaxed">
              {config.overview.whatItDoes}
            </p>
          </motion.div>

          {/* Data Flow */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="space-y-4"
          >
            <h3 className="font-sans text-sm font-semibold text-repwell-teal-400 uppercase tracking-wider mb-4">
              Data Flow
            </h3>
            {config.overview.dataFlow.map((flow, index) => {
              const FlowIcon = getIconByName(directionIcons[flow.direction]);
              return (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-start gap-4 p-4 bg-repwell-sage-100/30 border border-border rounded-xl"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      flow.direction === "in" &&
                        "bg-blue-100 text-blue-600",
                      flow.direction === "out" &&
                        "bg-green-100 text-green-600",
                      flow.direction === "both" &&
                        "bg-repwell-sage-100 text-repwell-teal-300"
                    )}
                  >
                    <FlowIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-sans text-xs font-semibold text-repwell-teal-400 uppercase">
                      {directionLabels[flow.direction]}
                    </span>
                    <p className="font-sans text-sm text-repwell-teal-500">
                      {flow.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Features Section
 */
function FeaturesSection({ config }: { config: IntegrationPageConfig }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Features
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            What This Integration Unlocks
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Connect {config.name} with RepWell and unlock powerful capabilities
            for your team.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {config.features.map((feature, index) => {
            const Icon = getIconByName(feature.icon);
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
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-repwell-teal-400 leading-relaxed">
                  {feature.description}
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
 * Setup Steps Section
 */
function SetupSection({ config }: { config: IntegrationPageConfig }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Setup Guide
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Get Connected in Minutes
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Setting up the {config.name} integration is simple. Follow these
            steps to get started.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {config.setupSteps.map((step, index) => {
            const Icon = getIconByName(step.icon);
            return (
              <motion.div key={index} variants={fadeInUp} className="relative">
                {/* Connector line */}
                {index < config.setupSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-repwell-sage-200/50 -translate-y-1/2" />
                )}

                <div className="flex flex-col items-center text-center">
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
function UseCasesSection({ config }: { config: IntegrationPageConfig }) {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-teal-500 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-sage-100/30 text-repwell-sage-100 bg-white/5 mb-4"
          >
            Use Cases
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Who Benefits Most
          </h2>
          <p className="font-sans text-lg text-repwell-sage-100/80 max-w-2xl mx-auto">
            See how teams use the {config.name} integration to improve their
            customer experience workflow.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 lg:gap-8"
        >
          {config.useCases.map((useCase, index) => (
            <motion.div
              key={index}
              variants={fadeInUp}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 transition-colors duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 mb-5">
                <CheckCircle className="w-5 h-5 text-repwell-sage-200" />
              </div>
              <h3 className="font-sans text-xl font-semibold text-white mb-3">
                {useCase.title}
              </h3>
              <p className="font-sans text-repwell-sage-100/70 leading-relaxed">
                {useCase.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Related Integrations Section
 */
function RelatedIntegrationsSection({
  config,
}: {
  config: IntegrationPageConfig;
}) {
  const relatedConfigs = config.relatedIntegrations
    .map((slug) => getIntegrationBySlug(slug))
    .filter(Boolean);

  if (relatedConfigs.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Related Integrations
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
            Works Great With
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            Combine {config.name} with these integrations for a more powerful
            workflow.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {relatedConfigs.map((related) => {
            if (!related) return null;
            const Icon = getIconByName(related.icon);
            return (
              <motion.div key={related.slug} variants={fadeInUp}>
                <Link
                  href={`/integrations/${related.slug}`}
                  className="block group p-6 bg-white border border-border rounded-2xl hover:shadow-lg hover:border-repwell-teal-300/50 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2 group-hover:text-repwell-teal-300 transition-colors">
                    {related.name}
                  </h3>
                  <p className="font-sans text-sm text-repwell-teal-400">
                    {related.shortDescription.slice(0, 100)}...
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
 * Final CTA Section
 */
function FinalCTASection({ config }: { config: IntegrationPageConfig }) {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewportOnce}
          transition={{ duration: 0.6 }}
          className="relative bg-repwell-teal-500 rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-repwell-teal-400/50 to-transparent" />

          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Connect {config.name}?
            </h2>
            <p className="font-sans text-lg text-repwell-sage-100/80 mb-10">
              Get started with the {config.name} integration today. Our team is
              here to help you set up and optimize your workflow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100"
                asChild
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
                asChild
              >
                <Link href="/demo">Book a Demo</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Main Integration Detail Page Component
 */
export function IntegrationDetailPage({ config }: IntegrationDetailPageProps) {
  return (
    <main>
      <HeroSection config={config} />
      <OverviewSection config={config} />
      <FeaturesSection config={config} />
      <SetupSection config={config} />
      <UseCasesSection config={config} />
      <RelatedIntegrationsSection config={config} />
      <FinalCTASection config={config} />
    </main>
  );
}
