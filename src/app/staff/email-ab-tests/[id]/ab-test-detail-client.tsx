"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Flask as FlaskConical,
  ArrowLeft,
  DotsThree as MoreHorizontal,
  Play,
  Pause,
  Square,
  Pencil,
  Trash as Trash2,
  Trophy,
  Clock,
  Target,
  TrendUp as TrendingUp,
  Users,
  Envelope as Mail,
  CursorClick as MousePointerClick,
  Eye,
  SpinnerGap as Loader2,
  WarningCircle as AlertCircle,
  CheckCircle as CheckCircle2,
  Info,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import {
  type ABTestWithResults,
  startABTest,
  stopABTest,
  pauseABTest,
  resumeABTest,
  deleteABTest,
  declareWinner,
  applyWinnerToFuture,
  getTestTypeDisplayName,
  getWinningMetricDisplayName,
  formatRate,
  formatConfidenceLevel,
  calculateStatisticalSignificance,
  calculateUplift,
} from "@/lib/email-ab-testing";
import {
  VariantComparisonTable,
  ABTestResultsChart,
  MetricsComparisonChart,
  StatusBadge,
} from "@/components/admin/email-ab-tests";

// =============================================================================
// INFO ROW COMPONENT
// =============================================================================

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface ABTestDetailClientProps {
  test: ABTestWithResults;
}

export function ABTestDetailClient({ test: initialTest }: ABTestDetailClientProps) {
  const router = useRouter();
  const [test] = useState(initialTest);
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [winnerDialogOpen, setWinnerDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  // Find control variant
  const controlVariant = test.variants.find((v) => v.isControl);
  const controlResult = test.results.find((r) => r.variant === controlVariant?.id);

  // Calculate statistical significance for each non-control variant vs control
  const significanceData = test.results
    .filter((r) => r.variant !== controlVariant?.id)
    .map((variantResult) => {
      if (!controlResult) return null;

      const metricKey = test.winningMetric === "open_rate" ? "openRate" : "clickRate";
      const controlSuccesses =
        test.winningMetric === "open_rate"
          ? controlResult.emailsOpened
          : controlResult.emailsClicked;
      const variantSuccesses =
        test.winningMetric === "open_rate"
          ? variantResult.emailsOpened
          : variantResult.emailsClicked;

      const significance = calculateStatisticalSignificance(
        { successes: controlSuccesses, trials: controlResult.emailsDelivered },
        { successes: variantSuccesses, trials: variantResult.emailsDelivered },
        test.winningMetric,
        test.confidenceLevel
      );

      return {
        variant: variantResult.variant,
        ...significance,
        uplift: calculateUplift(
          controlResult[metricKey] as number,
          variantResult[metricKey] as number
        ),
      };
    })
    .filter(Boolean);

  // Handlers
  const handleStart = () => {
    startTransition(async () => {
      const result = await startABTest(test.id);
      if (result.success) {
        toast({ title: "Test started successfully" });
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to start test", variant: "destructive" });
      }
    });
  };

  const handlePause = () => {
    startTransition(async () => {
      const result = await pauseABTest(test.id);
      if (result.success) {
        toast({ title: "Test paused" });
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to pause test", variant: "destructive" });
      }
    });
  };

  const handleResume = () => {
    startTransition(async () => {
      const result = await resumeABTest(test.id);
      if (result.success) {
        toast({ title: "Test resumed" });
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to resume test", variant: "destructive" });
      }
    });
  };

  const handleStop = () => {
    startTransition(async () => {
      const result = await stopABTest(test.id);
      if (result.success) {
        toast({ title: "Test stopped" });
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to stop test", variant: "destructive" });
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteABTest(test.id);
      if (result.success) {
        toast({ title: "Test deleted" });
        router.push("/staff/email-ab-tests");
      } else {
        toast({ title: result.error || "Failed to delete test", variant: "destructive" });
      }
    });
  };

  const handleDeclareWinner = (variantId: string) => {
    setSelectedWinner(variantId);
    setWinnerDialogOpen(true);
  };

  const confirmDeclareWinner = () => {
    if (!selectedWinner) return;

    startTransition(async () => {
      const result = await declareWinner({
        testId: test.id,
        variantId: selectedWinner,
        autoWinner: false,
        reason: "Manually declared by admin",
      });
      if (result.success) {
        toast({ title: `Variant ${selectedWinner} declared as winner` });
        setWinnerDialogOpen(false);
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to declare winner", variant: "destructive" });
      }
    });
  };

  const handleApplyWinner = () => {
    startTransition(async () => {
      const result = await applyWinnerToFuture(test.id);
      if (result.success) {
        toast({ title: result.data?.message ?? "Winner applied to future sends" });
        router.refresh();
      } else {
        toast({ title: result.error || "Failed to apply winner", variant: "destructive" });
      }
    });
  };

  // Calculate total stats
  const totalSent = test.results.reduce((sum, r) => sum + r.emailsSent, 0);
  const totalOpened = test.results.reduce((sum, r) => sum + r.emailsOpened, 0);
  const totalClicked = test.results.reduce((sum, r) => sum + r.emailsClicked, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link href="/staff/email-ab-tests">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <FlaskConical className="h-6 w-6 text-repwell-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-heading">{test.name}</h1>
                <StatusBadge status={test.status} />
              </div>
              {test.description && (
                <p className="text-sm leading-snug text-repwell-teal-300">{test.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {test.status === "draft" && (
            <Button onClick={handleStart} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
              Start Test
            </Button>
          )}
          {test.status === "active" && (
            <>
              <Button variant="outline" onClick={handlePause} disabled={isPending}>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
              <Button variant="destructive" onClick={handleStop} disabled={isPending}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
          {test.status === "paused" && (
            <>
              <Button onClick={handleResume} disabled={isPending}>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
              <Button variant="destructive" onClick={handleStop} disabled={isPending}>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Test actions">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {test.status === "draft" && (
                <DropdownMenuItem asChild>
                  <Link href={`/staff/email-ab-tests/${test.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Test
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Test
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Winner Banner */}
      {test.winnerVariant && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Trophy className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">
                  Winner: Variant {test.winnerVariant}
                </h3>
                <p className="text-sm text-amber-700">
                  {test.winnerAuto ? "Automatically declared" : "Manually declared"}
                  {test.winnerDeclaredAt && ` on ${format(new Date(test.winnerDeclaredAt), "PPp")}`}
                  {test.winnerReason && ` — ${test.winnerReason}`}
                </p>
                {test.winnerAppliedAt && (
                  <p className="mt-1 text-sm text-amber-700">
                    Applied to future {test.emailType} sends on{" "}
                    {format(new Date(test.winnerAppliedAt), "PPp")}.
                  </p>
                )}
              </div>
              {test.winnerAppliedAt ? (
                <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Applied
                </Badge>
              ) : (
                <Button onClick={handleApplyWinner} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Apply to future sends
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Sent
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSent.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Opens
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOpened.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSent > 0 ? formatRate(totalOpened / totalSent) : "0%"} avg rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Clicks
                </CardTitle>
                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalClicked.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {totalSent > 0 ? formatRate(totalClicked / totalSent) : "0%"} avg rate
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Duration
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {test.startedAt
                    ? formatDistanceToNow(new Date(test.startedAt), { addSuffix: false })
                    : "Not started"}
                </div>
                {test.endedAt && (
                  <p className="text-xs text-muted-foreground">
                    Ended {format(new Date(test.endedAt), "MMM d, yyyy")}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Chart */}
          {test.results.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-2">
              <ABTestResultsChart
                results={test.results}
                metric={test.winningMetric}
                winnerVariant={test.winnerVariant ?? null}
              />
              <MetricsComparisonChart results={test.results} winnerVariant={test.winnerVariant ?? null} />
            </div>
          )}

          {/* Variant Comparison */}
          {test.results.length > 0 && (
            <VariantComparisonTable
              results={test.results}
              winningMetric={test.winningMetric}
              winnerVariant={test.winnerVariant ?? null}
              confidenceLevel={test.confidenceLevel}
              minSampleSize={test.minSampleSize}
              onDeclareWinner={
                test.status === "completed" && !test.winnerVariant
                  ? handleDeclareWinner
                  : undefined
              }
            />
          )}

          {/* Statistical Significance Analysis */}
          {significanceData.length > 0 && controlResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistical Analysis
                </CardTitle>
                <CardDescription>
                  Comparing variants against control (Variant {controlVariant?.id}) using{" "}
                  {getWinningMetricDisplayName(test.winningMetric)} at{" "}
                  {formatConfidenceLevel(test.confidenceLevel)} confidence level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {significanceData.map((data) => {
                    if (!data) return null;
                    return (
                      <div
                        key={data.variant}
                        className={cn(
                          "p-4 rounded-lg border",
                          data.isSignificant ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800/50" : "bg-muted"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">Variant {data.variant} vs Control</h4>
                          <Badge
                            variant={data.isSignificant ? "default" : "secondary"}
                            className={data.isSignificant ? "bg-green-600" : ""}
                          >
                            {data.isSignificant ? "Significant" : "Not Significant"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Uplift</span>
                            <p
                              className={cn(
                                "font-medium",
                                data.uplift > 0 ? "text-green-600" : data.uplift < 0 ? "text-red-600" : ""
                              )}
                            >
                              {data.uplift > 0 ? "+" : ""}
                              {data.uplift}%
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">P-Value</span>
                            <p className="font-medium">{data.pValue.toFixed(4)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Z-Score</span>
                            <p className="font-medium">{data.zScore.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sample Size</span>
                            <p className="font-medium">{data.sampleSizeB.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results Yet */}
          {test.results.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No results yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {test.status === "draft"
                    ? "Start the test to begin collecting data"
                    : "Results will appear once emails are sent"}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {test.results.length > 0 ? (
            <>
              <VariantComparisonTable
                results={test.results}
                winningMetric={test.winningMetric}
                winnerVariant={test.winnerVariant ?? null}
                confidenceLevel={test.confidenceLevel}
                minSampleSize={test.minSampleSize}
                onDeclareWinner={
                  test.status === "completed" && !test.winnerVariant
                    ? handleDeclareWinner
                    : undefined
                }
              />
              <div className="grid gap-6 lg:grid-cols-2">
                <ABTestResultsChart
                  results={test.results}
                  metric={test.winningMetric}
                  winnerVariant={test.winnerVariant ?? null}
                />
                <MetricsComparisonChart results={test.results} winnerVariant={test.winnerVariant ?? null} />
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Info className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium">No results yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Results will appear once emails are sent
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Test Details */}
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow icon={FlaskConical} label="Test Type" value={getTestTypeDisplayName(test.testType)} />
                <InfoRow icon={Target} label="Winning Metric" value={getWinningMetricDisplayName(test.winningMetric)} />
                <InfoRow icon={Mail} label="Email Type" value={test.emailType} />
                <InfoRow icon={Users} label="Variants" value={test.variants.length} />
                <Separator className="my-3" />
                <InfoRow
                  icon={CheckCircle2}
                  label="Auto Winner"
                  value={test.autoWinnerEnabled ? "Enabled" : "Disabled"}
                />
                <InfoRow icon={Target} label="Min Sample Size" value={test.minSampleSize.toLocaleString()} />
                <InfoRow icon={Clock} label="Test Duration" value={`${test.testDurationHours} hours`} />
                <InfoRow icon={TrendingUp} label="Confidence Level" value={formatConfidenceLevel(test.confidenceLevel)} />
              </CardContent>
            </Card>

            {/* Variants */}
            <Card>
              <CardHeader>
                <CardTitle>Variants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {test.variants.map((variant) => (
                    <div
                      key={variant.id}
                      className={cn(
                        "p-4 rounded-lg border",
                        variant.isControl && "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800/50"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={variant.isControl ? "default" : "outline"}>
                            {variant.id}
                          </Badge>
                          <span className="font-medium">{variant.name}</span>
                          {variant.isControl && (
                            <Badge variant="secondary" className="text-xs">
                              Control
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {test.trafficSplit[variant.id]}% traffic
                        </span>
                      </div>
                      {test.testType === "subject_line" && variant.subjectLine && (
                        <p className="text-sm text-muted-foreground">
                          Subject: {variant.subjectLine}
                        </p>
                      )}
                      {test.testType === "preview_text" && variant.previewText && (
                        <p className="text-sm text-muted-foreground">
                          Preview: {variant.previewText}
                        </p>
                      )}
                      {test.testType === "send_time" && variant.sendTimeOffsetHours !== undefined && (
                        <p className="text-sm text-muted-foreground">
                          Offset: {variant.sendTimeOffsetHours > 0 ? "+" : ""}
                          {variant.sendTimeOffsetHours} hours
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Created</span>
                    <p className="font-medium">{format(new Date(test.createdAt), "PPp")}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Started</span>
                    <p className="font-medium">
                      {test.startedAt ? format(new Date(test.startedAt), "PPp") : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Ended</span>
                    <p className="font-medium">
                      {test.endedAt ? format(new Date(test.endedAt), "PPp") : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Winner Declared</span>
                    <p className="font-medium">
                      {test.winnerDeclaredAt ? format(new Date(test.winnerDeclaredAt), "PPp") : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Dialog */}
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

      {/* Declare Winner Dialog */}
      <AlertDialog open={winnerDialogOpen} onOpenChange={setWinnerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Declare Winner
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to declare Variant {selectedWinner} as the winner?
              This will mark the test as completed and can be used to apply the winning
              variant to future emails.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeclareWinner}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Declaring...
                </>
              ) : (
                "Declare Winner"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
