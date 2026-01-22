"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  FlaskConical,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Play,
  Pause,
  Square,
  Trophy,
  RefreshCcw,
  Activity,
  CheckCircle2,
  FileEdit,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  getABTests,
  getABTestSummary,
  startABTest,
  stopABTest,
  pauseABTest,
  resumeABTest,
  deleteABTest,
  type ABTest,
  type ABTestFilters,
  type ABTestSummary,
  type ABTestStatus,
  type TestType,
  getTestTypeDisplayName,
  getStatusDisplayName,
} from "@/lib/email-ab-testing";

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

function StatusBadge({ status }: { status: ABTestStatus }) {
  const variants: Record<ABTestStatus, { variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
    draft: { variant: "outline", className: "text-gray-600 border-gray-300" },
    active: { variant: "default", className: "bg-green-600 hover:bg-green-700" },
    paused: { variant: "secondary", className: "bg-amber-100 text-amber-700" },
    completed: { variant: "secondary", className: "bg-blue-100 text-blue-700" },
    archived: { variant: "outline", className: "text-gray-400 border-gray-200" },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {getStatusDisplayName(status)}
    </Badge>
  );
}

// =============================================================================
// STAT CARD COMPONENT
// =============================================================================

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  className?: string;
}

function StatCard({ title, value, icon: Icon, description, className }: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ABTestsListClient() {
  // State
  const [tests, setTests] = useState<ABTest[]>([]);
  const [summary, setSummary] = useState<ABTestSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ABTestFilters>({
    status: "all",
    testType: "all",
    search: "",
    page: 1,
    limit: 20,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Fetch tests
  const fetchTests = useCallback(async () => {
    setIsLoading(true);
    try {
      const [testsResult, summaryResult] = await Promise.all([
        getABTests(filters),
        getABTestSummary(),
      ]);

      if (testsResult.success && testsResult.data) {
        setTests(testsResult.data.tests);
        const calculatedPages = Math.ceil(testsResult.data.total / (filters.limit || 20));
        setTotalPages(calculatedPages || 1);
      } else {
        toast({ title: testsResult.error || "Failed to load tests", variant: "destructive" });
      }

      if (summaryResult.success && summaryResult.data) {
        setSummary(summaryResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch tests:", error);
      toast({ title: "Failed to load A/B tests", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Handle filter changes
  const handleStatusFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value as ABTestStatus | "all",
      page: 1,
    }));
  };

  const handleTypeFilter = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      testType: value as TestType | "all",
      page: 1,
    }));
  };

  const handleSearch = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value,
      page: 1,
    }));
  };

  // Test actions
  const handleStart = async (testId: string) => {
    startTransition(async () => {
      const result = await startABTest(testId);
      if (result.success) {
        toast({ title: "Test started successfully" });
        fetchTests();
      } else {
        toast({ title: result.error || "Failed to start test", variant: "destructive" });
      }
    });
  };

  const handlePause = async (testId: string) => {
    startTransition(async () => {
      const result = await pauseABTest(testId);
      if (result.success) {
        toast({ title: "Test paused" });
        fetchTests();
      } else {
        toast({ title: result.error || "Failed to pause test", variant: "destructive" });
      }
    });
  };

  const handleResume = async (testId: string) => {
    startTransition(async () => {
      const result = await resumeABTest(testId);
      if (result.success) {
        toast({ title: "Test resumed" });
        fetchTests();
      } else {
        toast({ title: result.error || "Failed to resume test", variant: "destructive" });
      }
    });
  };

  const handleStop = async (testId: string) => {
    startTransition(async () => {
      const result = await stopABTest(testId);
      if (result.success) {
        toast({ title: "Test stopped" });
        fetchTests();
      } else {
        toast({ title: result.error || "Failed to stop test", variant: "destructive" });
      }
    });
  };

  const handleDelete = async () => {
    if (!testToDelete) return;

    startTransition(async () => {
      const result = await deleteABTest(testToDelete);
      if (result.success) {
        toast({ title: "Test deleted" });
        setDeleteDialogOpen(false);
        setTestToDelete(null);
        fetchTests();
      } else {
        toast({ title: result.error || "Failed to delete test", variant: "destructive" });
      }
    });
  };

  const confirmDelete = (testId: string) => {
    setTestToDelete(testId);
    setDeleteDialogOpen(true);
  };

  // Render action buttons based on test status
  const renderActions = (test: ABTest) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/admin/email-ab-tests/${test.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>

          {test.status === "draft" && (
            <>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/admin/email-ab-tests/${test.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStart(test.id)}>
                <Play className="mr-2 h-4 w-4" />
                Start Test
              </DropdownMenuItem>
            </>
          )}

          {test.status === "active" && (
            <>
              <DropdownMenuItem onClick={() => handlePause(test.id)}>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStop(test.id)}>
                <Square className="mr-2 h-4 w-4" />
                Stop Test
              </DropdownMenuItem>
            </>
          )}

          {test.status === "paused" && (
            <>
              <DropdownMenuItem onClick={() => handleResume(test.id)}>
                <Play className="mr-2 h-4 w-4" />
                Resume
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStop(test.id)}>
                <Square className="mr-2 h-4 w-4" />
                Stop Test
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => confirmDelete(test.id)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Tests"
            value={summary.total}
            icon={FlaskConical}
            description="All time"
          />
          <StatCard
            title="Active Tests"
            value={summary.active}
            icon={Activity}
            description="Currently running"
          />
          <StatCard
            title="Completed"
            value={summary.completed}
            icon={CheckCircle2}
            description={`${summary.withWinner} with winner`}
          />
          <StatCard
            title="Draft Tests"
            value={summary.draft}
            icon={FileEdit}
            description="Not yet started"
          />
        </div>
      )}

      {/* Filters and Actions */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>A/B Tests</CardTitle>
            <Button asChild>
              <Link href="/dashboard/admin/email-ab-tests/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Test
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                className="pl-9"
                value={filters.search || ""}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <Select value={filters.status || "all"} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.testType || "all"} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Test Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="subject_line">Subject Line</SelectItem>
                <SelectItem value="preview_text">Preview Text</SelectItem>
                <SelectItem value="content">Content</SelectItem>
                <SelectItem value="send_time">Send Time</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchTests()}>
              <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FlaskConical className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">No A/B tests found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {filters.search || filters.status !== "all" || filters.testType !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first A/B test to optimize email performance"}
              </p>
              {!filters.search && filters.status === "all" && filters.testType === "all" && (
                <Button asChild>
                  <Link href="/dashboard/admin/email-ab-tests/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Test
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <Link
                          href={`/dashboard/admin/email-ab-tests/${test.id}`}
                          className="font-medium hover:underline"
                        >
                          {test.name}
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {test.emailType}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getTestTypeDisplayName(test.testType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={test.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {test.variants.map((variant) => (
                            <Badge
                              key={variant.id}
                              variant="outline"
                              className={cn(
                                "text-xs",
                                variant.isControl && "bg-blue-50 border-blue-200"
                              )}
                            >
                              {variant.id}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.winnerVariant ? (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-amber-500" />
                            <span className="font-medium">{test.winnerVariant}</span>
                            {test.winnerAuto && (
                              <span className="text-xs text-muted-foreground">(auto)</span>
                            )}
                          </div>
                        ) : test.status === "active" ? (
                          <span className="text-sm text-muted-foreground">Running...</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(test.createdAt), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>{renderActions(test)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {filters.page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === totalPages}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Delete A/B Test
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this test? This action cannot be undone
              and all associated results will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Test"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
