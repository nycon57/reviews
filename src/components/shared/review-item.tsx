"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Quotes as Quote,
  ShareNetwork,
  Flag,
  TwitterLogo as Twitter,
  FacebookLogo as Facebook,
  LinkedinLogo as Linkedin,
  Link as Link2,
  Check,
  Medal,
  VideoCamera,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { cn, getInitials } from "@/lib/utils";
import { formatReviewSource } from "@/lib/reviews/source-labels";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Source icon configuration with optional external URL
export const SOURCE_CONFIG: Record<string, { icon: string; name: string; url?: string }> = {
  google: { icon: "/icons/google.svg", name: "Google" },
  zillow: { icon: "/icons/zillow.svg", name: "Zillow" },
  facebook: { icon: "/icons/facebook.svg", name: "Facebook" },
  yelp: { icon: "/icons/yelp.svg", name: "Yelp" },
  repwell: {
    icon: "/branding/RepWell-Icon-Full-Color.png",
    name: "RepWell",
    url: "https://repwell.ai",
  },
};

export function SourceIcon({ source }: { source: string }) {
  const normalizedSource = source.toLowerCase();
  const sourceLabel = formatReviewSource(source);

  // Map internal/survey sources to RepWell
  const mappedSource =
    normalizedSource === "internal" || normalizedSource === "survey"
      ? "repwell"
      : normalizedSource;

  if (mappedSource === "video_testimonial") {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <VideoCamera className="h-3 w-3" weight="duotone" />
        {sourceLabel}
      </Badge>
    );
  }

  const config = SOURCE_CONFIG[mappedSource];

  if (config) {
    const iconElement = (
      <div className="flex items-center justify-center h-5 w-5 rounded" title={config.name}>
        <Image
          src={config.icon}
          alt={config.name}
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
        />
      </div>
    );

    // Wrap with link if URL is provided
    if (config.url) {
      return (
        <a
          href={config.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title={`View on ${config.name}`}
        >
          {iconElement}
        </a>
      );
    }

    return iconElement;
  }

  return (
    <Badge variant="outline" className="text-xs">
      {sourceLabel}
    </Badge>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          weight="fill"
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-amber-500" : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export interface ReviewItemData {
  id: string;
  customer_name: string | null;
  customer_location: string | null;
  rating: number;
  text: string | null;
  title: string | null;
  review_date: string;
  source?: string;
  response_text?: string | null;
  featured?: boolean;
}

export interface ReviewItemAttribution {
  loanOfficer: { name: string; href: string; photoUrl: string | null };
  branch?: { name: string; href: string };
}

export interface ReviewItemProps {
  review: ReviewItemData;
  respondentName?: string;
  attribution?: ReviewItemAttribution;
  /** Label before the loan officer name in attribution (default: "Review for") */
  attributionLabel?: string;
  shareConfig?: { profileUrl: string; subjectName: string; reviewUrl?: string | null };
  onFlag?: (reviewId: string) => void;
  animate?: boolean;
  className?: string;
}

export function ReviewItem({
  review,
  respondentName,
  attribution,
  attributionLabel = "Review for",
  shareConfig,
  onFlag,
  animate,
  className,
}: ReviewItemProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const isFeatured = review.featured;

  // Share logic
  const reviewUrl = shareConfig?.reviewUrl || undefined;
  const shareText =
    shareConfig && review.text
      ? `"${review.text.slice(0, 100)}${review.text.length > 100 ? "..." : ""}" - Review of ${shareConfig.subjectName}`
      : shareConfig
        ? `${review.rating}-star review of ${shareConfig.subjectName}`
        : "";

  const encodedUrl = reviewUrl ? encodeURIComponent(reviewUrl) : "";
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = reviewUrl
    ? {
        twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      }
    : null;

  const copyToClipboard = async () => {
    if (!reviewUrl) return;
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const Wrapper = animate ? motion.div : "div";
  const wrapperProps = animate
    ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      id={`review-${review.id}`}
      className={cn(
        "pb-6 last:pb-0",
        isFeatured
          ? "relative rounded-xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50/80 via-white to-repwell-sage-100/30 p-5 shadow-lg shadow-amber-100/50"
          : "border-b border-border last:border-0",
        className
      )}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute -top-3 left-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 px-3 py-1 shadow-md">
          <Medal weight="fill" className="h-4 w-4 text-white" />
          <span className="text-xs font-semibold text-white tracking-wide">
            Featured Review
          </span>
        </div>
      )}

      <div className={cn("flex items-start justify-between gap-4", isFeatured && "mt-2")}>
        <div>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} />
            <span
              className={cn(
                "text-sm font-medium",
                isFeatured ? "text-amber-600" : "text-label"
              )}
            >
              {review.rating}/5
            </span>
          </div>
          <p className="mt-1 text-sm text-repwell-teal-300">
            {review.customer_name || "Anonymous"}
            {review.customer_location && (
              <span> - {review.customer_location}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {review.source && <SourceIcon source={review.source} />}
          <span className="text-xs text-muted-foreground">
            {formatDate(review.review_date)}
          </span>
        </div>
      </div>

      {review.title && (
        <h4 className="mt-3 font-medium text-heading">{review.title}</h4>
      )}

      {review.text && (
        <div className="mt-2 flex items-start gap-2">
          <Quote className="h-4 w-4 shrink-0 text-repwell-sage-200" />
          <p className="text-sm text-label leading-relaxed">
            {review.text}
          </p>
        </div>
      )}

      {/* Attribution + Actions row */}
      {(attribution || shareLinks || onFlag) && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-repwell-teal-300">
          {attribution && (
            <>
              <Link
                href={attribution.loanOfficer.href}
                className="flex items-center gap-2 hover:text-repwell-teal-500 dark:hover:text-foreground transition-colors"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={attribution.loanOfficer.photoUrl || undefined}
                    alt={attribution.loanOfficer.name}
                  />
                  <AvatarFallback className="text-[10px] bg-repwell-teal-500/10 text-heading">
                    {getInitials(attribution.loanOfficer.name)}
                  </AvatarFallback>
                </Avatar>
                <span>{attributionLabel} {attribution.loanOfficer.name}</span>
              </Link>
              {attribution.branch && (
                <>
                  <span className="text-repwell-sage-200">|</span>
                  <Link
                    href={attribution.branch.href}
                    className="hover:text-repwell-teal-500 dark:hover:text-foreground transition-colors"
                  >
                    {attribution.branch.name}
                  </Link>
                </>
              )}
            </>
          )}

          {/* Share & Flag — right-aligned */}
          {(shareLinks || onFlag) && (
            <div className="ml-auto flex items-center gap-1">
              <TooltipProvider>
                {shareLinks && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-repwell-teal-400 dark:hover:text-muted-foreground"
                        aria-label="Share review"
                      >
                        <ShareNetwork className="h-3.5 w-3.5 mr-1" />
                        Share
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <a
                          href={shareLinks.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Twitter className="h-4 w-4" />
                          Twitter
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={shareLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <a
                          href={shareLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyToClipboard} className="flex items-center gap-2">
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 text-green-500" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4" />
                            Copy link
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {onFlag && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-red-500"
                        onClick={() => onFlag(review.id)}
                      >
                        <Flag className="h-3.5 w-3.5" />
                        Report
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Report inappropriate content</TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
      )}

      {/* Response box */}
      {review.response_text && (
        <div className="mt-4 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 p-3">
          <p className="text-xs font-medium text-repwell-teal-300 mb-1">
            Response from {respondentName || "the team"}
          </p>
          <p className="text-sm text-label">{review.response_text}</p>
        </div>
      )}
    </Wrapper>
  );
}
