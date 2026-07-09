"use client";

import AutoScroll, { type AutoScrollType } from "embla-carousel-auto-scroll";
import { Pause, Play, Quotes as Quote } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/reviews/rating-stars";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import type { PublicReview } from "@/lib/seo/actions";

interface FeaturedReviewsCarouselProps {
  reviews: PublicReview[];
  className?: string;
}

export function FeaturedReviewsCarousel({ reviews, className }: FeaturedReviewsCarouselProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(Boolean(shouldReduceMotion));
  const plugin = useMemo<AutoScrollType | null>(() => {
    if (shouldReduceMotion) return null;

    return AutoScroll({
      startDelay: 1000,
      speed: 0.5,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    });
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (shouldReduceMotion) {
      setIsPaused(true);
      plugin?.stop();
    }
  }, [plugin, shouldReduceMotion]);

  function toggleAutoScroll() {
    if (!plugin) return;

    if (isPaused) {
      plugin.play(0);
      setIsPaused(false);
    } else {
      plugin.stop();
      setIsPaused(true);
    }
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className={cn("bg-repwell-sage-100/30 py-8 md:py-12", className)}>
      <div className="mx-auto mb-6 flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
        <h2 className="text-center font-display text-2xl font-bold text-repwell-teal-500 md:text-3xl">
          Featured Reviews
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleAutoScroll}
          disabled={!plugin}
          aria-pressed={!isPaused}
          aria-label={
            isPaused ? "Resume featured reviews carousel" : "Pause featured reviews carousel"
          }
          className="gap-2"
        >
          {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>

      <Carousel
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={plugin ? [plugin] : []}
        className="relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-10 before:w-16 before:bg-gradient-to-r before:from-repwell-sage-100/30 before:to-transparent after:absolute after:bottom-0 after:right-0 after:top-0 after:z-10 after:w-16 after:bg-gradient-to-l after:from-repwell-sage-100/30 after:to-transparent md:before:w-24 md:after:w-24"
      >
        <CarouselContent className="-ml-4">
          {reviews.map((review, index) => (
            <CarouselItem key={review.id} className="basis-auto pl-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="max-w-[420px] select-none border border-t-4 border-border border-t-repwell-sage-200 bg-white p-6 transition-all duration-300 hover:shadow-lg">
                  <div className="mb-4 flex items-start justify-between">
                    <RatingStars rating={review.rating} size="lg" />
                  </div>

                  <div className="relative">
                    <Quote
                      weight="fill"
                      className="absolute -left-1 -top-2 h-8 w-8 text-repwell-sage-200/50"
                    />
                    <p className="line-clamp-4 pl-6 font-sans leading-relaxed text-repwell-teal-400">
                      {review.text}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-border pt-4">
                    <p className="font-sans font-semibold text-repwell-teal-500">
                      {review.customer_name || "Anonymous"}
                    </p>
                    {review.customer_location && (
                      <p className="font-sans text-sm text-repwell-teal-300">
                        {review.customer_location}
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
