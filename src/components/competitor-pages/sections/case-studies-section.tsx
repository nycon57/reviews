"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { CaseStudy, CaseStudyMetric } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUp,
  Buildings,
} from "@phosphor-icons/react";

interface CaseStudiesSectionProps {
  caseStudies: CaseStudy[];
}

interface MetricDeltaProps {
  metric: CaseStudyMetric;
}

interface CaseStudyCardProps {
  study: CaseStudy;
  index: number;
  isVisible: boolean;
}

/** Renders a before/after metric with percentage change. */
function MetricDelta({ metric }: MetricDeltaProps) {
  return (
    <div className="text-center">
      <p className="font-sans text-xs font-medium text-repwell-teal-300">
        {metric.label}
      </p>
      <div className="mt-1.5 flex items-center justify-center gap-1.5">
        <span className="font-sans text-sm text-repwell-teal-400">
          {metric.before}
        </span>
        <ArrowRight
          weight="bold"
          className="h-3 w-3 shrink-0 text-repwell-teal-300/50"
          aria-hidden="true"
        />
        <span className="font-sans text-sm font-semibold text-repwell-teal-500">
          {metric.after}
        </span>
      </div>
      {metric.percentageChange && (
        <div className="mt-1 flex items-center justify-center gap-0.5">
          <ArrowUp
            weight="bold"
            className="h-3 w-3 text-repwell-sage-200"
            aria-hidden="true"
          />
          <span className="font-sans text-xs font-semibold text-repwell-sage-200">
            {metric.percentageChange}
          </span>
        </div>
      )}
    </div>
  );
}

/** Single case study card with logo, industry badge, metrics, quote, and CTA. */
function CaseStudyCard({ study, index, isVisible }: CaseStudyCardProps) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-md",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      style={{ transitionDelay: isVisible ? `${index * 120 + 300}ms` : "0ms" }}
    >
      <div
        className="h-1.5 rounded-t-xl bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200"
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-6 lg:p-8">
        <div className="flex items-center gap-3">
          {study.logo ? (
            <Image
              src={study.logo}
              alt={`${study.companyName} logo`}
              width={40}
              height={40}
              sizes="40px"
              className="h-10 w-10 rounded-lg border border-border object-contain p-1"
              loading="lazy"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-repwell-sage-100/30"
              aria-hidden="true"
            >
              <Buildings
                weight="duotone"
                className="h-5 w-5 text-repwell-teal-300"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
              {study.companyName}
            </h3>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full border border-repwell-teal-300/20 bg-repwell-teal-300/5 px-2.5 py-0.5 font-sans text-xs font-medium text-repwell-teal-300">
            {study.industry}
          </span>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-border/50 bg-background-subtle p-4 sm:grid-cols-3">
          {study.metrics.map((m) => (
            <MetricDelta key={m.label} metric={m} />
          ))}
        </div>

        <blockquote className="mt-6 flex-1 border-l-2 border-repwell-sage-200/50 pl-4">
          <p className="font-sans text-sm leading-relaxed text-repwell-teal-400 italic">
            &ldquo;{study.quote}&rdquo;
          </p>
        </blockquote>

        <a
          href={study.ctaHref}
          className="mt-6 inline-flex items-center gap-1.5 font-sans text-sm font-semibold text-repwell-teal-300 transition-colors duration-200 hover:text-repwell-teal-400 focus:outline-none focus-visible:underline"
        >
          Read full case study
          <ArrowRight
            weight="bold"
            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </div>
  );
}

/** Section 13: Case Studies -- 2x2 grid with scroll-triggered entrance animations. */
export function CaseStudiesSection({
  caseStudies,
}: CaseStudiesSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (caseStudies.length === 0) return null;

  return (
    <div ref={sectionRef}>
      <div className="mx-auto max-w-3xl text-center">
        <p
          className={cn(
            "font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 transition-all duration-500",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
          )}
        >
          Proven Results
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 transition-all duration-500 md:text-4xl lg:text-5xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          Customer Success Stories
        </h2>

        <p
          className={cn(
            "mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 transition-all duration-500 md:text-xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        >
          See how companies like yours transformed their review strategy with
          RepWell.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
        {caseStudies.map((study, i) => (
          <CaseStudyCard
            key={study.companyName}
            study={study}
            index={i}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  );
}
