"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { fadeInUp, cardHover, cardTap } from "@/lib/motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  /** Testimonial quote text */
  quote: string;
  /** Author name */
  author: string;
  /** Author role/title */
  role?: string;
  /** Company name */
  company?: string;
  /** Author avatar URL */
  avatarUrl?: string;
  /** Star rating (1-5) */
  rating?: number;
  /** Optional stat highlight */
  stat?: {
    value: string;
    label: string;
  };
  className?: string;
  /** Card variant style */
  variant?: "default" | "featured" | "minimal";
}

export function TestimonialCard({
  quote,
  author,
  role,
  company,
  avatarUrl,
  rating,
  stat,
  className,
  variant = "default",
}: TestimonialCardProps) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={variant !== "minimal" ? cardHover : undefined}
      whileTap={variant !== "minimal" ? cardTap : undefined}
      className="h-full"
    >
      <Card
        className={cn(
          "h-full flex flex-col",
          variant === "featured" && "border-brand-blue/30 bg-gradient-to-br from-white to-brand-frost/30",
          variant === "minimal" && "border-0 shadow-none bg-transparent",
          className
        )}
      >
        <CardContent className={cn(
          "flex flex-col flex-1",
          variant === "minimal" ? "p-0" : "p-6"
        )}>
          {/* Stat highlight */}
          {stat && (
            <div className="mb-6 pb-6 border-b border-brand-silver">
              <div className="text-display-sm font-bold text-brand-blue">
                {stat.value}
              </div>
              <div className="text-body-sm text-brand-slate mt-1">
                {stat.label}
              </div>
            </div>
          )}

          {/* Quote */}
          <div className="flex-1">
            {variant !== "minimal" && (
              <Quote className="h-8 w-8 text-brand-blue/20 mb-4" />
            )}
            <blockquote className={cn(
              "text-brand-navy leading-relaxed",
              variant === "featured" ? "text-body-lg" : "text-body-md"
            )}>
              &ldquo;{quote}&rdquo;
            </blockquote>
          </div>

          {/* Rating */}
          {rating && (
            <div className="flex gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < rating
                      ? "text-brand-amber fill-brand-amber"
                      : "text-brand-silver"
                  )}
                />
              ))}
            </div>
          )}

          {/* Author info */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-brand-silver/50">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={author}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-frost"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-brand-frost flex items-center justify-center text-brand-blue font-semibold">
                {author.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-brand-navy">{author}</div>
              {(role || company) && (
                <div className="text-body-sm text-brand-slate">
                  {role}
                  {role && company && " at "}
                  {company && (
                    <span className="font-medium">{company}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
