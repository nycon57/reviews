"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ShareNetwork as Share2,
  ChatCircle as MessageCircle,
  Funnel as Filter,
  PaperPlaneRight as Send,
  Plus,
  LinkedinLogo,
  XLogo,
  FacebookLogo,
  Copy,
  Link as LinkIcon,
} from "@phosphor-icons/react";
import type { RecentReview } from "@/lib/dashboard";
import { getUserRecentReviews } from "@/lib/dashboard";
import { useToast } from "@/hooks/use-toast";
import { ensureReviewSmartLink } from "@/lib/share-studio/actions";
import { formatReviewSource } from "@/lib/reviews/source-labels";
import { formatRelativeTime } from "@/lib/utils";
import { AnimatedTransition, AnimatedList, AnimatedItem } from "@/components/motion";
import {
  REVIEW_STATUS_FILTER_LABELS,
  ReviewStatusBadge,
} from "@/components/reviews/review-status-badge";

interface RecentReviewsProps {
  initialReviews: RecentReview[];
  userId?: string;
}

export function UserRecentReviews({
  initialReviews,
  userId,
}: RecentReviewsProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState(initialReviews);
  const [smartLinkUrls, setSmartLinkUrls] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    startTransition(async () => {
      const result = await getUserRecentReviews(userId, 10);
      if (result.success && result.data) {
        if (value === "all") {
          setReviews(result.data);
        } else {
          setReviews(result.data.filter((r) => r.status === value));
        }
      }
    });
  };

  const buildShareText = useCallback((review: RecentReview) => {
    const stars = "\u2605".repeat(review.rating) + "\u2606".repeat(5 - review.rating);
    const name = review.customerName || "A customer";
    const quote = review.text ? `"${review.text}"` : "";
    return quote ? `${stars} ${quote} \u2014 ${name}` : `${stars} \u2014 ${name}`;
  }, []);

  const getSmartLinkUrl = useCallback(async (review: RecentReview): Promise<string | null> => {
    if (smartLinkUrls[review.id]) {
      return smartLinkUrls[review.id];
    }

    const result = await ensureReviewSmartLink(review.id);
    if (!result.success || !result.url) {
      toast({
        title: "Smart Link unavailable",
        description: result.error || "Could not create share link for this review.",
        variant: "destructive",
      });
      return null;
    }

    const absoluteUrl = `${window.location.origin}${result.url}`;
    setSmartLinkUrls((prev) => ({ ...prev, [review.id]: absoluteUrl }));
    return absoluteUrl;
  }, [smartLinkUrls, toast]);

  const handleShareToLinkedIn = useCallback(async (review: RecentReview) => {
    const url = await getSmartLinkUrl(review);
    if (!url) return;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [getSmartLinkUrl]);

  const handleShareToX = useCallback(async (review: RecentReview) => {
    const url = await getSmartLinkUrl(review);
    if (!url) return;
    const text = encodeURIComponent(buildShareText(review));
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [getSmartLinkUrl, buildShareText]);

  const handleShareToFacebook = useCallback(async (review: RecentReview) => {
    const url = await getSmartLinkUrl(review);
    if (!url) return;
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, [getSmartLinkUrl]);

  const handleCopyReview = async (review: RecentReview) => {
    const text = buildShareText(review);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSmartLink = async (review: RecentReview) => {
    const url = await getSmartLinkUrl(review);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="col-span-1 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-heading">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Star className="h-4 w-4 text-repwell-teal-300" />
          </div>
          Recent Reviews
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-8 w-[132px]">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">
                {REVIEW_STATUS_FILTER_LABELS.approved}
              </SelectItem>
              <SelectItem value="pending">
                {REVIEW_STATUS_FILTER_LABELS.pending}
              </SelectItem>
              <SelectItem value="rejected">
                {REVIEW_STATUS_FILTER_LABELS.rejected}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/reviews">View all</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <AnimatedTransition
          state={isPending ? "loading" : reviews.length === 0 ? "empty" : "content"}
          loading={
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex gap-3 rounded-lg border border-border/50 p-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/3 rounded bg-muted" />
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-1/4 rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
          empty={
            <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-gradient-to-br from-repwell-sage-100/30 to-card dark:from-repwell-teal-300/10 p-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
                <Star className="h-7 w-7 text-amber-500" />
              </div>
              <h4 className="text-base font-semibold text-heading">No reviews yet</h4>
              <p className="mt-1 max-w-[280px] text-sm text-label">
                Start collecting customer feedback to build your reputation and grow your business.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="default" size="sm" asChild>
                  <a href="/dashboard/reviews?tab=requests">
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Send Survey
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="/dashboard/reviews">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Review
                  </a>
                </Button>
              </div>
            </div>
          }
          content={
            <AnimatedList className="space-y-3">
              {reviews.map((review) => (
                <AnimatedItem
                  key={review.id}
                  className="group flex gap-3 rounded-lg border border-border/50 p-3 transition-all hover:bg-repwell-sage-100/20 dark:hover:bg-repwell-teal-300/10 hover:border-repwell-teal-300/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-repwell-teal-300/10 text-repwell-teal-300 font-medium text-sm">
                    {review.customerName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/dashboard/reviews/${review.id}`}
                          className="rounded-sm font-medium text-heading transition-colors hover:text-repwell-teal-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        >
                          {review.customerName || "Anonymous"}
                        </a>
                        <ReviewStatusBadge status={review.status} className="h-5 text-xs" />
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.text && (
                      <p className="line-clamp-2 text-sm text-label">
                        {review.text}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-repwell-teal-300">
                        {formatRelativeTime(review.reviewDate)}
                        {review.source !== "internal" && (
                          <span className="ml-2">via {formatReviewSource(review.source)}</span>
                        )}
                      </span>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Share review"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => void handleShareToLinkedIn(review)}>
                              <LinkedinLogo className="mr-2 h-4 w-4" />
                              Share to LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleShareToX(review)}>
                              <XLogo className="mr-2 h-4 w-4" />
                              Share to X
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void handleShareToFacebook(review)}>
                              <FacebookLogo className="mr-2 h-4 w-4" />
                              Share to Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyReview(review)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy review text
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => void handleCreateSmartLink(review)}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Open Smart Link
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          asChild
                          title="Respond"
                        >
                          <a href={`/dashboard/reviews/${review.id}`}>
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </AnimatedItem>
              ))}
            </AnimatedList>
          }
        />
      </CardContent>
    </Card>
  );
}
