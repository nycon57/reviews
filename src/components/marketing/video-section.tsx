"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  ArrowRight,
} from "@phosphor-icons/react";
import { fadeInUp, scaleIn, staggerContainer, viewportOnce } from "@/lib/motion";
import { BrowserMockup } from "./browser-mockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoSectionProps {
  /** Section badge */
  badge?: string;
  /** Section heading */
  heading?: string;
  /** Section subheading */
  subheading?: string;
  /** Video thumbnail image */
  thumbnailSrc?: string;
  /** Thumbnail alt text */
  thumbnailAlt?: string;
  /** Video URL or link to demo page */
  videoHref?: string;
  /** CTA button text */
  ctaText?: string;
  /** CTA button href */
  ctaHref?: string;
  /** Additional className */
  className?: string;
}

export function VideoSection({
  badge = "Product Demo",
  heading = "See RepWell in Action",
  subheading = "Watch how leading mortgage companies use RepWell to transform their review collection and reputation management.",
  thumbnailSrc,
  thumbnailAlt = "RepWell product demo",
  videoHref = "/demo",
  ctaText = "Schedule a Live Demo",
  ctaHref = "/demo",
  className,
}: VideoSectionProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={staggerContainer}
      className={cn(
        "py-16 md:py-24 lg:py-32 bg-gradient-to-b from-white to-repwell-sage-100/30",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          {badge && (
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {heading && (
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
            >
              {heading}
            </motion.h2>
          )}

          {subheading && (
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* Video thumbnail in browser mockup */}
        <motion.div
          variants={scaleIn}
          className="max-w-4xl mx-auto mb-10"
        >
          <Link href={videoHref} className="block group">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -inset-4 bg-gradient-to-br from-repwell-teal-300/20 to-repwell-sage-200/20 rounded-3xl blur-xl" />

              <BrowserMockup
                url="app.repwell.ai/demo"
                className="relative shadow-2xl"
              >
                <div className="aspect-video bg-gradient-to-br from-repwell-teal-500 to-repwell-teal-400 relative overflow-hidden">
                  {/* Thumbnail image or placeholder */}
                  {thumbnailSrc ? (
                    <img
                      src={thumbnailSrc}
                      alt={thumbnailAlt}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    /* Placeholder dashboard mockup */
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Mockup UI elements */}
                      <div className="absolute top-4 left-4 right-4 flex gap-2">
                        <div className="h-3 w-20 bg-white/20 rounded" />
                        <div className="h-3 w-16 bg-white/10 rounded" />
                        <div className="h-3 w-24 bg-white/10 rounded" />
                      </div>

                      {/* Sidebar mockup */}
                      <div className="absolute left-4 top-12 bottom-4 w-32">
                        <div className="space-y-2">
                          {[...Array(6)].map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "h-8 rounded",
                                i === 0 ? "bg-white/20" : "bg-white/10"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Main content mockup */}
                      <div className="absolute left-40 top-12 right-4 bottom-4">
                        {/* Stats row */}
                        <div className="flex gap-3 mb-4">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 h-20 bg-white/10 rounded-lg"
                            />
                          ))}
                        </div>

                        {/* Chart area */}
                        <div className="h-32 bg-white/10 rounded-lg mb-4" />

                        {/* Table mockup */}
                        <div className="space-y-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 bg-white/5 rounded" />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:shadow-repwell-teal-300/50 transition-shadow"
                    >
                      <Play className="w-8 h-8 md:w-10 md:h-10 text-repwell-teal-500 ml-1" />
                    </motion.div>
                  </div>

                  {/* Gradient overlay for better play button visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/40 to-transparent opacity-60" />
                </div>
              </BrowserMockup>
            </div>
          </Link>
        </motion.div>

        {/* CTA button */}
        <motion.div variants={fadeInUp} className="text-center">
          <Link href={ctaHref}>
            <Button
              size="lg"
              variant="default"
              className="shadow-lg shadow-repwell-teal-300/20"
            >
              {ctaText}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}
