"use client";

import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  generateMockABEvents,
  computeABTestMetrics,
  computePageMetrics,
  computeTrafficSources,
  computeSwitchingFromDistribution,
  abTestConfigs,
} from "@/lib/ab-testing";
import type {
  ABTestMetrics,
  CompetitorPageMetrics,
  TrafficSourceBreakdown,
} from "@/lib/ab-testing";

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-medium uppercase tracking-wider">
          {title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page Comparison Table
// ---------------------------------------------------------------------------

function PageComparisonTable({
  pages,
}: {
  pages: CompetitorPageMetrics[];
}) {
  if (pages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No page data available yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Page</TableHead>
            <TableHead className="text-right">Visits</TableHead>
            <TableHead className="text-right">Bounce Rate</TableHead>
            <TableHead className="text-right">CTA Clicks</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Demos</TableHead>
            <TableHead className="text-right">Conv. Rate</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.slug}>
              <TableCell className="font-medium">
                {page.competitorName}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {page.visits.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {page.bounceRate.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {page.ctaClicks.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(page.ctr * 100).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {page.demoConversions}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {(page.conversionRate * 100).toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// A/B Test Results Table
// ---------------------------------------------------------------------------

const TEST_TYPE_LABELS: Record<ABTestMetrics["testType"], string> = {
  h1: "Headline Test",
  cta_copy: "CTA Copy Test",
  cta_color: "CTA Color Test",
};

function ABTestResultsTable({ tests }: { tests: ABTestMetrics[] }) {
  if (tests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No active A/B tests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {tests.map((test) => (
        <Card key={test.testId}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{test.testName}</CardTitle>
                <CardDescription className="text-xs">
                  {TEST_TYPE_LABELS[test.testType]}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {test.isSignificant ? (
                  <Badge variant="default" className="bg-green-600">
                    Significant
                  </Badge>
                ) : (
                  <Badge variant="secondary">Gathering data</Badge>
                )}
                {test.winner && (
                  <Badge variant="outline">
                    Winner: Variant {test.winner}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Variant</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">CTA Clicks</TableHead>
                    <TableHead className="text-right">CTR</TableHead>
                    <TableHead className="text-right">Demos</TableHead>
                    <TableHead className="text-right">Conv. Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[test.variantA, test.variantB].map((v) => (
                    <TableRow
                      key={v.variant}
                      className={
                        test.winner === v.variant
                          ? "bg-green-50 dark:bg-green-950/20"
                          : ""
                      }
                    >
                      <TableCell className="font-medium">
                        Variant {v.variant}
                        {test.winner === v.variant && (
                          <span className="ml-2 text-green-600">*</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.views.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.ctaClicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(v.ctr * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {v.demosBooked}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(v.conversionRate * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Traffic Source Breakdown
// ---------------------------------------------------------------------------

function TrafficSourcesCard({
  sources,
  title,
}: {
  sources: TrafficSourceBreakdown[];
  title: string;
}) {
  if (sources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-sm text-muted-foreground">
            No data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxVisits = Math.max(...sources.map((s) => s.visits));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sources.map((source) => (
            <div key={source.source} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize">
                  {source.source.replace(/_/g, " ")}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {source.visits.toLocaleString()} ({source.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${(source.visits / maxVisits) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Test Config Summary
// ---------------------------------------------------------------------------

function EnabledBadge({ enabled }: { enabled: boolean }) {
  if (enabled) {
    return <Badge variant="default" className="bg-green-600">On</Badge>;
  }
  return <Badge variant="secondary">Off</Badge>;
}

function TestConfigSummary() {
  const configs = Object.values(abTestConfigs);
  const activeCount = configs.reduce((sum, c) => {
    return sum
      + (c.h1Test?.enabled ? 1 : 0)
      + (c.ctaCopyTest?.enabled ? 1 : 0)
      + (c.ctaColorTest?.enabled ? 1 : 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Active Test Configuration</CardTitle>
        <CardDescription>
          {activeCount} active tests across {configs.length} pages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="text-center">H1 Test</TableHead>
                <TableHead className="text-center">CTA Copy</TableHead>
                <TableHead className="text-center">CTA Color</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.slug}>
                  <TableCell className="font-medium">
                    {config.slug.replace("-alternative", "")}
                  </TableCell>
                  <TableCell className="text-center">
                    <EnabledBadge enabled={config.h1Test?.enabled ?? false} />
                  </TableCell>
                  <TableCell className="text-center">
                    <EnabledBadge enabled={config.ctaCopyTest?.enabled ?? false} />
                  </TableCell>
                  <TableCell className="text-center">
                    <EnabledBadge enabled={config.ctaColorTest?.enabled ?? false} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

const DAYS_MAP = { "7d": 7, "14d": 14, "30d": 30 } as const;

function filterByDateRange(
  events: import("@/lib/ab-testing").ABTestEvent[],
  range: "7d" | "14d" | "30d",
): import("@/lib/ab-testing").ABTestEvent[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_MAP[range]);
  return events.filter((e) => new Date(e.timestamp) >= cutoff);
}

export function CompetitorPagesAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<"7d" | "14d" | "30d">("30d");

  const events = useMemo(() => generateMockABEvents(3000), []);

  // Filter computed outside useMemo to avoid impure Date call inside memo
  const filteredEvents = filterByDateRange(events, dateRange);

  const pageMetrics = useMemo(
    () => computePageMetrics(filteredEvents),
    [filteredEvents],
  );
  const testMetrics = useMemo(
    () => computeABTestMetrics(filteredEvents),
    [filteredEvents],
  );
  const trafficSources = useMemo(
    () => computeTrafficSources(filteredEvents),
    [filteredEvents],
  );
  const switchingFromDist = useMemo(
    () => computeSwitchingFromDistribution(filteredEvents),
    [filteredEvents],
  );

  const totalVisits = pageMetrics.reduce((sum, p) => sum + p.visits, 0);
  const totalClicks = pageMetrics.reduce((sum, p) => sum + p.ctaClicks, 0);
  const totalDemos = pageMetrics.reduce(
    (sum, p) => sum + p.demoConversions,
    0,
  );
  const overallCtr = totalVisits > 0 ? (totalClicks / totalVisits) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Date range selector */}
      <div className="flex items-center justify-end">
        <Select
          value={dateRange}
          onValueChange={(v) => setDateRange(v as "7d" | "14d" | "30d")}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Visits"
          value={totalVisits.toLocaleString()}
          description={`Across ${pageMetrics.length} comparison pages`}
        />
        <StatCard
          title="CTA Clicks"
          value={totalClicks.toLocaleString()}
          description={`${overallCtr.toFixed(1)}% click-through rate`}
        />
        <StatCard
          title="Demos Booked"
          value={totalDemos.toLocaleString()}
          description={
            totalVisits > 0
              ? `${((totalDemos / totalVisits) * 100).toFixed(2)}% conversion`
              : "No data"
          }
        />
        <StatCard
          title="Active A/B Tests"
          value={testMetrics.length.toString()}
          description={`${testMetrics.filter((t) => t.isSignificant).length} with significant results`}
        />
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Comparison</CardTitle>
              <CardDescription>
                Metrics across all competitor comparison pages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PageComparisonTable pages={pageMetrics} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* A/B Tests Tab */}
        <TabsContent value="ab-tests" className="space-y-6">
          <ABTestResultsTable tests={testMetrics} />
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <TrafficSourcesCard
              sources={trafficSources}
              title="Traffic Source Breakdown"
            />
            <TrafficSourcesCard
              sources={switchingFromDist}
              title="Switching From Distribution"
            />
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <TestConfigSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
}
