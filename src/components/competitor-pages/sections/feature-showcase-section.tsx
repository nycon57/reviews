"use client";

import Image from "next/image";
import type { FeatureCard } from "@/lib/competitor-pages";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { cn } from "@/lib/utils";

interface FeatureShowcaseSectionProps {
  features: FeatureCard[];
  headline?: string;
}

/** Single feature card with screenshot, title, description, and optional badge. */
function FeatureCardItem({
  card,
  index,
  isVisible,
}: {
  card: FeatureCard;
  index: number;
  isVisible: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-[transform,box-shadow,opacity] duration-500 hover:shadow-md hover:-translate-y-1",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      style={{
        transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
      }}
    >
      {/* Screenshot / illustration */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-repwell-sage-50">
        <Image
          src={card.screenshot}
          alt={card.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwMCIgaGVpZ2h0PSI3NTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YwZjRmMCIvPjwvc3ZnPg=="
        />

        {/* Badge overlay */}
        {card.badge && (
          <span className="absolute right-3 top-3 rounded-full bg-repwell-teal-300 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {card.badge}
          </span>
        )}
      </div>

      {/* Text content */}
      <div className="p-5 lg:p-6">
        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
          {card.title}
        </h3>
        <p className="mt-2 font-sans text-sm leading-relaxed text-repwell-teal-400">
          {card.description}
        </p>
      </div>
    </article>
  );
}

/** Section 7: Responsive feature card grid with staggered scroll-reveal. */
export function FeatureShowcaseSection({
  features,
  headline = "Everything You Need to Grow",
}: FeatureShowcaseSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (features.length === 0) return null;

  return (
    <div ref={sectionRef}>
      <h2 className="text-center font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
        {headline}
      </h2>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {features.map((card, i) => (
          <FeatureCardItem
            key={`${card.title}-${i}`}
            card={card}
            index={i}
            isVisible={isVisible}
          />
        ))}
      </div>
    </div>
  );
}
