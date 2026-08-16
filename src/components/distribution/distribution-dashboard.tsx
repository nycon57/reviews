"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  PaperPlaneRight as Send,
  WarningCircle as AlertCircle,
  CheckCircle as CheckCircle2,
  ArrowsClockwise as RefreshCw,
  Envelope as Mail,
  ArrowCounterClockwise as RotateCcw,
} from "@phosphor-icons/react";
import {
  getDistributionQueue,
  getSurveysForDistribution,
  resendSurvey,
} from "@/lib/distribution/actions";
import { SendReviewRequestDialog } from "@/components/requests/send-review-request-dialog";
import { Plus } from "@phosphor-icons/react";
import { useToast } from "@/hooks/use-toast";
import { AnimatedList, AnimatedItem } from "@/components/motion";
import { formatRelativeTime } from "@/lib/utils";

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
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
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
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="text-repwell-teal-300 border-repwell-teal-300/30 bg-repwell-teal-300/5">
            <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      case "sent":
        return (
          <Badge variant="outline" className="text-repwell-sage-200 border-repwell-sage-200/30 bg-repwell-sage-200/5">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
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
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Pending", sublabel: "Awaiting delivery", value: stats.pending, icon: Clock },
          { label: "Processing", sublabel: "Being sent now", value: stats.processing, icon: RefreshCw },
          { label: "Sent", sublabel: "Successfully delivered", value: stats.sent, icon: CheckCircle2 },
          { label: "Failed", sublabel: "Delivery failed", value: stats.failed, icon: AlertCircle },
        ].map((stat) => {
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
                <p className="text-2xl font-semibold tracking-tight text-heading">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs for Queue and Recent Surveys */}
      <Card className="border border-border shadow-soft">
        <Tabs defaultValue="queue" className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <TabsList className="bg-transparent p-0 h-auto gap-1 flex-wrap">
                <TabsTrigger value="queue" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Distribution</span> Queue
                </TabsTrigger>
                <TabsTrigger value="surveys" className="flex items-center gap-2 text-xs sm:text-sm">
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Recent</span> Surveys
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2 shrink-0">
                <Button onClick={() => setRequestDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Send Review Request
                </Button>
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
                <AnimatedList className="space-y-4">
                  {queueItems.map((item) => (
                    <AnimatedItem
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
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
                            <span> - Pro: {item.survey.loan_officer.full_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Scheduled: {formatRelativeTime(item.scheduled_at)}
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
                    </AnimatedItem>
                  ))}
                </AnimatedList>
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
                <AnimatedList className="space-y-4">
                  {surveys.map((survey) => (
                    <AnimatedItem
                      key={survey.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-card hover:bg-muted/30 transition-colors"
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
                            <span> - Pro: {survey.loan_officer.full_name}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {survey.sent_at
                            ? `Sent ${formatRelativeTime(survey.sent_at)}`
                            : `Created ${formatRelativeTime(survey.created_at || "")}`}
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
                    </AnimatedItem>
                  ))}
                </AnimatedList>
              )}
            </CardContent>
          </TabsContent>

        </Tabs>
      </Card>

      <SendReviewRequestDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        onSuccess={loadData}
      />
    </div>
  );
}
