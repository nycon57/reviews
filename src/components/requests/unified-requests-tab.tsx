"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  PaperPlaneRight,
  Clock,
  CheckCircle,
  ChartLineUp,
  ListDashes,
  XCircle,
  Eye,
  ArrowSquareOut,
  DotsThree as MoreHorizontal,
  X,
  WarningCircle as AlertCircle,
  VideoCamera,
  Envelope,
  MagnifyingGlass as Search,
  PaperPlaneRight as Send,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

import type {
  UnifiedRequest,
  UnifiedRequestStats,
  RequestType,
} from "@/lib/requests/unified-requests";
import { getUnifiedRequests } from "@/lib/requests/unified-requests";
import {
  resendVideoTestimonialRequest,
  cancelVideoTestimonialRequest,
} from "@/lib/video-testimonials/actions";
import { resendSurvey } from "@/lib/distribution/actions";
import { CancelRequestDialog } from "./request-dialogs";
import { SendReviewRequestDialog } from "./send-review-request-dialog";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email?: string;
}

interface UnifiedRequestsTabProps {
  initialRequests: UnifiedRequest[];
  initialTotal: number;
  initialStats: UnifiedRequestStats;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

// Note: teamMembers still needed for the member filter dropdown in the table

// ============================================================================
// Stats Cards
// ============================================================================

function StatsCards({ stats }: { stats: UnifiedRequestStats }) {
  const completionRate =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  const statItems = [
    { label: "Total Requests", value: stats.total, icon: PaperPlaneRight },
    { label: "In Progress", value: stats.pending + stats.sent, icon: Clock },
    { label: "Completed", value: stats.completed, icon: CheckCircle },
    { label: "Expired", value: stats.expired, icon: XCircle },
    { label: "Completion Rate", value: `${completionRate}%`, icon: ChartLineUp },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10">
              <Icon className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight text-heading-accent">
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; className: string; icon: typeof Clock }
  > = {
    pending: {
      label: "Pending",
      className: "text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30",
      icon: Clock,
    },
    sent: {
      label: "Sent",
      className: "text-repwell-teal-300 border-repwell-teal-300/30 bg-repwell-teal-300/5",
      icon: Send,
    },
    opened: {
      label: "Opened",
      className: "text-label border-repwell-teal-400/30 bg-repwell-teal-400/5",
      icon: Eye,
    },
    completed: {
      label: "Completed",
      className: "text-repwell-sage-200 border-repwell-sage-200/30 bg-repwell-sage-200/5",
      icon: CheckCircle,
    },
    expired: {
      label: "Expired",
      className: "text-destructive border-destructive/30 bg-destructive/5",
      icon: XCircle,
    },
    cancelled: {
      label: "Cancelled",
      className: "text-muted-foreground border-border bg-muted/50",
      icon: XCircle,
    },
    failed: {
      label: "Failed",
      className: "text-destructive border-destructive/30 bg-destructive/5",
      icon: AlertCircle,
    },
  };

  const { label, className, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Type Badge
// ============================================================================

function TypeBadge({ type }: { type: RequestType }) {
  if (type === "survey") {
    return (
      <Badge variant="outline" className="gap-1 text-repwell-teal-300 border-repwell-teal-300/30 bg-repwell-teal-300/5">
        <Envelope className="h-3 w-3" />
        Text Review
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-950/30">
      <VideoCamera className="h-3 w-3" />
      Video
    </Badge>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(dateStr: string | null) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================================================
// Unified Requests Table
// ============================================================================

interface UnifiedRequestTableProps {
  requests: UnifiedRequest[];
  canManage: boolean;
  isActioning: boolean;
  onResend: (request: UnifiedRequest) => void;
  onCancelRequest: (id: string) => void;
  onCreateNew: () => void;
}

function UnifiedRequestTable({
  requests,
  canManage,
  isActioning,
  onResend,
  onCancelRequest,
  onCreateNew,
}: UnifiedRequestTableProps) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Send className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-heading-accent">
          No requests yet
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground text-center max-w-sm">
          Send your first review request to start collecting customer feedback.
        </p>
        {canManage && (
          <Button onClick={onCreateNew} className="mt-5">
            <Plus className="mr-2 h-4 w-4" />
            Send Review Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-xs font-medium uppercase tracking-wider">Type</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Customer</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Sent</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Completed</TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider">Reminders</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={`${request.type}-${request.id}`}>
              <TableCell>
                <TypeBadge type={request.type} />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{request.customerName}</div>
                  <div className="text-sm text-muted-foreground">
                    {request.customerEmail}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={request.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.sentAt)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(request.completedAt)}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline">{request.reminderCount}</Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const hasVideoLink = request.type === "video" && request.requestUrl;
                  const hasManageActions = canManage && !["completed", "cancelled", "expired"].includes(request.status);
                  const hasReviewLink = request.status === "completed" && request.reviewId;
                  if (!hasVideoLink && !hasManageActions && !hasReviewLink) return null;
                  return (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {hasReviewLink && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/reviews/${request.reviewId}`}>
                              <ArrowSquareOut className="mr-2 h-4 w-4" />
                              View Review
                            </Link>
                          </DropdownMenuItem>
                        )}
                        {hasVideoLink && (
                          <>
                            {hasReviewLink && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(request.requestUrl!).then(
                                  () => toast({ title: "Copied", description: "Link copied to clipboard" }),
                                  (err) => toast({ title: "Copy failed", description: err?.message || "Could not copy link", variant: "destructive" }),
                                );
                              }}
                            >
                              Copy Link
                            </DropdownMenuItem>
                          </>
                        )}
                        {hasManageActions && (
                          <>
                            {(hasVideoLink || hasReviewLink) && <DropdownMenuSeparator />}
                            <DropdownMenuItem
                              onClick={() => onResend(request)}
                              disabled={isActioning}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {request.type === "video" ? "Resend Invitation" : "Resend Survey"}
                            </DropdownMenuItem>
                            {request.type === "video" && (
                              <DropdownMenuItem
                                onClick={() => onCancelRequest(request.id)}
                                className="text-destructive"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Request
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                })()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function UnifiedRequestsTab({
  initialRequests,
  initialTotal,
  initialStats,
  teamMembers,
  userRole,
}: UnifiedRequestsTabProps) {
  const [requests, setRequests] = useState<UnifiedRequest[]>(initialRequests);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState<UnifiedRequestStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  // Dialog state
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const isInitialMount = useRef(true);
  const canManage = userRole === "admin" || userRole === "manager";

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getUnifiedRequests({
        type: typeFilter !== "all" ? (typeFilter as RequestType) : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        loanOfficerId: memberFilter !== "all" ? memberFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      });

      setRequests(result.requests);
      setTotal(result.total);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, statusFilter, memberFilter, debouncedSearch, page]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchRequests();
  }, [fetchRequests]);

  const handleResend = useCallback(
    async (request: UnifiedRequest) => {
      setIsActioning(true);
      try {
        const result =
          request.type === "video"
            ? await resendVideoTestimonialRequest(request.id)
            : await resendSurvey(request.id);

        if (result.success) {
          toast({ title: "Success", description: "Request resent successfully" });
          fetchRequests();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to resend",
            variant: "destructive",
          });
        }
      } finally {
        setIsActioning(false);
      }
    },
    [fetchRequests]
  );

  const handleCancel = useCallback(async () => {
    if (!requestToCancel) return;

    setIsCancelling(true);
    try {
      const result = await cancelVideoTestimonialRequest(requestToCancel);
      if (result.success) {
        toast({ title: "Success", description: "Request cancelled successfully" });
        setRequestToCancel(null);
        setCancelDialogOpen(false);
        fetchRequests();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel request",
          variant: "destructive",
        });
      }
    } finally {
      setIsCancelling(false);
    }
  }, [requestToCancel, fetchRequests]);

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />

      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <ListDashes className="h-5 w-5 text-repwell-teal-300" />
              </div>
              <div>
                <CardTitle className="text-lg">All Requests</CardTitle>
                <CardDescription>
                  {total} total request{total !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
            {canManage && (
              <Button onClick={() => setRequestDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Send Review Request
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    setDebouncedSearch(searchQuery);
                  }
                }}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="survey">Text Review</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <Select value={memberFilter} onValueChange={(v) => { setMemberFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <UnifiedRequestTable
            requests={requests}
            canManage={canManage}
            isActioning={isActioning}
            onResend={handleResend}
            onCancelRequest={(id) => {
              setRequestToCancel(id);
              setCancelDialogOpen(true);
            }}
            onCreateNew={() => setRequestDialogOpen(true)}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to{" "}
                {Math.min(page * pageSize, total)} of {total} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />
                  Previous
                </Button>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unified Request Dialog */}
      <SendReviewRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={fetchRequests}
      />

      {/* Cancel Dialog */}
      <CancelRequestDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancel}
        isCancelling={isCancelling}
      />
    </div>
  );
}
