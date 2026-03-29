import Image from "next/image";
import type { CustomerPageConfig } from "@/lib/customers/types";
import { industryLabels } from "@/config/customer-pages";

interface CustomerHeroProps {
  config: CustomerPageConfig;
}

export function CustomerHero({ config }: CustomerHeroProps) {
  return (
    <section className="bg-white py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-background-subtle">
            <Image
              src={config.logo}
              alt={`${config.companyName} logo`}
              width={40}
              height={40}
              className="h-10 w-10 object-contain"
              priority
            />
          </div>
        </div>

        {/* Industry badge */}
        <span className="mb-4 inline-flex items-center rounded-full bg-repwell-sage-100/60 px-3 py-1 text-xs font-medium tracking-wide text-repwell-teal-400 uppercase">
          {industryLabels[config.industry]}
          {config.previousPlatform && (
            <span className="ml-2 border-l border-repwell-sage-200 pl-2">
              Switched from {config.previousPlatform}
            </span>
          )}
        </span>

        {/* Headline */}
        <h1 className="mt-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl lg:text-5xl">
          {config.heroHeadline}
        </h1>

        {/* Summary */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-repwell-teal-400">
          {config.summary}
        </p>
      </div>
    </section>
  );
}
