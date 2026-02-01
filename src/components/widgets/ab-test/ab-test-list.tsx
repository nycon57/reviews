"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listAbTests, type AbTestSummary } from "@/lib/widgets/ab-testing";
import type { ConfidenceLevel } from "@/lib/widgets/ab-statistics";

function statusBadge(status: string) {
  if (status === "running") {
    return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Running</Badge>;
  }
  if (status === "completed") {
    return <Badge variant="secondary">Completed</Badge>;
  }
  return <Badge variant="outline">Cancelled</Badge>;
}

function confidenceLabel(level: ConfidenceLevel): string {
  const map: Record<ConfidenceLevel, string> = {
    not_enough_data: "Collecting data",
    no_significance: "No significance",
    "90_confident": "90% confident",
    "95_confident": "95% confident",
    "99_confident": "99% confident",
  };
  return map[level];
}

function formatCtr(clicks: number, impressions: number): string {
  if (impressions === 0) return "—";
  return ((clicks / impressions) * 100).toFixed(2) + "%";
}

export function AbTestList() {
  const [tests, setTests] = useState<AbTestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      const result = await listAbTests();
      if (result.success) {
        setTests(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading A/B tests...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (tests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-2">No A/B tests yet</p>
          <p className="text-sm text-muted-foreground">
            Create an A/B test from any widget&rsquo;s settings to start comparing variants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">A/B Tests</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Widget</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Split</TableHead>
              <TableHead className="text-right">CTR (A)</TableHead>
              <TableHead className="text-right">CTR (B)</TableHead>
              <TableHead>Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.map((test) => (
              <TableRow key={test.testId}>
                <TableCell>
                  <Link
                    href={`/dashboard/widgets/${test.parentWidgetId}/ab-test`}
                    className="font-medium hover:underline"
                  >
                    {test.parentWidgetName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{test.widgetType.replace(/_/g, " ")}</p>
                </TableCell>
                <TableCell>{statusBadge(test.status)}</TableCell>
                <TableCell className="tabular-nums">{test.daysRunning}d</TableCell>
                <TableCell className="tabular-nums text-sm">
                  {100 - test.splitPercent}/{test.splitPercent}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCtr(test.variantA.clicks, test.variantA.impressions)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCtr(test.variantB.clicks, test.variantB.impressions)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {confidenceLabel(test.significance.confidence)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
