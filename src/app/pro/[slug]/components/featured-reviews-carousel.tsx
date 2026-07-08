"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import { Quotes as Quote } from "@phosphor-icons/react";
import { useRef } from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/reviews/rating-stars";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import type { PublicReview } from "@/lib/seo/actions";

interface FeaturedReviewsCarouselProps {
  reviews: PublicReview[];
  className?: string;
}

export function FeaturedReviewsCarousel({
  reviews,
  className,
}: FeaturedReviewsCarouselProps) {
  const plugin = useRef(
    AutoScroll({
      startDelay: 1000,
      speed: 0.5,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  if (reviews.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-8 md:py-12 bg-repwell-sage-100/30", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-repwell-teal-500 text-center">
          Featured Reviews
        </h2>
      </div>

      <Carousel
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[plugin.current]}
        className="relative before:absolute before:top-0 before:bottom-0 before:left-0 before:z-10 before:w-16 md:before:w-24 before:bg-gradient-to-r before:from-repwell-sage-100/30 before:to-transparent after:absolute after:top-0 after:right-0 after:bottom-0 after:z-10 after:w-16 md:after:w-24 after:bg-gradient-to-l after:from-repwell-sage-100/30 after:to-transparent"
      >
        <CarouselContent className="-ml-4">
          {reviews.map((review, index) => (
            <CarouselItem key={review.id} className="pl-4 basis-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="max-w-[420px] p-6 select-none border border-border bg-white hover:shadow-lg transition-all duration-300 border-t-4 border-t-repwell-sage-200">
                  <div className="flex justify-between items-start mb-4">
                    <RatingStars rating={review.rating} size="lg" />
                  </div>

                  <div className="relative">
                    <Quote
                      weight="fill"
                      className="absolute -top-2 -left-1 h-8 w-8 text-repwell-sage-200/50"
                    />
                    <p className="font-sans text-repwell-teal-400 leading-relaxed pl-6 line-clamp-4">
                      {review.text}
                    </p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="font-sans font-semibold text-repwell-teal-500">
                      {review.customer_name || "Anonymous"}
                    </p>
                    {review.customer_location && (
                      <p className="text-sm font-sans text-repwell-teal-300">
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
