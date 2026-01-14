"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  RefreshCw,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  BarChart3,
  Copy,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import {
  getWebhookLogs,
  getWebhookStats,
  getWebhookLogDetail,
  type WebhookLog,
  type WebhookStats,
  type WebhookLogFilters,
} from "@/lib/webhooks/actions";

export function WebhookLogsViewer() {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<WebhookLog[] | null>(null);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [filters, setFilters] = useState<WebhookLogFilters>({});
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const { toast } = useToast();
  const loadStarted = useRef(false);

  const loadLogs = useCallback((): void => {
    startTransition(async () => {
      const result = await getWebhookLogs(filters, page, pageSize);
      if (result.success && result.data) {
        setLogs(result.data.logs);
        setTotal(result.data.total);
      } else {
        setLogs([]);
        setTotal(0);
      }
    });
  }, [filters, page, pageSize]);

  const loadStats = useCallback((): void => {
    startTransition(async () => {
      const result = await getWebhookStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  }, []);

  useEffect(() => {
    if (!loadStarted.current) {
      loadStarted.current = true;
      loadLogs();
      loadStats();
    }
  }, [loadLogs, loadStats]);

  function handleRefresh(): void {
    loadLogs();
    loadStats();
  }

  function handleFilterChange(
    key: keyof WebhookLogFilters,
    value: string | undefined
  ): void {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
    }));
    setPage(1);
  }

  function handleApplyFilters(): void {
    loadLogs();
    setShowFilters(false);
  }

  function handleClearFilters(): void {
    setFilters({});
    setPage(1);
    loadLogs();
    setShowFilters(false);
  }

  function handleViewLog(log: WebhookLog): void {
    startTransition(async () => {
      const result = await getWebhookLogDetail(log.id);
      if (result.success && result.data) {
        setSelectedLog(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to load log details",
          variant: "destructive",
        });
      }
    });
  }

  function copyToClipboard(text: string, item: string): void {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
    toast({ title: "Copied", description: `${item} copied to clipboard` });
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "processed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "ignored":
        return <AlertCircle className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      processed: "default",
      failed: "destructive",
      ignored: "secondary",
      received: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  }

  const isLoading = logs === null;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Webhooks</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{stats.successRate}%</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600/50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">{stats.avgProcessingTimeMs}ms</p>
                </div>
                <Clock className="h-8 w-8 text-blue-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Logs Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Webhook Logs</CardTitle>
              <CardDescription>
                View and debug incoming webhook requests
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {Object.values(filters).some(Boolean) && (
                  <Badge variant="secondary" className="ml-2">
                    Active
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isPending}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 rounded-lg border p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs">Status</Label>
                  <Select
                    value={filters.status || "all"}
                    onValueChange={(v) => handleFilterChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="ignored">Ignored</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Event Type</Label>
                  <Select
                    value={filters.eventType || "all"}
                    onValueChange={(v) => handleFilterChange("eventType", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All events</SelectItem>
                      <SelectItem value="loan.closed">loan.closed</SelectItem>
                      <SelectItem value="contact.created">contact.created</SelectItem>
                      <SelectItem value="survey.trigger">survey.trigger</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate || ""}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value || undefined)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate || ""}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value || undefined)
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear
                </Button>
                <Button size="sm" onClick={handleApplyFilters}>
                  <Search className="mr-2 h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No webhook logs found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Status</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead className="hidden md:table-cell">Source</TableHead>
                      <TableHead className="hidden lg:table-cell">Time</TableHead>
                      <TableHead className="hidden sm:table-cell">Duration</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getStatusIcon(log.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-sm">{log.eventType}</span>
                            {log.errorMessage && (
                              <span className="text-xs text-red-600 truncate max-w-[200px]">
                                {log.errorMessage}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {log.webhookConfigName || "—"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {log.processingTimeMs !== null ? (
                            <Badge variant="outline">
                              {log.processingTimeMs}ms
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewLog(log)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        loadLogs();
                      }}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        loadLogs();
                      }}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <Dialog open={selectedLog !== null} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getStatusIcon(selectedLog.status)}
              Webhook Log Details
            </DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(new Date(selectedLog.createdAt), "PPpp")}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="payload">Payload</TabsTrigger>
                <TabsTrigger value="metadata">Metadata</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Event Type</Label>
                    <p className="mt-1 font-mono">{selectedLog.eventType}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Processing Time</Label>
                    <p className="mt-1">
                      {selectedLog.processingTimeMs !== null
                        ? `${selectedLog.processingTimeMs}ms`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Survey ID</Label>
                    <p className="mt-1 font-mono text-sm">
                      {selectedLog.surveyId || "—"}
                    </p>
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                    <Label className="text-xs text-red-600 dark:text-red-400">
                      Error Message
                    </Label>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {selectedLog.errorMessage}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payload">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">
                      Request Payload
                    </Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          JSON.stringify(selectedLog.payload, null, 2),
                          "Payload"
                        )
                      }
                    >
                      {copiedItem === "Payload" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <ScrollArea className="h-[300px] rounded-md border">
                    <pre className="p-4 text-xs font-mono">
                      {selectedLog.payload
                        ? JSON.stringify(selectedLog.payload, null, 2)
                        : "No payload data"}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">IP Address</Label>
                    <p className="mt-1 font-mono text-sm">
                      {selectedLog.ipAddress || "—"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Webhook Config</Label>
                    <p className="mt-1">{selectedLog.webhookConfigName || "—"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">User Agent</Label>
                  <p className="mt-1 text-sm break-all">
                    {selectedLog.userAgent || "—"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
