"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as PhosphorIcons from "@phosphor-icons/react";
import {
  ArrowRight,
  MagnifyingGlass,
  Question,
  type Icon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { IntegrationPageConfig, IntegrationCategory } from "@/lib/integrations/types";
import { integrationCategories } from "@/config/integration-pages";
import { fadeInUp, staggerContainer, viewportOnce } from "@/lib/motion";

interface IntegrationsDirectoryClientProps {
  integrations: IntegrationPageConfig[];
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

/**
 * Category label lookup
 */
const categoryLabels: Record<IntegrationCategory, string> = {
  crm: "CRM",
  reviews: "Reviews",
  social: "Social",
  communication: "Communication",
  automation: "Automation",
  los: "Loan Origination",
};

/**
 * Hero Section
 */
function HeroSection() {
  return (
    <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-repwell-sage-100/20 to-transparent" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-repwell-teal-300 rounded-full opacity-60" />
        <div className="absolute top-40 right-20 w-3 h-3 bg-repwell-sage-200 rounded-full opacity-40" />
        <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-repwell-sage-100 transform rotate-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div variants={fadeInUp} className="mb-6">
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
            >
              Integrations
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            Connect RepWell With{" "}
            <span className="text-repwell-sage-200">Your Favorite Tools</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Seamlessly integrate with CRMs, review platforms, communication
            tools, and more. Keep your workflow connected and your data in sync.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/**
 * Integration Card
 */
function IntegrationCard({ config }: { config: IntegrationPageConfig }) {
  return (
    <motion.div variants={fadeInUp}>
      <Link
        href={`/integrations/${config.slug}`}
        className="group block h-full p-6 bg-white border border-border rounded-2xl hover:shadow-lg hover:border-repwell-teal-300/50 transition-all duration-300"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 text-repwell-teal-300 mb-4 group-hover:bg-repwell-teal-300 group-hover:text-white transition-colors duration-300">
          <DynamicIcon name={config.icon} className="h-6 w-6" />
        </div>

        <div className="mb-3">
          <Badge
            variant="outline"
            className="text-xs border-repwell-sage-200/50 text-repwell-teal-400"
          >
            {categoryLabels[config.category]}
          </Badge>
        </div>

        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500 mb-2 group-hover:text-repwell-teal-300 transition-colors">
          {config.name}
        </h3>

        <p className="font-sans text-sm text-repwell-teal-400 leading-relaxed mb-4">
          {config.shortDescription}
        </p>

        <div className="flex items-center gap-1 text-repwell-teal-300 text-sm font-medium">
          Learn more
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </motion.div>
  );
}

/**
 * Bottom CTA Section
 */
function BottomCTASection() {
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
              Don&apos;t See Your Integration?
            </h2>
            <p className="font-sans text-lg text-repwell-sage-100/80 mb-10">
              We&apos;re always adding new integrations. Request one or use
              Zapier to connect with 5,000+ apps today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100"
                asChild
              >
                <Link href="/contact">
                  Request an Integration
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
 * Integrations Directory Client Component
 */
export function IntegrationsDirectoryClient({
  integrations,
}: IntegrationsDirectoryClientProps) {
  const [search, setSearch] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<
    IntegrationCategory | "all"
  >("all");

  const filtered = React.useMemo(() => {
    return integrations.filter((config) => {
      const matchesCategory =
        activeCategory === "all" || config.category === activeCategory;
      const matchesSearch =
        search === "" ||
        config.name.toLowerCase().includes(search.toLowerCase()) ||
        config.shortDescription.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [integrations, activeCategory, search]);

  return (
    <main>
      <HeroSection />

      {/* Filter & Grid Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + Category Filters */}
          <div className="flex flex-col gap-6 mb-12">
            {/* Search bar */}
            <div className="relative max-w-md mx-auto w-full">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-repwell-teal-400/60" />
              <Input
                type="text"
                placeholder="Search integrations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-4 py-2 rounded-lg font-sans font-medium text-sm transition-all duration-200",
                  activeCategory === "all"
                    ? "bg-repwell-teal-300 text-white"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                All
              </button>
              {integrationCategories.map((cat) => {
                const CatIcon = getIconByName(cat.icon);
                return (
                  <button
                    key={cat.slug}
                    onClick={() => setActiveCategory(cat.slug)}
                    className={cn(
                      "flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans font-medium text-sm transition-all duration-200",
                      activeCategory === cat.slug
                        ? "bg-repwell-teal-300 text-white"
                        : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                    )}
                  >
                    <CatIcon className="h-4 w-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integration Grid */}
          {filtered.length > 0 ? (
            <motion.div
              key={`${activeCategory}-${search}`}
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filtered.map((config) => (
                <IntegrationCard key={config.slug} config={config} />
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <p className="font-sans text-lg text-repwell-teal-400">
                No integrations match your search. Try a different term or
                category.
              </p>
            </div>
          )}
        </div>
      </section>

      <BottomCTASection />
    </main>
  );
}
