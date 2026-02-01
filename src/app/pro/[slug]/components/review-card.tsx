"use client";

import { useState } from "react";
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
} from "@phosphor-icons/react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
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
import type { PublicReview } from "@/lib/seo/actions";

// Source icon configuration with optional external URL
const SOURCE_CONFIG: Record<string, { icon: string; name: string; url?: string }> = {
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

interface ReviewCardProps {
  review: PublicReview;
  loanOfficerName: string;
  profileUrl: string;
  onFlag?: (reviewId: string) => void;
  className?: string;
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
            star <= rating ? "text-amber-500" : "text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function SourceIcon({ source }: { source: string }) {
  const normalizedSource = source.toLowerCase();

  // Map internal/survey sources to RepWell
  const mappedSource =
    normalizedSource === "internal" || normalizedSource === "survey"
      ? "repwell"
      : normalizedSource;

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
      {source}
    </Badge>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ReviewCard({
  review,
  loanOfficerName,
  profileUrl,
  onFlag,
  className,
}: ReviewCardProps) {
  const [copied, setCopied] = useState(false);

  const reviewUrl = `${profileUrl}#review-${review.id}`;
  const shareText = review.text
    ? `"${review.text.slice(0, 100)}${review.text.length > 100 ? "..." : ""}" - Review of ${loanOfficerName}`
    : `${review.rating}-star review of ${loanOfficerName}`;

  const encodedUrl = encodeURIComponent(reviewUrl);
  const encodedText = encodeURIComponent(shareText);

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error("Failed to copy to clipboard");
    }
  };

  const isFeatured = review.featured;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
            <span className={cn(
              "text-sm font-medium",
              isFeatured ? "text-amber-600" : "text-repwell-teal-400"
            )}>
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
          <SourceIcon source={review.source} />
          <span className="text-xs text-muted-foreground">
            {formatDate(review.review_date)}
          </span>
        </div>
      </div>

      {review.title && (
        <h4 className="mt-3 font-medium text-repwell-teal-500">{review.title}</h4>
      )}

      {review.text && (
        <div className="mt-2 flex items-start gap-2">
          <Quote className="h-4 w-4 shrink-0 text-repwell-sage-200" />
          <p className="text-sm text-repwell-teal-400 leading-relaxed">
            {review.text}
          </p>
        </div>
      )}

      {review.response_text && (
        <div className="mt-4 rounded-lg bg-repwell-sage-100/30 p-3">
          <p className="text-xs font-medium text-repwell-teal-300 mb-1">
            Response from {loanOfficerName}
          </p>
          <p className="text-sm text-repwell-teal-400">{review.response_text}</p>
        </div>
      )}

      {/* Share & Flag Actions */}
      <div className="mt-4 flex items-center gap-2">
        <TooltipProvider>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-repwell-teal-400">
                    <ShareNetwork className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Share this review</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
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

          {onFlag && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-red-500"
                  onClick={() => onFlag(review.id)}
                >
                  <Flag className="h-4 w-4 mr-1" />
                  Report
                </Button>
              </TooltipTrigger>
              <TooltipContent>Report inappropriate content</TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
    </motion.div>
  );
}
