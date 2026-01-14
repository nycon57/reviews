"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Mail,
  Webhook,
  RotateCcw,
  Settings,
} from "lucide-react";
import {
  getDistributionQueue,
  getSurveysForDistribution,
  resendSurvey,
} from "@/lib/distribution/actions";
import { formatDistanceToNow } from "date-fns";
import { SendSurveyDialog } from "./send-survey-dialog";
import { WebhookConfigManager } from "./webhook-config-manager";
import { useToast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  survey_id: string;
  type: string;
  scheduled_at: string;
  status: string | null;
  priority: number | null;
  retry_count: number | null;
  error_message: string | null;
  created_at: string | null;
  survey?: {
    customer_name: string;
    customer_email: string;
    loan_officer?: {
      full_name: string;
    };
  };
}

interface Survey {
  id: string;
  customer_name: string;
  customer_email: string;
  status: string | null;
  sent_at: string | null;
  created_at: string | null;
  source: string | null;
  loan_officer?: {
    full_name: string;
  };
}

interface Stats {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export function DistributionDashboard() {
  const [isPending, startTransition] = useTransition();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    processing: 0,
    sent: 0,
    failed: 0,
  });
  const { toast } = useToast();

  const loadData = () => {
    startTransition(async () => {
      const [queueResult, surveysResult] = await Promise.all([
        getDistributionQueue({ pageSize: 50 }),
        getSurveysForDistribution({ pageSize: 50 }),
      ]);

      if (queueResult.success && queueResult.data) {
        const items = queueResult.data.items;
        setQueueItems(items.map((item) => ({
          id: item.id,
          survey_id: item.surveyId,
          type: item.type,
          scheduled_at: item.scheduledAt,
          status: item.status,
          priority: null,
          retry_count: item.retryCount,
          error_message: item.errorMessage,
          created_at: null,
          survey: {
            customer_name: item.customerName,
            customer_email: item.customerEmail,
            loan_officer: {
              full_name: item.loanOfficerName,
            },
          },
        })));

        // Calculate stats from queue
        const newStats: Stats = {
          pending: 0,
          processing: 0,
          sent: 0,
          failed: 0,
        };
        items.forEach((item) => {
          const status = (item.status || "pending") as keyof Stats;
          if (status in newStats) {
            newStats[status]++;
          }
        });
        setStats(newStats);
      }

      if (surveysResult.success && surveysResult.data) {
        const surveysList = surveysResult.data.surveys;
        setSurveys(surveysList.map((survey) => ({
          id: survey.id,
          customer_name: survey.customerName,
          customer_email: survey.customerEmail,
          status: survey.status,
          sent_at: survey.sentAt,
          created_at: survey.createdAt,
          source: survey.source,
          loan_officer: {
            full_name: survey.loanOfficerName,
          },
        })));
      }
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResend = async (surveyId: string) => {
    setResendingId(surveyId);
    const result = await resendSurvey(surveyId);
    setResendingId(null);

    if (result.success) {
      toast({
        title: "Survey resent",
        description: "The survey invitation has been sent again.",
      });
      loadData();
    } else {
      toast({
        title: "Failed to resend",
        description: result.error || "Could not resend the survey",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <AlertCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="secondary">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "initial":
        return <Badge variant="default">Initial</Badge>;
      case "reminder_3day":
        return <Badge variant="secondary">3-Day Reminder</Badge>;
      case "reminder_7day":
        return <Badge variant="secondary">7-Day Reminder</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Send Survey button */}
      <div className="flex justify-end">
        <SendSurveyDialog onSuccess={loadData} />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting delivery
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">
              Being sent now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              Delivery failed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Queue and Recent Surveys */}
      <Card>
        <Tabs defaultValue="queue" className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="queue" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Distribution Queue
                </TabsTrigger>
                <TabsTrigger value="surveys" className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Recent Surveys
                </TabsTrigger>
                <TabsTrigger value="webhooks" className="flex items-center gap-2">
                  <Webhook className="h-4 w-4" />
                  Webhook Logs
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isPending}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <TabsContent value="queue" className="m-0">
            <CardContent>
              {queueItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No items in distribution queue</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queueItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {item.survey?.customer_name || "Unknown Customer"}
                          </span>
                          {getTypeBadge(item.type)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.survey?.customer_email}
                          {item.survey?.loan_officer && (
                            <span> - LO: {item.survey.loan_officer.full_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Scheduled: {formatDistanceToNow(new Date(item.scheduled_at), { addSuffix: true })}
                          {item.retry_count && item.retry_count > 0 && (
                            <span className="ml-2 text-orange-600">
                              (Retry #{item.retry_count})
                            </span>
                          )}
                        </div>
                        {item.error_message && (
                          <div className="text-xs text-red-600">
                            Error: {item.error_message}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="surveys" className="m-0">
            <CardContent>
              {surveys.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Send className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent surveys found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {surveys.map((survey) => (
                    <div
                      key={survey.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{survey.customer_name}</span>
                          {survey.source && (
                            <Badge variant="outline" className="text-xs">
                              {survey.source}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {survey.customer_email}
                          {survey.loan_officer && (
                            <span> - LO: {survey.loan_officer.full_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {survey.sent_at
                            ? `Sent ${formatDistanceToNow(new Date(survey.sent_at), { addSuffix: true })}`
                            : `Created ${formatDistanceToNow(new Date(survey.created_at || ""), { addSuffix: true })}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(survey.status === "sent" || survey.status === "pending") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResend(survey.id)}
                            disabled={resendingId === survey.id}
                          >
                            {resendingId === survey.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <RotateCcw className="h-4 w-4" />
                            )}
                            <span className="ml-1 hidden sm:inline">Resend</span>
                          </Button>
                        )}
                        {getStatusBadge(survey.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="webhooks" className="m-0">
            <CardContent>
              <WebhookLogsList />
            </CardContent>
          </TabsContent>

          <TabsContent value="settings" className="m-0">
            <CardContent>
              <WebhookConfigManager />
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

function WebhookLogsList() {
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState<WebhookLog[]>([]);

  interface WebhookLog {
    id: string;
    event_type: string;
    status: string | null;
    created_at: string | null;
    processing_time_ms: number | null;
    error_message: string | null;
    ip_address: string | null;
  }

  useEffect(() => {
    startTransition(async () => {
      // Fetch webhook logs using a server action
      const response = await fetch("/api/distribution/webhook-logs");
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    });
  }, []);

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "received":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            Received
          </Badge>
        );
      case "processed":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Processed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            Failed
          </Badge>
        );
      case "ignored":
        return (
          <Badge variant="secondary">
            Ignored
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  if (isPending) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
        <p>Loading webhook logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No webhook logs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between p-4 border rounded-lg"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium font-mono text-sm">{log.event_type}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {log.created_at && formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
              {log.processing_time_ms && (
                <span className="ml-2">({log.processing_time_ms}ms)</span>
              )}
              {log.ip_address && (
                <span className="ml-2">from {log.ip_address}</span>
              )}
            </div>
            {log.error_message && (
              <div className="text-xs text-red-600">{log.error_message}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(log.status)}
          </div>
        </div>
      ))}
    </div>
  );
}
