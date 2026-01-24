"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  ArrowRight,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { BlogPostMeta } from "@/types/blog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeaturedPostCardProps {
  post: BlogPostMeta;
  /** Card size variant */
  variant?: "large" | "small";
  /** Additional className */
  className?: string;
}

export function FeaturedPostCard({
  post,
  variant = "large",
  className,
}: FeaturedPostCardProps) {
  const isLarge = variant === "large";

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white border border-repwell-sage-100 shadow-sm",
        isLarge ? "min-h-[400px] lg:min-h-[480px]" : "min-h-[280px]",
        className
      )}
    >
      <Link href={`/blog/${post.slug}`} className="block h-full">
        {/* Image */}
        <div
          className={cn(
            "relative overflow-hidden",
            isLarge ? "h-56 lg:h-72" : "h-40"
          )}
        >
          {post.image ? (
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes={isLarge ? "(max-width: 768px) 100vw, 60vw" : "(max-width: 768px) 100vw, 40vw"}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-100 flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-repwell-sage-300" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Category badge */}
          <Badge
            variant="secondary"
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-repwell-teal-500"
          >
            {post.category}
          </Badge>
        </div>

        {/* Content */}
        <div className={cn("p-5", isLarge ? "lg:p-6" : "")}>
          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-repwell-teal-400 mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(post.date), "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime} min
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              "font-display font-bold text-repwell-teal-500 mb-2 line-clamp-2 group-hover:text-repwell-teal-300 transition-colors",
              isLarge ? "text-xl lg:text-2xl" : "text-lg"
            )}
          >
            {post.title}
          </h3>

          {/* Description */}
          <p
            className={cn(
              "text-repwell-teal-400 line-clamp-2 mb-4",
              isLarge ? "text-base" : "text-sm"
            )}
          >
            {post.description}
          </p>

          {/* Author + Read more */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <Image
                  src={post.author.avatar}
                  alt={post.author.name}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-repwell-sage-100 flex items-center justify-center text-xs font-medium text-repwell-teal-500">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <span className="text-sm text-repwell-teal-400">
                {post.author.name}
              </span>
            </div>

            <span className="inline-flex items-center text-sm font-medium text-repwell-teal-300 group-hover:gap-2 transition-all">
              Read
              <ArrowRight className="h-4 w-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
