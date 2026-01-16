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
          variant === "featured" && "border-repwell-teal-300/30 bg-gradient-to-br from-white to-repwell-sage-100/30",
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
            <div className="mb-6 pb-6 border-b border-border">
              <div className="text-display-sm font-bold text-repwell-teal-300">
                {stat.value}
              </div>
              <div className="text-body-sm text-repwell-teal-400 mt-1">
                {stat.label}
              </div>
            </div>
          )}

          {/* Quote */}
          <div className="flex-1">
            {variant !== "minimal" && (
              <Quote className="h-8 w-8 text-repwell-teal-300/20 mb-4" />
            )}
            <blockquote className={cn(
              "text-repwell-teal-500 leading-relaxed",
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
                      ? "text-warning fill-warning"
                      : "text-border"
                  )}
                />
              ))}
            </div>
          )}

          {/* Author info */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border/50">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={author}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-repwell-sage-100"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-repwell-sage-100 flex items-center justify-center text-repwell-teal-300 font-semibold">
                {author.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-semibold text-repwell-teal-500">{author}</div>
              {(role || company) && (
                <div className="text-body-sm text-repwell-teal-400">
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
