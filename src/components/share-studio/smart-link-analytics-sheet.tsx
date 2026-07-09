"use client";

import { useEffect, useMemo, useState, useTransition, type ReactNode } from "react";
import {
  ArrowSquareOut,
  ChartLine,
  CursorClick,
  Eye,
  LinkSimple,
} from "@phosphor-icons/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CHART_COLORS,
  CHART_TOOLTIP_STYLE,
} from "@/components/analytics/chart-primitives";
import { SmartLinkQRCode } from "@/components/share-studio/smart-link-qr-code";
import { getSmartLinkAnalytics } from "@/lib/share-studio/actions";
import type {
  SmartLinkAnalyticsResult,
  SmartLinkRow,
} from "@/lib/share-studio/hub-types";

interface SmartLinkAnalyticsSheetProps {
  link: SmartLinkRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

function formatDateLabel(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusBadge(link: SmartLinkRow) {
  if (link.archivedAt) {
    return <Badge variant="secondary">Archived</Badge>;
  }
  if (link.published) {
    return <Badge className="bg-emerald-600">Live</Badge>;
  }
  return <Badge variant="secondary">Unpublished</Badge>;
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-heading">{value}</p>
    </div>
  );
}

export function SmartLinkAnalyticsSheet({
  link,
  open,
  onOpenChange,
}: SmartLinkAnalyticsSheetProps) {
  const [isPending, startTransition] = useTransition();
  const [loadState, setLoadState] = useState<{
    linkId: string | null;
    analytics: SmartLinkAnalyticsResult | null;
    error: string | null;
  }>({ linkId: null, analytics: null, error: null });

  useEffect(() => {
    if (!open || !link) return;

    let cancelled = false;

    startTransition(async () => {
      const result = await getSmartLinkAnalytics(link.id);
      if (cancelled) return;

      if (result.success && result.data) {
        setLoadState({
          linkId: link.id,
          analytics: result.data,
          error: null,
        });
      } else {
        setLoadState({
          linkId: link.id,
          analytics: null,
          error: result.error || "Failed to load analytics",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [link, open]);

  const shareUrl = useMemo(() => (link ? absoluteUrl(link.urlPath) : ""), [link]);
  const analytics = loadState.linkId === link?.id ? loadState.analytics : null;
  const error = loadState.linkId === link?.id ? loadState.error : null;
  const hasEvents = Boolean(
    analytics && (analytics.totals.views > 0 || analytics.totals.clicks > 0)
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="pr-8 text-left">
          <SheetTitle className="flex items-center gap-2 text-heading">
            <ChartLine className="h-5 w-5 text-repwell-teal-300" />
            Smart Link Analytics
          </SheetTitle>
          <SheetDescription>
            {link ? link.title : "Choose a Smart Link to inspect its performance."}
          </SheetDescription>
        </SheetHeader>

        {!link ? null : (
          <div className="mt-6 space-y-6">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <LinkSimple className="h-4 w-4 text-repwell-teal-300" />
                    <code className="truncate text-sm">{link.urlPath}</code>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {link.source?.customerName || link.source?.title || "No source name"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusBadge(link)}
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={shareUrl} target="_blank" rel="noreferrer">
                      <ArrowSquareOut className="h-3.5 w-3.5" />
                      Open
                    </a>
                  </Button>
                </div>
              </div>
              {link.destinationUrl ? (
                <p className="truncate text-xs text-muted-foreground">
                  Destination: {link.destinationUrl}
                </p>
              ) : null}
            </div>

            {isPending && !analytics ? (
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-xl" />
                  ))}
                </div>
                <Skeleton className="h-[260px] rounded-xl" />
              </div>
            ) : null}

            {error ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {analytics ? (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricTile
                    label="Views"
                    value={analytics.totals.views.toLocaleString()}
                    icon={<Eye className="h-3.5 w-3.5" />}
                  />
                  <MetricTile
                    label="Clicks"
                    value={analytics.totals.clicks.toLocaleString()}
                    icon={<CursorClick className="h-3.5 w-3.5" />}
                  />
                  <MetricTile
                    label="CTR"
                    value={`${analytics.totals.ctr}%`}
                    icon={<ChartLine className="h-3.5 w-3.5" />}
                  />
                </div>

                <div className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-heading">
                      30-day performance
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Views and clicks from the daily Share Studio aggregate.
                    </p>
                  </div>

                  {!hasEvents ? (
                    <div className="flex h-[240px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-center">
                      <div>
                        <ChartLine className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No analytics yet
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[260px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.series}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="hsl(var(--border))"
                          />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDateLabel}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 12,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                            dy={10}
                          />
                          <YAxis
                            allowDecimals={false}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fontSize: 12,
                              fill: "hsl(var(--muted-foreground))",
                            }}
                          />
                          <Tooltip
                            contentStyle={CHART_TOOLTIP_STYLE}
                            labelFormatter={(label) => formatDateLabel(String(label))}
                          />
                          <Line
                            type="monotone"
                            dataKey="views"
                            name="Views"
                            stroke={CHART_COLORS[0]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="clicks"
                            name="Clicks"
                            stroke={CHART_COLORS[1]}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
                  <div className="rounded-xl border border-border/60 bg-card p-4">
                    <h3 className="mb-3 text-sm font-semibold text-heading">
                      Top referrers
                    </h3>
                    {analytics.referrers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No referrers recorded in the last 30 days.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.referrers.map((referrer, index) => (
                          <div
                            key={referrer.referrer}
                            className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm"
                          >
                            <span className="min-w-0 truncate">
                              {index + 1}. {referrer.referrer}
                            </span>
                            <span className="font-medium tabular-nums text-heading">
                              {referrer.count.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <SmartLinkQRCode
                    url={shareUrl}
                    title="Smart Link QR"
                    className="border border-border/60"
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
