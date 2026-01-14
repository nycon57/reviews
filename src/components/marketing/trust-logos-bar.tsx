"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface TrustLogosBarProps {
  /** Heading text above logos */
  heading?: string;
  /** Array of logo items */
  logos: {
    name: string;
    /** Logo component or SVG */
    logo?: React.ReactNode;
    /** Or use an image URL */
    imageUrl?: string;
  }[];
  className?: string;
  /** Visual style variant */
  variant?: "default" | "compact" | "minimal";
}

export function TrustLogosBar({
  heading = "Trusted by industry leaders",
  logos,
  className,
  variant = "default",
}: TrustLogosBarProps) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      variants={staggerContainer}
      className={cn(
        "py-12",
        variant === "compact" && "py-8",
        variant === "minimal" && "py-6",
        className
      )}
    >
      <div className="container mx-auto px-4">
        {heading && (
          <motion.p
            variants={fadeInUp}
            className={cn(
              "mb-8 text-center font-medium text-brand-slate",
              variant === "default" && "text-body-md",
              variant === "compact" && "text-body-sm mb-6",
              variant === "minimal" && "text-caption mb-4"
            )}
          >
            {heading}
          </motion.p>
        )}

        <motion.div
          variants={fadeInUp}
          className={cn(
            "flex flex-wrap items-center justify-center",
            variant === "default" && "gap-x-12 gap-y-6",
            variant === "compact" && "gap-x-8 gap-y-4",
            variant === "minimal" && "gap-x-6 gap-y-3"
          )}
        >
          {logos.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "grayscale opacity-60 transition-all duration-200 hover:grayscale-0 hover:opacity-100",
                variant === "default" && "h-8",
                variant === "compact" && "h-6",
                variant === "minimal" && "h-5"
              )}
            >
              {item.logo ? (
                <div className="h-full w-auto">{item.logo}</div>
              ) : item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-auto object-contain"
                />
              ) : (
                <span className="text-body-sm font-semibold text-brand-slate">
                  {item.name}
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}
