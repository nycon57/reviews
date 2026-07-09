"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "@phosphor-icons/react";
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
  /** Product screenshot image */
  thumbnailSrc?: string;
  /** Screenshot alt text */
  thumbnailAlt?: string;
  /** Demo page link */
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
  subheading = "Book a live walkthrough of RepWell's review collection and reputation management workflows.",
  thumbnailSrc,
  thumbnailAlt = "RepWell product demo",
  videoHref = "/demo",
  ctaText = "Book a Demo",
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
        "bg-gradient-to-b from-white to-repwell-sage-100/30 py-16 md:py-24 lg:py-32",
        className
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-12 text-center md:mb-16">
          {badge && (
            <motion.div variants={fadeInUp} className="mb-4">
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 px-4 py-1.5 text-sm text-repwell-teal-400"
              >
                {badge}
              </Badge>
            </motion.div>
          )}

          {heading && (
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl lg:text-5xl"
            >
              {heading}
            </motion.h2>
          )}

          {subheading && (
            <motion.p
              variants={fadeInUp}
              className="mx-auto max-w-2xl font-sans text-lg text-repwell-teal-400"
            >
              {subheading}
            </motion.p>
          )}
        </div>

        {/* Product screenshot in browser mockup */}
        <motion.div variants={scaleIn} className="mx-auto mb-10 max-w-4xl">
          <Link href={videoHref} className="group block">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-repwell-teal-300/20 to-repwell-sage-200/20 blur-xl" />

              <BrowserMockup url="repwell.ai/dashboard" className="relative shadow-2xl">
                <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-repwell-sage-100 to-white">
                  {thumbnailSrc ? (
                    <Image
                      src={thumbnailSrc}
                      alt={thumbnailAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 896px"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                      <p className="max-w-md font-display text-3xl font-bold text-repwell-teal-500">
                        Book a live product demo
                      </p>
                      <p className="mt-3 max-w-md font-sans text-base text-repwell-teal-400">
                        Walk through the dashboard with a RepWell team member.
                      </p>
                    </div>
                  )}
                </div>
              </BrowserMockup>
            </div>
          </Link>
        </motion.div>

        {/* CTA button */}
        <motion.div variants={fadeInUp} className="text-center">
          <Button
            asChild
            size="lg"
            variant="default"
            className="shadow-lg shadow-repwell-teal-300/20"
          >
            <Link href={ctaHref}>
              {ctaText}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
