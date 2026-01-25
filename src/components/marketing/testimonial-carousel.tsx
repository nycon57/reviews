"use client";

import AutoScroll from "embla-carousel-auto-scroll";
import {
  CaretRight as ChevronRight,
  Star,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRef } from "react";

import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

interface Testimonial {
  name: string;
  role: string;
  company?: string;
  avatar?: string;
  content: string;
  rating?: number;
}

const defaultTestimonials: Testimonial[] = [
  {
    name: "Sarah Johnson",
    role: "Branch Manager",
    company: "First National Mortgage",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    content:
      "RepWell has transformed how we collect and manage customer feedback. Our review volume is up 300% and our team is more engaged than ever.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    role: "VP of Operations",
    company: "Premier Lending Group",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    content:
      "The AI insights help us understand exactly what customers love and where we can improve. Invaluable for our growth strategy.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Senior Professional",
    company: "Hometown Home Loans",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    content:
      "Finally, a platform that understands the mortgage industry. The automation saves us hours every week on review management.",
    rating: 5,
  },
  {
    name: "David Thompson",
    role: "CEO",
    company: "Pacific Coast Lending",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    content:
      "We've seen a 40% increase in our Google reviews since switching to RepWell. The automated follow-ups are game-changing.",
    rating: 5,
  },
  {
    name: "Jessica Martinez",
    role: "Marketing Director",
    company: "Summit Mortgage Co.",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    content:
      "The testimonial collection feature has given us incredible marketing content. Our social proof has never been stronger.",
    rating: 5,
  },
  {
    name: "Robert Wilson",
    role: "Regional Manager",
    company: "Liberty Home Loans",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    content:
      "RepWell's leaderboard feature has created healthy competition among our team members. Everyone wants to be at the top.",
    rating: 5,
  },
];

interface TestimonialCarouselProps {
  /** Custom testimonials (uses defaults if not provided) */
  testimonials?: Testimonial[];
  /** Section badge text */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Link to view all testimonials */
  viewAllHref?: string;
  /** Additional classes */
  className?: string;
}

export function TestimonialCarousel({
  testimonials = defaultTestimonials,
  badge = "Trusted by 500+ mortgage professionals",
  heading = "Meet our happy clients",
  subheading = "Join a global network of mortgage professionals who trust RepWell.",
  viewAllHref = "/testimonials",
  className,
}: TestimonialCarouselProps) {
  const plugin = useRef(
    AutoScroll({
      startDelay: 500,
      speed: 0.7,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  return (
    <section className={cn("py-16 md:py-24 lg:py-32 bg-white", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-4">
        <Badge
          variant="outline"
          className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
        >
          <Star className="h-4 w-4 fill-repwell-teal-300 text-repwell-teal-300 mr-2" />
          {badge}
        </Badge>
        <h2 className="text-center font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500">
          {heading}
        </h2>
        <p className="text-center font-sans text-lg text-repwell-teal-400 max-w-2xl">
          {subheading}
        </p>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 font-sans font-semibold text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
          >
            View all testimonials
            <ChevronRight className="mt-0.5 h-4 w-auto" />
          </Link>
        )}
      </div>

      <div className="mt-12 md:mt-16">
        <Carousel
          opts={{
            loop: true,
            align: "start",
          }}
          plugins={[plugin.current]}
          className="relative before:absolute before:top-0 before:bottom-0 before:left-0 before:z-10 before:w-24 md:before:w-36 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:top-0 after:right-0 after:bottom-0 after:z-10 after:w-24 md:after:w-36 after:bg-gradient-to-l after:from-white after:to-transparent"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="pl-4 basis-auto">
                <Card className="max-w-[380px] p-6 select-none border border-border bg-white hover:shadow-md transition-shadow duration-300">
                  <div className="flex justify-between items-start">
                    <div className="mb-4 flex gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-repwell-sage-100">
                        <AvatarImage
                          src={testimonial.avatar}
                          alt={testimonial.name}
                        />
                        <AvatarFallback className="bg-repwell-sage-100 text-repwell-teal-400 font-semibold">
                          {testimonial.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-sans font-semibold text-repwell-teal-500">
                          {testimonial.name}
                        </p>
                        <p className="text-sm font-sans text-repwell-teal-400">
                          {testimonial.role}
                          {testimonial.company && `, ${testimonial.company}`}
                        </p>
                      </div>
                    </div>
                    {testimonial.rating && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: testimonial.rating }).map(
                          (_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-amber-500 text-amber-500"
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>
                  <q className="block font-sans leading-relaxed text-repwell-teal-400">
                    {testimonial.content}
                  </q>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}
