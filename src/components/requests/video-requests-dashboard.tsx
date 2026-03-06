"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  DownloadSimple as Download,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
  PaperPlaneRight,
  Clock,
  CheckCircle,
  ChartLineUp,
  ListDashes,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { VideoTestimonialRequest } from "@/lib/video-testimonials/actions";
import {
  getVideoTestimonialRequests,
  cancelVideoTestimonialRequest,
  resendVideoTestimonialRequest,
} from "@/lib/video-testimonials/actions";
import { RequestFilters } from "./request-filters";
import { RequestTable } from "./request-table";
import { CancelRequestDialog } from "./request-dialogs";
import { SendReviewRequestDialog } from "./send-review-request-dialog";

// ============================================================================
// Types
// ============================================================================

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
}

export interface RequestStats {
  total: number;
  pending: number;
  sent: number;
  completed: number;
  expired: number;
}

interface Props {
  initialRequests: VideoTestimonialRequest[];
  initialTotal: number;
  initialStats: RequestStats;
  teamMembers: TeamMember[];
  userRole: "admin" | "manager" | "user";
}

// ============================================================================
// Stats Cards
// ============================================================================

function StatsCards({ stats }: { stats: RequestStats }) {
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
// Main Dashboard
// ============================================================================

export function VideoTestimonialRequestsDashboard({
  initialRequests,
  initialTotal,
  initialStats,
  teamMembers,
  userRole,
}: Props) {
  const [requests, setRequests] = useState<VideoTestimonialRequest[]>(initialRequests);
  const [total, setTotal] = useState(initialTotal);
  const [stats] = useState<RequestStats>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  const isInitialMount = useRef(true);
  const canManage = userRole === "admin" || userRole === "manager";

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getVideoTestimonialRequests({
        status: statusFilter !== "all" ? statusFilter : undefined,
        loanOfficerId: memberFilter !== "all" ? memberFilter : undefined,
        search: debouncedSearch || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setRequests(result.data.requests);
        setTotal(result.data.total);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch requests",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, memberFilter, debouncedSearch, page]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    fetchRequests();
  }, [fetchRequests]);

  const handleResend = useCallback(
    async (requestId: string) => {
      setIsResending(true);
      try {
        const result = await resendVideoTestimonialRequest(requestId);
        if (result.success) {
          toast({ title: "Success", description: "Invitation resent successfully" });
          fetchRequests();
        } else {
          toast({ title: "Error", description: result.error || "Failed to resend invitation", variant: "destructive" });
        }
      } finally {
        setIsResending(false);
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
        toast({ title: "Error", description: result.error || "Failed to cancel request", variant: "destructive" });
      }
    } finally {
      setIsCancelling(false);
    }
  }, [requestToCancel, fetchRequests]);

  const sanitizeCSVCell = (cell: string): string => {
    if (typeof cell === "string" && /^[=+\-@\t\r]/.test(cell)) {
      return `'${cell}`;
    }
    return cell;
  };

  const handleExportCSV = useCallback(() => {
    const headers = [
      "Customer Name",
      "Customer Email",
      "Status",
      "Sent Date",
      "Opened Date",
      "Completed Date",
      "Reminder Count",
    ];

    const rows = requests.map((r) => [
      sanitizeCSVCell(r.customerName),
      sanitizeCSVCell(r.customerEmail),
      r.status,
      r.sentAt || "",
      r.openedAt || "",
      r.submittedAt || "",
      String(r.reminderCount),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `video-testimonial-requests-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Success", description: "Exported to CSV" });
  }, [requests]);

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
                <CardTitle className="text-lg">Requests</CardTitle>
                <CardDescription>
                  {total} total request{total !== 1 ? "s" : ""}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {canManage && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              )}
              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <RequestFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={() => {
              setPage(1);
              setDebouncedSearch(searchQuery);
            }}
            statusFilter={statusFilter}
            onStatusFilterChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            memberFilter={memberFilter}
            onMemberFilterChange={(value) => {
              setMemberFilter(value);
              setPage(1);
            }}
            canManage={canManage}
            teamMembers={teamMembers}
            isLoading={isLoading}
            onRefresh={fetchRequests}
          />

          <RequestTable
            requests={requests}
            canManage={canManage}
            isResending={isResending}
            onResend={handleResend}
            onCancelRequest={(id) => {
              setRequestToCancel(id);
              setCancelDialogOpen(true);
            }}
            onCreateNew={() => setCreateDialogOpen(true)}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{" "}
                {total} results
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

      <SendReviewRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchRequests}
      />

      <CancelRequestDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleCancel}
        isCancelling={isCancelling}
      />
    </div>
  );
}
