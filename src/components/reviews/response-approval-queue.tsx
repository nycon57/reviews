"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Star,
  Clock,
  MessageSquare,
  User,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  getPendingApprovals,
  approveResponse,
  rejectResponse,
} from "@/lib/reviews/response-actions";

interface PendingApproval {
  id: string;
  customerName: string | null;
  text: string | null;
  rating: number;
  source: string;
  reviewDate: string;
  responseText: string;
  responseBy: string | null;
  responseAt: string | null;
  loanOfficer: { id: string; fullName: string; photoUrl: string | null };
}

export function ResponseApprovalQueue() {
  const [isPending, startTransition] = useTransition();
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<PendingApproval | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadPendingApprovals = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getPendingApprovals();
    if (result.success && result.data) {
      setPendingApprovals(result.data.reviews);
    } else {
      setError(result.error || "Failed to load pending approvals");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPendingApprovals();
  }, [loadPendingApprovals]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSourceBadge = (source: string) => {
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
  };

  const handleApprove = (review: PendingApproval) => {
    startTransition(async () => {
      const result = await approveResponse(review.id);
      if (result.success) {
        setActionSuccess(`Response approved and posted for ${review.customerName || "Anonymous"}`);
        setPendingApprovals((prev) => prev.filter((r) => r.id !== review.id));
        setSelectedReview(null);
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setError(result.error || "Failed to approve response");
      }
    });
  };

  const handleOpenReject = (review: PendingApproval) => {
    setSelectedReview(review);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleReject = () => {
    if (!selectedReview || !rejectionReason.trim()) return;

    startTransition(async () => {
      const result = await rejectResponse(selectedReview.id, rejectionReason.trim());
      if (result.success) {
        setActionSuccess(`Response rejected for ${selectedReview.customerName || "Anonymous"}`);
        setPendingApprovals((prev) => prev.filter((r) => r.id !== selectedReview.id));
        setShowRejectDialog(false);
        setSelectedReview(null);
        setRejectionReason("");
        setTimeout(() => setActionSuccess(null), 4000);
      } else {
        setError(result.error || "Failed to reject response");
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Response Approvals</h2>
          <p className="text-muted-foreground">
            Review and approve responses before they are posted
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadPendingApprovals} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Status Messages */}
      {actionSuccess && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {actionSuccess}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {error}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => setError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Empty State */}
      {pendingApprovals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground max-w-sm">
              There are no responses pending approval. New responses will appear here when team
              members submit them for review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Queue Count */}
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="px-3 py-1">
              <Clock className="h-3 w-3 mr-1.5" />
              {pendingApprovals.length} pending
            </Badge>
          </div>

          {/* Approval Cards */}
          <div className="space-y-4">
            {pendingApprovals.map((review) => (
              <Card key={review.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={review.loanOfficer.photoUrl || undefined} />
                        <AvatarFallback>
                          {review.loanOfficer.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {review.loanOfficer.fullName}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground font-normal">
                            {review.customerName || "Anonymous"}
                          </span>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {getSourceBadge(review.source)}
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {review.rating}
                          </span>
                          <span>|</span>
                          <span>Submitted {formatDate(review.responseAt)} at {formatTime(review.responseAt)}</span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReject(review)}
                        disabled={isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1.5 text-red-500" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(review)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                        )}
                        Approve & Post
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Original Review */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <User className="h-4 w-4" />
                        Customer Review
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-muted text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm line-clamp-4">
                          {review.text || (
                            <span className="italic text-muted-foreground">
                              No written review
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Proposed Response */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        Proposed Response
                      </div>
                      <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                        <p className="text-sm whitespace-pre-wrap line-clamp-6">
                          {review.responseText}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Response</DialogTitle>
            <DialogDescription>
              Provide feedback so the team member can revise their response.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Response being rejected:</p>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {selectedReview.responseText}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for rejection</label>
                <Textarea
                  placeholder="Explain why this response needs to be revised..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isPending || !rejectionReason.trim()}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-1.5" />
              )}
              Reject Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
