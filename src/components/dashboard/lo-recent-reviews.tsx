"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import type { RecentReview } from "@/lib/dashboard";
import { getLoanOfficerRecentReviews } from "@/lib/dashboard";

interface RecentReviewsProps {
  initialReviews: RecentReview[];
  loanOfficerId?: string;
}

export function LORecentReviews({
  initialReviews,
  loanOfficerId,
}: RecentReviewsProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    startTransition(async () => {
      const result = await getLoanOfficerRecentReviews(loanOfficerId, 10);
      if (result.success && result.data) {
        if (value === "all") {
          setReviews(result.data);
        } else {
          setReviews(result.data.filter((r) => r.status === value));
        }
      }
    });
  };

  const handleShare = async (review: RecentReview) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review from ${review.customerName || "Customer"}`,
          text: review.text || "",
        });
      } catch {
        // User cancelled or share failed - silently ignore
      }
    } else {
      // Fallback: copy to clipboard
      const text = `"${review.text}" - ${review.customerName || "Anonymous"}, ${review.rating} stars`;
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Recent Reviews</CardTitle>
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
      <CardContent>
        {isPending ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-3 rounded-lg border p-3">
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
                <a href="/dashboard/send">
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
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="group flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  {review.customerName
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || "?"}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
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
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {review.text}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.reviewDate), {
                        addSuffix: true,
                      })}
                      {review.source !== "internal" && (
                        <span className="ml-2 capitalize">via {review.source}</span>
                      )}
                    </span>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleShare(review)}
                        title="Share review"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
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
