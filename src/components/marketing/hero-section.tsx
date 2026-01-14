"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CTAButton {
  label: string;
  href: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
}

interface HeroSectionProps {
  title: React.ReactNode;
  subtitle?: string;
  description?: string;
  cta?: CTAButton | CTAButton[];
  className?: string;
  children?: React.ReactNode;
}

export function HeroSection({
  title,
  subtitle,
  description,
  cta,
  className,
  children,
}: HeroSectionProps) {
  const ctaButtons = cta ? (Array.isArray(cta) ? cta : [cta]) : [];

  return (
    <section className={cn("py-16 md:py-24", className)}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="container mx-auto px-4 text-center"
      >
        {subtitle && (
          <motion.p
            variants={fadeInUp}
            className="mb-4 text-sm font-medium uppercase tracking-wider text-primary"
          >
            {subtitle}
          </motion.p>
        )}

        <motion.h1
          variants={fadeInUp}
          className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground"
          >
            {description}
          </motion.p>
        )}

        {ctaButtons.length > 0 && (
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-4"
          >
            {ctaButtons.map((button, index) => (
              <Link key={button.href} href={button.href}>
                <Button
                  size="lg"
                  variant={button.variant || (index === 0 ? "default" : "outline")}
                >
                  {button.label}
                </Button>
              </Link>
            ))}
          </motion.div>
        )}

        {children && (
          <motion.div variants={fadeInUp} className="mt-8">
            {children}
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
