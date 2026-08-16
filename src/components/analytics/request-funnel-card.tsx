"use client";

import { useState, useTransition, useCallback } from "react";
import { FunnelSimple, SpinnerGap } from "@phosphor-icons/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getRequestFunnelRollup,
  type RequestFunnelRollup,
  type FunnelMetrics,
} from "@/lib/analytics/request-funnel";

const WINDOWS = [30, 90] as const;

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function OrgTiles({ metrics }: { metrics: FunnelMetrics }) {
  const tiles = [
    { label: "Requests sent", value: metrics.requestsSent.toLocaleString() },
    { label: "Open rate", value: pct(metrics.openRate) },
    { label: "Submission rate", value: pct(metrics.submissionRate) },
    { label: "Published", value: metrics.published.toLocaleString() },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl border border-border/50 bg-card p-4"
        >
          <p className="text-2xl font-semibold tracking-tight text-heading-accent">
            {t.value}
          </p>
          <p className="text-xs text-muted-foreground">{t.label}</p>
        </div>
      ))}
    </div>
  );
}

export function RequestFunnelCard({
  initialRollup,
}: {
  initialRollup: RequestFunnelRollup;
}) {
  const [rollup, setRollup] = useState<RequestFunnelRollup>(initialRollup);
  const [pending, startTransition] = useTransition();

  const handleWindow = useCallback(
    (windowDays: number) => {
      if (windowDays === rollup.windowDays) return;
      startTransition(async () => {
        try {
          const next = await getRequestFunnelRollup(windowDays);
          setRollup(next);
        } catch {
          // Leave the current view in place on failure.
        }
      });
    },
    [rollup.windowDays]
  );

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <FunnelSimple className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Acquisition funnel</CardTitle>
              <CardDescription>
                Requests sent, opened, submitted, and published
              </CardDescription>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 p-0.5">
            {WINDOWS.map((w) => (
              <Button
                key={w}
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => handleWindow(w)}
                className={cn(
                  "h-7 px-3 text-xs",
                  rollup.windowDays === w
                    ? "bg-repwell-teal-300/10 text-repwell-teal-300"
                    : "text-muted-foreground"
                )}
              >
                {w}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className={cn("transition-opacity", pending && "opacity-60")}>
          <OrgTiles metrics={rollup.org} />
        </div>

        {rollup.professionals.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border/50">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-xs font-medium uppercase tracking-wider">
                    Professional
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider">
                    Sent
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider">
                    Open rate
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider">
                    Submission
                  </TableHead>
                  <TableHead className="text-right text-xs font-medium uppercase tracking-wider">
                    Published
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rollup.professionals.map((p) => (
                  <TableRow key={p.loanOfficerId}>
                    <TableCell className="font-medium text-heading">{p.name}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.requestsSent}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {pct(p.openRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {pct(p.submissionRate)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.published}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border/50 bg-muted/20 py-10 text-sm text-muted-foreground">
            {pending ? (
              <>
                <SpinnerGap className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>No acquisition activity in the last {rollup.windowDays} days.</>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
