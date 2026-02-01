"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { MigrationSection } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import {
  Clock,
  ArrowRight,
  Lightning,
} from "@phosphor-icons/react";

interface MigrationStepsSectionProps {
  config: MigrationSection;
}

/** Single step card with number badge, title, and description. */
function StepCard({
  step,
  index,
  total,
  isVisible,
}: {
  step: { number: number; title: string; description: string };
  index: number;
  total: number;
  isVisible: boolean;
}) {
  return (
    <div className="flex flex-1 flex-col items-center text-center">
      {/* Number badge */}
      <div
        className={cn(
          "relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-repwell-teal-300 font-display text-xl font-bold text-white shadow-md transition-all duration-500",
          isVisible
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-90",
        )}
        style={{ transitionDelay: isVisible ? `${index * 150}ms` : "0ms" }}
        aria-label={`Step ${step.number} of ${total}`}
      >
        {step.number}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "mt-5 font-sans text-lg font-semibold text-repwell-teal-500 transition-all duration-500 md:text-xl",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        style={{
          transitionDelay: isVisible ? `${index * 150 + 100}ms` : "0ms",
        }}
      >
        {step.title}
      </h3>

      {/* Description */}
      <p
        className={cn(
          "mt-2 max-w-xs font-sans text-sm leading-relaxed text-repwell-teal-400 transition-all duration-500",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
        style={{
          transitionDelay: isVisible ? `${index * 150 + 200}ms` : "0ms",
        }}
      >
        {step.description}
      </p>
    </div>
  );
}

/**
 * Section 11: Migration Steps.
 *
 * Renders a 3-step horizontal stepper (vertical on mobile) showing how easy
 * it is to migrate to RepWell. Includes a contract buyout callout, timeline
 * indicator, and a CTA to start the migration process.
 *
 * All content is driven by config data. Animations are scroll-triggered
 * and respect prefers-reduced-motion.
 */
export function MigrationStepsSection({
  config,
}: MigrationStepsSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (config.steps.length === 0) return null;

  return (
    <div ref={sectionRef}>
      {/* Section header */}
      <div className="mx-auto max-w-3xl text-center">
        <p
          className={cn(
            "font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 transition-all duration-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Seamless Transition
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 transition-all duration-500 md:text-4xl lg:text-5xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          Migrate in {config.timeline}
        </h2>

        <p
          className={cn(
            "mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 transition-all duration-500 md:text-xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        >
          Our dedicated migration team handles everything so you can focus on
          your business.
        </p>
      </div>

      {/* Steps — horizontal on desktop, vertical on mobile */}
      <div className="relative mx-auto mt-14 max-w-4xl">
        {/* Horizontal connector line (desktop only) */}
        <div
          className={cn(
            "absolute left-0 right-0 top-7 hidden h-0.5 bg-repwell-sage-200/30 transition-all duration-700 md:block",
            isVisible ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "300ms" : "0ms" }}
          aria-hidden="true"
        />

        {/* Desktop layout: horizontal */}
        <div className="hidden gap-8 md:flex">
          {config.steps.map((step, i) => (
            <StepCard
              key={step.number}
              step={step}
              index={i}
              total={config.steps.length}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Mobile layout: vertical with connector */}
        <div className="flex flex-col gap-0 md:hidden">
          {config.steps.map((step, i) => (
            <div key={step.number} className="relative flex gap-5">
              {/* Vertical connector */}
              {i < config.steps.length - 1 && (
                <div
                  className="absolute left-7 top-14 h-full w-0.5 bg-repwell-sage-200/30"
                  aria-hidden="true"
                />
              )}

              {/* Number badge */}
              <div
                className={cn(
                  "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-repwell-teal-300 font-display text-xl font-bold text-white shadow-md transition-all duration-500",
                  isVisible
                    ? "translate-y-0 opacity-100 scale-100"
                    : "translate-y-4 opacity-0 scale-90",
                )}
                style={{
                  transitionDelay: isVisible ? `${i * 150}ms` : "0ms",
                }}
                aria-label={`Step ${step.number} of ${config.steps.length}`}
              >
                {step.number}
              </div>

              {/* Content */}
              <div
                className={cn(
                  "pb-10 transition-all duration-500",
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0",
                )}
                style={{
                  transitionDelay: isVisible ? `${i * 150 + 100}ms` : "0ms",
                }}
              >
                <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
                  {step.title}
                </h3>
                <p className="mt-1 font-sans text-sm leading-relaxed text-repwell-teal-400">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom area: timeline badge + contract buyout + CTA */}
      <div
        className={cn(
          "mt-12 flex flex-col items-center gap-5 transition-all duration-500",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        )}
        style={{ transitionDelay: isVisible ? "600ms" : "0ms" }}
      >
        {/* Timeline indicator */}
        <div className="inline-flex items-center gap-2 rounded-full border border-repwell-teal-300/20 bg-repwell-teal-300/5 px-4 py-2">
          <Clock weight="duotone" className="h-4 w-4 text-repwell-teal-300" aria-hidden="true" />
          <span className="font-sans text-sm font-medium text-repwell-teal-400">
            Estimated timeline: <strong className="text-repwell-teal-500">{config.timeline}</strong>
          </span>
        </div>

        {/* Contract buyout callout */}
        {config.contractBuyoutNote && (
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-repwell-sage-200/20 bg-repwell-sage-200/5 px-5 py-3 shadow-sm">
            <Lightning
              weight="duotone"
              className="h-5 w-5 shrink-0 text-repwell-sage-200"
              aria-hidden="true"
            />
            <span className="font-sans text-sm font-semibold text-repwell-teal-500">
              {config.contractBuyoutNote}
            </span>
          </div>
        )}

        {/* CTA */}
        <a
          href="/demo"
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-repwell-teal-300 px-6 py-3 font-sans text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-repwell-teal-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-repwell-teal-300 focus:ring-offset-2 active:bg-repwell-teal-500"
        >
          Start Your Migration
          <ArrowRight weight="bold" className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}
