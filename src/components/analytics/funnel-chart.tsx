"use client";

import { memo, useMemo } from "react";
import {
  PaperPlaneRight,
  Eye,
  CheckCircle,
  ThumbsUp,
  XCircle,
  Warning,
  ArrowRight,
  Clock,
  ChartBar,
} from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { VideoTestimonialFunnelMetrics } from "@/lib/video-testimonials/analytics-actions";

// ============================================================================
// Funnel Stage Card
// ============================================================================

export const FunnelStageCard = memo(function FunnelStageCard({
  label,
  value,
  icon: Icon,
  conversionRate,
  description,
}: {
  label: string;
  value: number;
  icon: typeof PaperPlaneRight;
  conversionRate?: number;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4" role="listitem">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-repwell-teal-300/10" aria-hidden="true">
        <Icon className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
      </div>
      <div>
        <p className="text-2xl font-semibold tracking-tight text-repwell-teal-500">{value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {conversionRate !== undefined && (
          <Badge variant="outline" className="mt-1 font-mono text-xs">{conversionRate}%</Badge>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// Funnel Visualization
// ============================================================================

export const FunnelVisualization = memo(function FunnelVisualization({
  metrics,
}: {
  metrics: VideoTestimonialFunnelMetrics;
}) {
  const stages = useMemo(() => [
    { label: "Sent", value: metrics.sent, color: "bg-repwell-teal-300" },
    { label: "Opened", value: metrics.opened, color: "bg-repwell-sage-200" },
    { label: "Completed", value: metrics.completed, color: "bg-primary" },
    { label: "Approved", value: metrics.approved, color: "bg-repwell-sage-200" },
    { label: "Published", value: metrics.published, color: "bg-repwell-teal-400" },
  ], [metrics.sent, metrics.opened, metrics.completed, metrics.approved, metrics.published]);

  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <ChartBar className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Video Funnel Overview</CardTitle>
            <CardDescription>Video testimonial journey from request to publication</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6" role="figure" aria-label="Review funnel chart">
        <div className="space-y-4" role="list" aria-label="Video testimonial funnel stages">
          {stages.map((stage, index) => {
            const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
            const nextStage = stages[index + 1];
            const conversionToNext = nextStage && stage.value > 0
              ? Math.round((nextStage.value / stage.value) * 100) : null;

            return (
              <div key={stage.label} className="space-y-2" role="listitem">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{stage.label}</span>
                  <span className="font-mono text-muted-foreground">{stage.value.toLocaleString()}</span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-8" aria-label={`${stage.label} progress: ${stage.value} of ${maxValue}`} />
                  <div className={cn("absolute inset-y-0 left-0 rounded-full", stage.color)} style={{ width: `${percentage}%` }} aria-hidden="true" />
                </div>
                {conversionToNext !== null && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    <span>{conversionToNext}% convert to {nextStage.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-4">
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="h-4 w-4 text-red-500" aria-hidden="true" />
            <span className="text-muted-foreground">Expired:</span>
            <span className="font-medium">{metrics.expiredCount}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Warning className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span className="text-muted-foreground">Cancelled:</span>
            <span className="font-medium">{metrics.cancelledCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Conversion Rate Cards
// ============================================================================

export const ConversionRateCards = memo(function ConversionRateCards({
  metrics,
}: {
  metrics: VideoTestimonialFunnelMetrics;
}) {
  const rates = useMemo(() => [
    { label: "Sent to Opened", value: metrics.sentToOpenedRate, description: "Email open rate", target: 60 },
    { label: "Opened to Completed", value: metrics.openedToCompletedRate, description: "Video completion rate", target: 40 },
    { label: "Completed to Approved", value: metrics.completedToApprovedRate, description: "Approval rate", target: 80 },
    { label: "Approved to Published", value: metrics.approvedToPublishedRate, description: "Publication rate", target: 90 },
  ], [metrics.sentToOpenedRate, metrics.openedToCompletedRate, metrics.completedToApprovedRate, metrics.approvedToPublishedRate]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" role="list" aria-label="Conversion rates">
      {rates.map((rate) => {
        const isAboveTarget = rate.value >= rate.target;
        return (
          <Card key={rate.label} role="listitem" className="shadow-soft">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">{rate.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{rate.value}%</span>
                  {isAboveTarget ? (
                    <Badge variant="secondary" className="bg-repwell-sage-200/20 text-repwell-sage-200 border border-repwell-sage-200/30">On track</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 border border-amber-200">Below target</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{rate.description}</p>
                <Progress
                  value={Math.min(rate.value, 100)}
                  className={cn("h-2", isAboveTarget ? "[&>div]:bg-repwell-sage-200" : "[&>div]:bg-amber-500")}
                  aria-label={`${rate.label}: ${rate.value}% of ${rate.target}% target`}
                />
                <p className="text-xs text-muted-foreground">Target: {rate.target}%</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
});

// ============================================================================
// Time Metrics Cards
// ============================================================================

export const TimeMetricsCards = memo(function TimeMetricsCards({
  metrics,
}: {
  metrics: VideoTestimonialFunnelMetrics;
}) {
  const formatTime = (hours: number | null) => {
    if (hours === null) return "N/A";
    if (hours < 1) return "< 1 hour";
    if (hours < 24) return `${hours} hours`;
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  const timeMetrics = useMemo(() => [
    { label: "Avg. Time to Open", value: metrics.averageTimeToOpen, icon: Eye, description: "From sent to first open" },
    { label: "Avg. Time to Complete", value: metrics.averageTimeToComplete, icon: CheckCircle, description: "From open to video submission" },
    { label: "Avg. Approval Time", value: metrics.averageApprovalTime, icon: ThumbsUp, description: "From submission to approval" },
  ], [metrics.averageTimeToOpen, metrics.averageTimeToComplete, metrics.averageApprovalTime]);

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Clock className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-lg">Processing Times</CardTitle>
            <CardDescription>Average time between funnel stages</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-3" role="list" aria-label="Processing time metrics">
          {timeMetrics.map((metric) => (
            <div key={metric.label} className="flex items-start gap-3 rounded-lg border p-4" role="listitem">
              <metric.icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <div className="space-y-1">
                <p className="text-sm font-medium">{metric.label}</p>
                <p className="text-2xl font-bold">{formatTime(metric.value)}</p>
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
