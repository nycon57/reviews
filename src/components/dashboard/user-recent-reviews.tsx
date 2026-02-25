"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDistanceToNow } from "date-fns";
import type { RecentReview } from "@/lib/dashboard";
import { getUserRecentReviews } from "@/lib/dashboard";
import { useToast } from "@/hooks/use-toast";

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

  const router = useRouter();

  const buildShareText = (review: RecentReview) => {
    const stars = "\u2605".repeat(review.rating) + "\u2606".repeat(5 - review.rating);
    const name = review.customerName || "A customer";
    const quote = review.text ? `"${review.text}"` : "";
    return quote ? `${stars} ${quote} \u2014 ${name}` : `${stars} \u2014 ${name}`;
  };

  const buildReviewPublicUrl = (review: RecentReview): string | null => {
    if (review.sourceUrl && review.sourceUrl.startsWith("http")) {
      return review.sourceUrl;
    }
    if (review.userSlug && review.userSlug.trim()) {
      return `${window.location.origin}/pro/${review.userSlug}`;
    }
    return null;
  };

  const handleShareToLinkedIn = (review: RecentReview) => {
    const url = buildReviewPublicUrl(review);
    if (!url) {
      handleCreateSmartLink(review);
      return;
    }
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareToX = (review: RecentReview) => {
    const text = encodeURIComponent(buildShareText(review));
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
  };

  const handleShareToFacebook = (review: RecentReview) => {
    const url = buildReviewPublicUrl(review);
    if (!url) {
      handleCreateSmartLink(review);
      return;
    }
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleCopyReview = async (review: RecentReview) => {
    const text = buildShareText(review);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        let success = false;
        try {
          success = document.execCommand("copy");
        } finally {
          document.body.removeChild(textarea);
        }
        if (!success) {
          toast({
            title: "Copy failed",
            description: "Please select and copy the text manually.",
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({
        title: "Copy failed",
        description: "Please select and copy the text manually.",
        variant: "destructive",
      });
    }
  };

  const handleCreateSmartLink = (review: RecentReview) => {
    router.push(`/dashboard/share-studio?reviewId=${review.id}`);
  };

  return (
    <Card className="col-span-1 shadow-soft">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50 pb-4">
        <CardTitle className="flex items-center gap-2.5 text-lg font-semibold text-repwell-teal-500">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Star className="h-4 w-4 text-repwell-teal-300" />
          </div>
          Recent Reviews
        </CardTitle>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={handleFilterChange}>
            <SelectTrigger className="h-8 w-[100px]">
              <Filter className="mr-1 h-3 w-3" />
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" asChild>
            <a href="/dashboard/reviews">View all</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isPending ? (
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
        ) : reviews.length === 0 ? (
          <div className="flex h-[280px] flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-gradient-to-br from-repwell-sage-100/30 to-white p-6 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
              <Star className="h-7 w-7 text-amber-500" />
            </div>
            <h4 className="text-base font-semibold text-repwell-teal-500">No reviews yet</h4>
            <p className="mt-1 max-w-[280px] text-sm text-repwell-teal-400">
              Start collecting customer feedback to build your reputation and grow your business.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Button variant="default" size="sm" asChild>
                <a href="/dashboard/requests">
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
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group flex gap-3 rounded-lg border border-border/50 p-3 transition-all hover:bg-repwell-sage-100/20 hover:border-repwell-teal-300/30"
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
                      <span className="font-medium text-repwell-teal-500">
                        {review.customerName || "Anonymous"}
                      </span>
                      <Badge
                        variant={
                          review.status === "approved"
                            ? "default"
                            : review.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                        className="h-5 text-xs"
                      >
                        {review.status}
                      </Badge>
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
                    <p className="line-clamp-2 text-sm text-repwell-teal-400">
                      {review.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-repwell-teal-300">
                      {formatDistanceToNow(new Date(review.reviewDate), {
                        addSuffix: true,
                      })}
                      {review.source !== "internal" && (
                        <span className="ml-2 capitalize">via {review.source}</span>
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
                          <DropdownMenuItem onClick={() => handleShareToLinkedIn(review)}>
                            <LinkedinLogo className="mr-2 h-4 w-4" />
                            {review.sourceUrl || review.userSlug
                              ? "Share to LinkedIn"
                              : "Create Shareable Link"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareToX(review)}>
                            <XLogo className="mr-2 h-4 w-4" />
                            Share to X
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShareToFacebook(review)}>
                            <FacebookLogo className="mr-2 h-4 w-4" />
                            {review.sourceUrl || review.userSlug
                              ? "Share to Facebook"
                              : "Create Shareable Link"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyReview(review)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy review text
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleCreateSmartLink(review)}>
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Create Smart Link
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
                        <a href={`/dashboard/reviews?id=${review.id}`}>
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
