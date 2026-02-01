"use client";

import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import type { SocialProofCard } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";
import { Star, User } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Platform icon mapping — small badge showing review source
// ---------------------------------------------------------------------------

const platformLabels: Record<string, string> = {
  G2: "G2",
  Capterra: "Capterra",
  Trustpilot: "Trustpilot",
  Google: "Google",
  "Software Advice": "Software Advice",
};

function PlatformBadge({ platform }: { platform: string }) {
  const label = platformLabels[platform] ?? platform;

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-repwell-teal-300/15 bg-repwell-teal-300/5 px-2 py-0.5 font-sans text-[10px] font-medium text-repwell-teal-300">
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Star rating
// ---------------------------------------------------------------------------

function StarRating({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          weight="fill"
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "text-yellow-400" : "text-repwell-teal-300/20",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatReviewDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Single review card
// ---------------------------------------------------------------------------

interface ReviewCardProps {
  card: SocialProofCard;
  index: number;
  isVisible: boolean;
}

function ReviewCard({ card, index, isVisible }: ReviewCardProps) {
  const dateStr = formatReviewDate(card.date);

  return (
    <article
      className={cn(
        "break-inside-avoid rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-md lg:p-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      style={{
        transitionDelay: isVisible ? `${index * 80 + 200}ms` : "0ms",
      }}
    >
      {/* Rating + platform */}
      <div className="flex items-center justify-between gap-2">
        <StarRating rating={card.rating} />
        <PlatformBadge platform={card.platform} />
      </div>

      {/* Quote */}
      <blockquote className="mt-3">
        <p className="font-sans text-sm leading-relaxed text-repwell-teal-400">
          &ldquo;{card.quote}&rdquo;
        </p>
      </blockquote>

      {/* Author info + date */}
      <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-repwell-sage-100 text-repwell-teal-300"
          aria-hidden="true"
        >
          <User weight="bold" className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-sans text-sm font-semibold text-repwell-teal-500">
            {card.author}
          </p>
          <p className="truncate font-sans text-xs text-repwell-teal-300">
            {card.role}, {card.company}
          </p>
        </div>
        {dateStr && (
          <time
            dateTime={card.date}
            className="shrink-0 font-sans text-[10px] text-repwell-teal-300/60"
          >
            {dateStr}
          </time>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Section 15: Social Proof Wall
// ---------------------------------------------------------------------------

interface SocialProofSectionProps {
  cards: SocialProofCard[];
  headline?: string;
}

/**
 * Section 15: Social proof masonry wall.
 *
 * Renders 12-20 review cards in a CSS-columns masonry layout
 * (3 cols desktop, 2 cols tablet, 1 col mobile) with staggered
 * fade-in on scroll.
 */
export function SocialProofSection({
  cards,
  headline = "What Our Customers Say",
}: SocialProofSectionProps) {
  const { ref: sectionRef, isVisible } = useScrollReveal();

  if (cards.length === 0) return null;

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
          Social Proof
        </p>

        <h2
          className={cn(
            "mt-3 font-display text-3xl font-bold tracking-tight text-repwell-teal-500 transition-all duration-500 md:text-4xl lg:text-5xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "100ms" : "0ms" }}
        >
          {headline}
        </h2>

        <p
          className={cn(
            "mt-4 font-sans text-lg leading-relaxed text-repwell-teal-400 transition-all duration-500 md:text-xl",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
          )}
          style={{ transitionDelay: isVisible ? "200ms" : "0ms" }}
        >
          Real reviews from real professionals on the platforms they trust.
        </p>
      </div>

      {/* Masonry layout using CSS columns */}
      <div className="mt-12 columns-1 gap-6 sm:columns-2 lg:columns-3 lg:gap-8">
        {cards.map((card, i) => (
          <div
            key={`${card.author}-${card.platform}-${i}`}
            className="mb-6 lg:mb-8"
          >
            <ReviewCard card={card} index={i} isVisible={isVisible} />
          </div>
        ))}
      </div>
    </div>
  );
}
