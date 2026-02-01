"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Star, User, CaretLeft, CaretRight } from "@phosphor-icons/react";
import type { TestimonialCard } from "@/lib/competitor-pages";
import { cn } from "@/lib/utils";

interface TestimonialsSectionProps {
  testimonials: TestimonialCard[];
  headline?: string;
}

/** Renders a 1-5 star rating row. */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          weight="fill"
          className={cn(
            "h-4 w-4",
            i < rating
              ? "text-yellow-400"
              : "text-repwell-teal-300/20",
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

/**
 * Renders a quote with the competitor name bolded wherever it appears.
 * Supports **bold** markdown syntax for competitor name emphasis.
 */
function QuoteText({ quote }: { quote: string }) {
  const parts = quote.split(/(\*\*[^*]+\*\*)/g);

  return (
    <p className="font-sans text-base leading-relaxed text-repwell-teal-400">
      &ldquo;
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-repwell-teal-500">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
      &rdquo;
    </p>
  );
}

/** Single testimonial card. */
function TestimonialCardItem({
  testimonial,
  className,
}: {
  testimonial: TestimonialCard;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex flex-col justify-between rounded-xl border border-border bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-md lg:p-8",
        className,
      )}
    >
      <div>
        <StarRating rating={testimonial.rating} />
        <div className="mt-4">
          <QuoteText quote={testimonial.quote} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 border-t border-border/50 pt-4">
        {testimonial.avatarUrl ? (
          <Image
            src={testimonial.avatarUrl}
            alt={testimonial.author}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-repwell-sage-100 text-repwell-teal-300"
            aria-hidden="true"
          >
            <User weight="bold" className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-sans text-sm font-semibold text-repwell-teal-500">
            {testimonial.author}
          </p>
          <p className="truncate font-sans text-xs text-repwell-teal-300">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Circular carousel navigation button. */
function CarouselButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-repwell-teal-400 shadow-sm transition-colors duration-200 hover:bg-repwell-sage-100/50 focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
    />
  );
}

/**
 * Section 5: Customer testimonials carousel.
 *
 * Desktop: 3-column grid layout.
 * Mobile: horizontally scrollable carousel with navigation buttons.
 *
 * All content driven by the `testimonials` config array.
 */
export function TestimonialsSection({
  testimonials,
  headline = "What Customers Say",
}: TestimonialsSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 1);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const children = Array.from(el.children) as HTMLElement[];
    const cardWidth = children[0]?.getBoundingClientRect().width ?? 300;
    const gap =
      children.length >= 2
        ? children[1].offsetLeft - (children[0].offsetLeft + children[0].offsetWidth)
        : 24;
    el.scrollBy({
      left: direction === "left" ? -(cardWidth + gap) : cardWidth + gap,
      behavior: "smooth",
    });
  }, []);

  if (testimonials.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between">
        <h2 className="font-display text-3xl font-bold tracking-tight text-repwell-teal-500 md:text-4xl lg:text-5xl">
          {headline}
        </h2>

        {/* Mobile carousel nav (hidden on desktop where grid is used) */}
        <div className="flex gap-2 md:hidden" role="group" aria-label="Carousel navigation">
          <CarouselButton onClick={() => scroll("left")} disabled={!canScrollLeft} aria-label="Previous testimonial">
            <CaretLeft weight="bold" className="h-4 w-4" aria-hidden="true" />
          </CarouselButton>
          <CarouselButton onClick={() => scroll("right")} disabled={!canScrollRight} aria-label="Next testimonial">
            <CaretRight weight="bold" className="h-4 w-4" aria-hidden="true" />
          </CarouselButton>
        </div>
      </div>

      {/* Desktop: 3-col grid */}
      <div className="mt-10 hidden gap-8 md:grid md:grid-cols-3">
        {testimonials.map((t, i) => (
          <TestimonialCardItem key={`${t.author}-${i}`} testimonial={t} />
        ))}
      </div>

      {/* Mobile: horizontal scroll carousel */}
      <div
        ref={scrollRef}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 md:hidden"
        role="region"
        aria-label="Testimonials carousel"
      >
        {testimonials.map((t, i) => (
          <TestimonialCardItem
            key={`${t.author}-${i}`}
            testimonial={t}
            className="w-[85vw] max-w-[340px] flex-shrink-0 snap-center"
          />
        ))}
      </div>
    </div>
  );
}
