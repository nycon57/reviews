"use client";

import { useState, useTransition, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  X,
  Send,
  MoreHorizontal,
  Download,
  Mail,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import type { VideoTestimonialRequest } from "@/lib/video-testimonials/actions";
import {
  getVideoTestimonialRequests,
  createVideoTestimonialRequest,
  createBulkVideoTestimonialRequests,
  cancelVideoTestimonialRequest,
  resendVideoTestimonialRequest,
  type CreateVideoTestimonialRequestInput,
} from "@/lib/video-testimonials/actions";

// ============================================================================
// Types
// ============================================================================

interface LoanOfficer {
  id: string;
  fullName: string;
  email: string;
}

interface Props {
  initialRequests: VideoTestimonialRequest[];
  initialTotal: number;
  loanOfficers: LoanOfficer[];
  userRole: "admin" | "manager" | "loan_officer";
}

type RequestStatus = "pending" | "sent" | "opened" | "submitted" | "expired" | "cancelled";

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof Clock }
  > = {
    pending: { label: "Pending", variant: "secondary", icon: Clock },
    sent: { label: "Sent", variant: "default", icon: Send },
    opened: { label: "Opened", variant: "outline", icon: Eye },
    recording: { label: "Recording", variant: "outline", icon: AlertCircle },
    submitted: { label: "Completed", variant: "default", icon: CheckCircle },
    expired: { label: "Expired", variant: "destructive", icon: XCircle },
    cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[status] || config.pending;

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ============================================================================
// Stats Cards Component
// ============================================================================

function StatsCards({ requests }: { requests: VideoTestimonialRequest[] }) {
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    sent: requests.filter((r) => r.status === "sent" || r.status === "opened").length,
    completed: requests.filter((r) => r.status === "submitted").length,
    expired: requests.filter((r) => r.status === "expired" || r.status === "cancelled").length,
  };

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
          <div className="text-2xl font-bold text-blue-600">
            {stats.pending + stats.sent}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Completed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
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
// Create Request Dialog Component
// ============================================================================

function CreateRequestDialog({
  open,
  onOpenChange,
  loanOfficers,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanOfficers: LoanOfficer[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");

  // Single request form state
  const [singleForm, setSingleForm] = useState({
    loanOfficerId: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    promptText: "",
    maxDurationSeconds: 120,
  });

  // Bulk request form state
  const [bulkText, setBulkText] = useState("");

  const handleSingleSubmit = () => {
    if (!singleForm.loanOfficerId || !singleForm.customerName || !singleForm.customerEmail) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const input: CreateVideoTestimonialRequestInput = {
        loanOfficerId: singleForm.loanOfficerId,
        customerName: singleForm.customerName,
        customerEmail: singleForm.customerEmail,
        customerPhone: singleForm.customerPhone || undefined,
        promptText: singleForm.promptText || undefined,
        maxDurationSeconds: singleForm.maxDurationSeconds,
        sendImmediately: true,
      };

      const result = await createVideoTestimonialRequest(input);

      if (result.success) {
        toast({ title: "Success", description: "Video testimonial request created successfully" });
        setSingleForm({
          loanOfficerId: "",
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          promptText: "",
          maxDurationSeconds: 120,
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to create request", variant: "destructive" });
      }
    });
  };

  const handleBulkSubmit = () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      toast({ title: "Error", description: "Please enter at least one request", variant: "destructive" });
      return;
    }

    const requests: CreateVideoTestimonialRequestInput[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map((p) => p.trim());
      if (parts.length < 3) {
        errors.push(`Line ${i + 1}: Expected format: LoanOfficerID, CustomerName, CustomerEmail`);
        continue;
      }

      const [loanOfficerId, customerName, customerEmail] = parts;

      if (!loanOfficerId || !customerName || !customerEmail) {
        errors.push(`Line ${i + 1}: Missing required fields`);
        continue;
      }

      if (!customerEmail.includes("@")) {
        errors.push(`Line ${i + 1}: Invalid email format`);
        continue;
      }

      requests.push({
        loanOfficerId,
        customerName,
        customerEmail,
        sendImmediately: true,
        maxDurationSeconds: 120,
      });
    }

    if (errors.length > 0) {
      toast({ title: "Error", description: errors.slice(0, 3).join("\n"), variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createBulkVideoTestimonialRequests({ requests });

      if (result.success && result.data) {
        const { totalCreated, totalFailed } = result.data;
        if (totalFailed > 0) {
          toast({ title: "Partial Success", description: `Created ${totalCreated} requests, ${totalFailed} failed` });
        } else {
          toast({ title: "Success", description: `Successfully created ${totalCreated} requests` });
        }
        setBulkText("");
        onOpenChange(false);
        onSuccess();
      } else {
        toast({ title: "Error", description: result.error || "Failed to create bulk requests", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Video Testimonial Request</DialogTitle>
          <DialogDescription>
            Send a video testimonial request to your customers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "single" | "bulk")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <Mail className="h-4 w-4" />
              Single Request
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="loanOfficer">Loan Officer *</Label>
              <Select
                value={singleForm.loanOfficerId}
                onValueChange={(value) =>
                  setSingleForm((prev) => ({ ...prev, loanOfficerId: value }))
                }
              >
                <SelectTrigger id="loanOfficer">
                  <SelectValue placeholder="Select loan officer" />
                </SelectTrigger>
                <SelectContent>
                  {loanOfficers.map((lo) => (
                    <SelectItem key={lo.id} value={lo.id}>
                      {lo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={singleForm.customerName}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerName: e.target.value }))
                  }
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={singleForm.customerEmail}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerEmail: e.target.value }))
                  }
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone (Optional)</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={singleForm.customerPhone}
                  onChange={(e) =>
                    setSingleForm((prev) => ({ ...prev, customerPhone: e.target.value }))
                  }
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Video Duration</Label>
                <Select
                  value={String(singleForm.maxDurationSeconds)}
                  onValueChange={(value) =>
                    setSingleForm((prev) => ({ ...prev, maxDurationSeconds: Number(value) }))
                  }
                >
                  <SelectTrigger id="maxDuration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="promptText">Custom Prompt (Optional)</Label>
              <Textarea
                id="promptText"
                value={singleForm.promptText}
                onChange={(e) =>
                  setSingleForm((prev) => ({ ...prev, promptText: e.target.value }))
                }
                placeholder="Share your experience working with us..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSingleSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4 pt-4">
            <div className="rounded-lg border border-dashed p-4">
              <div className="text-sm text-muted-foreground mb-2">
                <strong>Format:</strong> One request per line:{" "}
                <code className="bg-muted px-1 rounded">LoanOfficerID, CustomerName, CustomerEmail</code>
              </div>
              <div className="text-sm text-muted-foreground">
                <strong>Example:</strong>
                <pre className="mt-1 bg-muted p-2 rounded text-xs">
{`abc123-uuid, John Smith, john@example.com
def456-uuid, Jane Doe, jane@example.com`}
                </pre>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulkText">Bulk Requests</Label>
                <span className="text-xs text-muted-foreground">
                  Max 100 requests per batch
                </span>
              </div>
              <Textarea
                id="bulkText"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Loan Officer IDs:</span>
              </div>
              <div className="mt-2 max-h-32 overflow-auto">
                {loanOfficers.map((lo) => (
                  <div key={lo.id} className="text-xs text-muted-foreground py-0.5">
                    <code className="bg-white px-1 rounded">{lo.id}</code> - {lo.fullName}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkSubmit} disabled={isPending}>
                {isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Requests
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function VideoTestimonialRequestsDashboard({
  initialRequests,
  initialTotal,
  loanOfficers,
  userRole,
}: Props) {
  const [requests, setRequests] = useState<VideoTestimonialRequest[]>(initialRequests);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loanOfficerFilter, setLoanOfficerFilter] = useState<string>("all");

  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [requestToCancel, setRequestToCancel] = useState<string | null>(null);

  const canManage = userRole === "admin" || userRole === "manager";

  // Fetch requests with current filters
  const fetchRequests = useCallback(() => {
    startTransition(async () => {
      const result = await getVideoTestimonialRequests({
        status: statusFilter !== "all" ? statusFilter : undefined,
        loanOfficerId: loanOfficerFilter !== "all" ? loanOfficerFilter : undefined,
        search: searchQuery || undefined,
        page,
        pageSize,
      });

      if (result.success && result.data) {
        setRequests(result.data.requests);
        setTotal(result.data.total);
      }
    });
  }, [statusFilter, loanOfficerFilter, searchQuery, page]);

  // Resend request
  const handleResend = useCallback(
    (requestId: string) => {
      startTransition(async () => {
        const result = await resendVideoTestimonialRequest(requestId);
        if (result.success) {
          toast({ title: "Success", description: "Invitation resent successfully" });
          fetchRequests();
        } else {
          toast({ title: "Error", description: result.error || "Failed to resend invitation", variant: "destructive" });
        }
      });
    },
    [fetchRequests]
  );

  // Cancel request
  const handleCancel = useCallback(() => {
    if (!requestToCancel) return;

    startTransition(async () => {
      const result = await cancelVideoTestimonialRequest(requestToCancel);
      if (result.success) {
        toast({ title: "Success", description: "Request cancelled successfully" });
        setRequestToCancel(null);
        setCancelDialogOpen(false);
        fetchRequests();
      } else {
        toast({ title: "Error", description: result.error || "Failed to cancel request", variant: "destructive" });
      }
    });
  }, [requestToCancel, fetchRequests]);

  // Export to CSV
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
      r.customerName,
      r.customerEmail,
      r.status,
      r.sentAt || "",
      r.openedAt || "",
      r.submittedAt || "",
      String(r.reminderCount),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
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

  // Format date for display
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <StatsCards requests={requests} />

      {/* Filters and Actions */}
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
          {/* Search and Filters */}
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
                    fetchRequests();
                  }
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="submitted">Completed</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <Select
                value={loanOfficerFilter}
                onValueChange={(value) => {
                  setLoanOfficerFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Loan Officers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Loan Officers</SelectItem>
                  {loanOfficers.map((lo) => (
                    <SelectItem key={lo.id} value={lo.id}>
                      {lo.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setPage(1);
                fetchRequests();
              }}
              disabled={isPending}
            >
              <RefreshCw className={cn("h-4 w-4", isPending && "animate-spin")} />
            </Button>
          </div>

          {/* Table */}
          {requests.length === 0 ? (
            <EmptyState
              iconName="send"
              title="No video testimonial requests"
              description="Create your first video testimonial request to start collecting customer videos."
              actions={
                canManage
                  ? [
                      {
                        label: "Create Request",
                        iconName: "plus",
                        href: "#",
                      },
                    ]
                  : undefined
              }
            />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Reminders</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
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
                        {formatDate(request.openedAt)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{request.reminderCount}</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(request.requestUrl);
                                toast({ title: "Copied", description: "Link copied to clipboard" });
                              }}
                            >
                              Copy Link
                            </DropdownMenuItem>
                            {canManage &&
                              !["submitted", "cancelled", "expired"].includes(request.status) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleResend(request.id)}
                                    disabled={isPending}
                                  >
                                    <Send className="mr-2 h-4 w-4" />
                                    Resend Invitation
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setRequestToCancel(request.id);
                                      setCancelDialogOpen(true);
                                    }}
                                    className="text-destructive"
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Request
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
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
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    fetchRequests();
                  }}
                  disabled={page === 1 || isPending}
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
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    fetchRequests();
                  }}
                  disabled={page === totalPages || isPending}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <CreateRequestDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        loanOfficers={loanOfficers}
        onSuccess={fetchRequests}
      />

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Video Testimonial Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the request and prevent the customer from submitting a video
              testimonial. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
