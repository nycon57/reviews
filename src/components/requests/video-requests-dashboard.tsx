"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Plus,
  DownloadSimple as Download,
  CaretLeft as ChevronLeft,
  CaretRight as ChevronRight,
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
import { CreateRequestDialog, CancelRequestDialog } from "./request-dialogs";

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

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Total Requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>In Progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {stats.pending + stats.sent}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-repwell-sage-200">{stats.completed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completion Rate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate}%</div>
        </CardContent>
      </Card>
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

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                {total} total request{total !== 1 ? "s" : ""}
              </CardDescription>
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
        <CardContent className="space-y-4">
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
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of{" "}
                {total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        teamMembers={teamMembers}
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
