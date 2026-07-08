import type { ElementType, ReactNode } from "react";

import { DirectoryBreadcrumbs } from "@/components/shared/directory-breadcrumbs";
import type { DirectoryBreadcrumbItem } from "@/lib/directory/breadcrumb-utils";
import type { IndustryType } from "@/lib/industry/types";
import { CheckCircle, MagnifyingGlass, MapPin, Star } from "@phosphor-icons/react/dist/ssr";
import { IndustryFilter } from "./industry-filter";

export interface DirectoryAvailableIndustry {
  value: IndustryType;
  label: string;
  count: number;
}

interface DirectoryIndustryContext {
  industry: IndustryType;
  label: string;
  professional: string;
  professionalPlural: string;
  breadcrumbs: DirectoryBreadcrumbItem[];
  availableIndustries: DirectoryAvailableIndustry[];
}

interface DirectoryPageShellProps {
  children: ReactNode;
  industryContext?: DirectoryIndustryContext;
}

interface DirectoryFeature {
  icon: ElementType;
  title: string;
  description: string;
}

function getDirectoryFeatures(industryContext?: DirectoryIndustryContext): DirectoryFeature[] {
  if (!industryContext) {
    return [
      {
        icon: Star,
        title: "Verified Reviews",
        description:
          "Our professional directory makes it easy to find and compare experts. Read real customer reviews, see ratings, and contact professionals directly.",
      },
      {
        icon: CheckCircle,
        title: "Quality Professionals",
        description:
          "Consider professionals with high ratings, experience in your area of need, and positive customer feedback about communication and service quality.",
      },
      {
        icon: MapPin,
        title: "Local Search",
        description:
          "Search by your city or state, filter by rating, and browse profiles. Once you find a professional you like, contact them directly to get started.",
      },
    ];
  }

  const label = industryContext.label;
  const professional = industryContext.professional.toLowerCase();
  const professionalPlural = industryContext.professionalPlural.toLowerCase();

  return [
    {
      icon: Star,
      title: `Why Choose Our ${label} Directory?`,
      description: `Our ${label.toLowerCase()} professional directory makes it easy to find and compare ${professionalPlural}. Read real customer reviews, see ratings, and contact professionals directly.`,
    },
    {
      icon: CheckCircle,
      title: "What to Look For",
      description: `Consider ${professionalPlural} with high ratings, experience in your specific needs, and positive customer feedback about communication and service quality.`,
    },
    {
      icon: MapPin,
      title: "Getting Started",
      description: `Search by your city or state, filter by rating, and browse profiles. Once you find a ${professional} you like, contact them directly to get started.`,
    },
  ];
}

export function getDirectoryContentSectionClassName(isIndustryPage: boolean) {
  return isIndustryPage ? "py-8 md:py-12" : "pt-8 pb-16 md:pt-12 md:pb-24";
}

export function DirectoryPageShell({ children, industryContext }: DirectoryPageShellProps) {
  const isIndustryPage = Boolean(industryContext);
  const features = getDirectoryFeatures(industryContext);

  const heroSectionClassName = isIndustryPage
    ? "relative overflow-hidden bg-gradient-to-b from-repwell-sage-100/20 to-transparent pt-16 pb-12 md:pt-24 md:pb-16"
    : "relative overflow-hidden bg-gradient-to-b from-repwell-sage-100/20 to-transparent pt-16 pb-6 md:pt-24 md:pb-8";
  const contentSectionClassName = getDirectoryContentSectionClassName(isIndustryPage);

  const eyebrow = industryContext ? `${industryContext.label} Directory` : "Professional Directory";
  const titleLead = industryContext ? "Find" : "Find a";
  const titleHighlight = industryContext ? industryContext.professionalPlural : "Professional";
  const heroDescription = industryContext
    ? `Connect with trusted ${industryContext.label.toLowerCase()} professionals in your area. Search by location, read reviews, and find the perfect ${industryContext.professional.toLowerCase()} for your needs.`
    : "Connect with trusted professionals in your area. Search by location, read reviews, and find the perfect expert for your needs.";
  const featureHeading = industryContext
    ? `Find the Right ${industryContext.professional}`
    : "Find the Right Professional";
  const ctaHeading = industryContext
    ? `Are you a ${industryContext.professional.toLowerCase()}?`
    : "Are you a professional?";

  return (
    <div className="bg-background">
      <section className={heroSectionClassName}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-10 top-20 h-4 w-4 rounded-full bg-repwell-teal-300 opacity-40" />
          <div className="absolute right-20 top-40 h-3 w-3 rounded-full bg-repwell-sage-200 opacity-30" />
          <div className="absolute bottom-32 left-1/4 h-4 w-4 rotate-12 transform bg-repwell-sage-100 opacity-50" />
          <div className="absolute right-1/3 top-1/3 h-3 w-3 rotate-45 transform bg-repwell-teal-300/30" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {industryContext && (
            <DirectoryBreadcrumbs items={industryContext.breadcrumbs} className="mb-6" />
          )}

          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
              <MagnifyingGlass weight="bold" size={14} />
              {eyebrow}
            </span>

            <h1 className="mb-6 font-display text-4xl font-bold tracking-tight text-repwell-teal-500 md:text-5xl lg:text-6xl">
              {titleLead} <span className="text-repwell-sage-200">{titleHighlight}</span>
            </h1>

            <p className="mx-auto max-w-2xl font-sans text-lg leading-relaxed text-repwell-teal-400 md:text-xl">
              {heroDescription}
            </p>
          </div>

          {industryContext && (
            <div className="mt-10 flex justify-center">
              <IndustryFilter
                selected={industryContext.industry}
                industries={industryContext.availableIndustries}
                mode="link"
              />
            </div>
          )}
        </div>
      </section>

      <section className={contentSectionClassName}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
      </section>

      <section className="bg-repwell-sage-100/20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <span className="mb-4 block font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
              Why RepWell
            </span>
            <h2 className="mb-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
              {featureHeading}
            </h2>
            <p className="font-sans text-lg text-repwell-teal-400">
              Our directory helps you make informed decisions with verified reviews and ratings.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:p-8"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100/50">
                    <Icon weight="duotone" size={24} className="text-repwell-teal-300" />
                  </div>
                  <h3 className="mb-3 font-sans text-xl font-semibold text-repwell-teal-500">
                    {feature.title}
                  </h3>
                  <p className="font-sans leading-relaxed text-repwell-teal-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-repwell-teal-500 px-8 py-16 md:px-16 md:py-20">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-repwell-teal-400/50 to-transparent" />

            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="mb-6 font-display text-3xl font-bold text-white md:text-4xl lg:text-5xl">
                {ctaHeading}
              </h2>
              <p className="mb-10 font-sans text-lg text-repwell-sage-100/80">
                Join RepWell to showcase your expertise, collect reviews, and grow your reputation.
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <a
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 font-sans text-sm font-semibold text-repwell-teal-500 shadow-sm transition-all duration-200 hover:bg-repwell-sage-100 hover:shadow-md"
                >
                  Join the Directory
                </a>
                <a
                  href="/features"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white bg-transparent px-6 py-3 font-sans text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
