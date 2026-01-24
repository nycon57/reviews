"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  ArrowSquareOut as ExternalLink,
  Archive,
  Flag,
  Chats as MessageSquare,
  Calendar,
  MapPin,
  User,
  BuildingOffice as Building2,
  TrendUp as TrendingUp,
  Tag as Tags,
  Clock,
  ShareNetwork as Share2,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  archiveReview,
  toggleReviewFeatured,
} from "@/lib/reviews/aggregation-actions";
import type { AggregatedReview } from "@/lib/reviews/types";
import { ResponseComposer } from "./response-composer";
import { SocialPostComposer } from "@/components/social";
import { toast } from "@/hooks/use-toast";

// ============================================================================
// Types
// ============================================================================

interface ReviewDetail {
  id: string;
  source: string;
  sourceReviewId: string | null;
  sourceUrl: string | null;
  rating: number;
  title: string | null;
  text: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerLocation: string | null;
  reviewDate: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  featured: boolean;
  responseText: string | null;
  responseAt: string | null;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  keyPhrases: string[] | null;
  themes: string[] | null;
  approvedAt: string | null;
  publishedAt: string | null;
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  loanOfficer?: {
    id: string;
    fullName: string;
    email: string;
    photoUrl: string | null;
  };
}

interface Props {
  review: ReviewDetail;
  userRole: "admin" | "manager" | "user";
  hasAiAccess?: boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================================================
// Badge Components
// ============================================================================

function StatusBadge({ status }: { status: ReviewDetail["status"] }) {
  const variants = {
    pending: "border-yellow-500 text-yellow-600 bg-yellow-50",
    approved: "border-green-500 text-green-600 bg-green-50",
    rejected: "border-red-500 text-red-600 bg-red-50",
    archived: "border-gray-400 text-gray-500 bg-gray-50",
  };
  return (
    <Badge variant="outline" className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    internal: "bg-blue-100 text-blue-700",
    google: "bg-red-100 text-red-700",
    zillow: "bg-purple-100 text-purple-700",
    facebook: "bg-indigo-100 text-indigo-700",
    yelp: "bg-orange-100 text-orange-700",
  };
  return (
    <Badge className={colors[source] || "bg-gray-100 text-gray-700"}>
      {source === "internal" ? "Survey" : source.charAt(0).toUpperCase() + source.slice(1)}
    </Badge>
  );
}

function SentimentBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const colors: Record<string, string> = {
    positive: "bg-green-100 text-green-700",
    neutral: "bg-gray-100 text-gray-700",
    negative: "bg-red-100 text-red-700",
  };
  return (
    <Badge className={colors[label.toLowerCase()] || "bg-gray-100 text-gray-700"}>
      {label}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ReviewDetailView({ review, userRole, hasAiAccess = true }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [showSocialComposer, setShowSocialComposer] = useState(false);

  const canManage = userRole === "admin" || userRole === "manager";

  const handleArchive = () => {
    startTransition(async () => {
      const result = await archiveReview(review.id);
      if (result.success) {
        toast({ title: "Review archived successfully" });
        router.refresh();
      } else {
        toast({
          title: "Failed to archive review",
          variant: "destructive",
        });
      }
    });
  };

  const handleToggleFeatured = () => {
    startTransition(async () => {
      const result = await toggleReviewFeatured(review.id, !review.featured);
      if (result.success) {
        toast({
          title: review.featured ? "Removed from featured" : "Added to featured",
        });
        router.refresh();
      } else {
        toast({
          title: "Failed to update featured status",
          variant: "destructive",
        });
      }
    });
  };

  const customerInitials = review.customerName
    ? review.customerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex-1 space-y-6">
      {/* Back link and header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/reviews">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Reviews
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div className="flex items-center gap-2">
            <StatusBadge status={review.status} />
            <SourceBadge source={review.source} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Review */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 text-lg font-semibold">
                  {customerInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-xl">
                    {review.customerName || "Anonymous"}
                  </h2>
                  {review.customerLocation && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {review.customerLocation}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(review.reviewDate)}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3">
                {review.title && (
                  <h3 className="font-medium text-lg">{review.title}</h3>
                )}
                {review.text ? (
                  <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {review.text}
                  </p>
                ) : (
                  <p className="text-muted-foreground/60 italic">
                    No written review provided
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {(review.sentimentLabel || (review.themes && review.themes.length > 0)) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4" />
                  AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {review.sentimentLabel && <SentimentBadge label={review.sentimentLabel} />}
                  {review.themes?.map((theme, i) => (
                    <Badge key={i} variant="outline" className="flex items-center gap-1">
                      <Tags className="h-3 w-3" />
                      {theme}
                    </Badge>
                  ))}
                </div>
                {review.keyPhrases && review.keyPhrases.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Key phrases: </span>
                    {review.keyPhrases.join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Response Section */}
          {review.responseText && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{review.responseText}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Responded on {formatDateTime(review.responseAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Response Form */}
          {!review.responseText && showResponseForm && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Compose Response
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponseComposer
                  review={review as unknown as AggregatedReview}
                  onSuccess={() => {
                    setShowResponseForm(false);
                    router.refresh();
                  }}
                  onCancel={() => setShowResponseForm(false)}
                  hasAiAccess={hasAiAccess}
                />
              </CardContent>
            </Card>
          )}

          {/* Source Info */}
          {(review.sourceUrl || review.sourceReviewId) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4" />
                  Source Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.sourceUrl && (
                  <a
                    href={review.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View on {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {review.syncedAt && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Last synced: {formatDateTime(review.syncedAt)}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Actions */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant={review.featured ? "default" : "outline"}
                  className="w-full gap-2"
                  onClick={handleToggleFeatured}
                  disabled={isPending}
                >
                  <Flag className="h-4 w-4" />
                  {review.featured ? "Featured" : "Feature"}
                </Button>
                {!review.responseText && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowResponseForm(!showResponseForm)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Respond
                  </Button>
                )}
                {review.status === "approved" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setShowSocialComposer(true)}
                  >
                    <Share2 className="h-4 w-4" />
                    Share to Social
                  </Button>
                )}
                {review.status !== "archived" && (
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-muted-foreground"
                    onClick={handleArchive}
                    disabled={isPending}
                  >
                    <Archive className="h-4 w-4" />
                    Archive
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Loan Officer Info */}
          {review.loanOfficer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Loan Officer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.loanOfficer.photoUrl || undefined} />
                    <AvatarFallback>
                      {review.loanOfficer.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) || "LO"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.loanOfficer.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.loanOfficer.email}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{formatDateTime(review.createdAt)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Updated</dt>
                  <dd className="font-medium">{formatDateTime(review.updatedAt)}</dd>
                </div>
                {review.approvedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Approved</dt>
                    <dd className="font-medium">{formatDateTime(review.approvedAt)}</dd>
                  </div>
                )}
                {review.publishedAt && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Published</dt>
                    <dd className="font-medium">{formatDateTime(review.publishedAt)}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Social Post Composer */}
      <SocialPostComposer
        reviewId={review.id}
        reviewRating={review.rating}
        reviewText={review.text}
        customerName={review.customerName}
        open={showSocialComposer}
        onOpenChange={setShowSocialComposer}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
