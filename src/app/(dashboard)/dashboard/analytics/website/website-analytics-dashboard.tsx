"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  Clock,
  MousePointerClick,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  getWebsiteAnalytics,
  getWebsiteSEOOverview,
  runPageSEOAudit,
  type WebsiteAnalyticsOverview,
  type WebsiteSEOOverview,
  type AnalyticsPeriod,
} from "@/lib/website-analytics";

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100) / 100}%`;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBadge(score: number): { variant: "default" | "secondary" | "destructive"; label: string } {
  if (score >= 80) return { variant: "default", label: "Good" };
  if (score >= 60) return { variant: "secondary", label: "Needs Improvement" };
  return { variant: "destructive", label: "Poor" };
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="rounded-lg bg-brand-frost p-2">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span className={`text-xs font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
              {trend.value > 0 ? "+" : ""}{formatPercent(trend.value)}
            </span>
            <span className="text-xs text-muted-foreground">vs. previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ title, score, description }: { title: string; score: number; description?: string }) {
  const badge = getScoreBadge(score);
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
        <div className="flex items-end gap-2">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-sm text-muted-foreground mb-1">/100</span>
        </div>
        <Progress value={score} className="mt-2" />
        {description && (
          <p className="mt-2 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function TrafficSourcesChart({ data }: { data: WebsiteAnalyticsOverview["trafficSources"] }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const sources = [
    { key: "organic", label: "Organic Search", color: "bg-green-500" },
    { key: "direct", label: "Direct", color: "bg-blue-500" },
    { key: "referral", label: "Referral", color: "bg-purple-500" },
    { key: "social", label: "Social", color: "bg-pink-500" },
    { key: "email", label: "Email", color: "bg-amber-500" },
    { key: "paid", label: "Paid", color: "bg-red-500" },
  ] as const;

  return (
    <div className="space-y-3">
      {sources.map(({ key, label, color }) => {
        const value = data[key] || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        if (value === 0) return null;
        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{label}</span>
              <span className="text-muted-foreground">{formatPercent(percentage)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DeviceBreakdown({ data }: { data: WebsiteAnalyticsOverview["deviceBreakdown"] }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const devices = [
    { key: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" /> },
    { key: "mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" /> },
    { key: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="flex gap-4">
      {devices.map(({ key, label, icon }) => {
        const value = data[key] || 0;
        const percentage = total > 0 ? (value / total) * 100 : 0;
        return (
          <div key={key} className="flex-1 text-center p-3 rounded-lg bg-muted/50">
            <div className="flex justify-center mb-2 text-muted-foreground">{icon}</div>
            <p className="text-lg font-bold">{formatPercent(percentage)}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        );
      })}
    </div>
  );
}

function GeographicMap({ data }: { data: WebsiteAnalyticsOverview["geographicData"] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No geographic data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.slice(0, 5).map((entry) => (
        <div key={entry.countryCode} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{entry.country}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{formatNumber(entry.visitors)}</span>
            <Badge variant="secondary">{formatPercent(entry.percentage)}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function TopPagesTable({ pages }: { pages: WebsiteAnalyticsOverview["topPages"] }) {
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
        No page data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pages.slice(0, 5).map((page, i) => (
        <div key={page.pagePath} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
            <div>
              <p className="text-sm font-medium truncate max-w-[200px]">{page.pageTitle || page.pagePath}</p>
              <p className="text-xs text-muted-foreground">{page.pagePath}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-medium">{formatNumber(page.pageviews)}</p>
              <p className="text-xs text-muted-foreground">views</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatNumber(page.uniqueVisitors)}</p>
              <p className="text-xs text-muted-foreground">visitors</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchQueriesTable({ queries }: { queries: WebsiteAnalyticsOverview["topSearchQueries"] }) {
  if (queries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <Search className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">No search query data available</p>
        <p className="text-xs text-muted-foreground mt-1">Connect Google Search Console to see queries</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {queries.slice(0, 5).map((query, i) => (
        <div key={query.query} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground w-4">{i + 1}</span>
            <p className="text-sm font-medium">{query.query}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-right">
              <p className="font-medium">{formatNumber(query.clicks)}</p>
              <p className="text-xs text-muted-foreground">clicks</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatPercent(query.ctr)}</p>
              <p className="text-xs text-muted-foreground">CTR</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SEOIssuesList({ issues }: { issues: WebsiteSEOOverview["topIssues"] }) {
  if (issues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center">
        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
        <p className="text-sm font-medium">No SEO issues found</p>
        <p className="text-xs text-muted-foreground mt-1">Your pages are well optimized</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {issues.slice(0, 5).map((issue) => (
        <div key={issue.id} className="flex items-start gap-3 p-3 rounded-lg border">
          {issue.type === "error" ? (
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          ) : issue.type === "warning" ? (
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          ) : (
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{issue.title}</p>
              <Badge variant={issue.impact === "high" ? "destructive" : "secondary"}>
                {issue.impact}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{issue.description}</p>
            {issue.howToFix && (
              <p className="text-xs text-brand-blue mt-1">{issue.howToFix}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SEORecommendationsList({ recommendations }: { recommendations: WebsiteSEOOverview["topRecommendations"] }) {
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {recommendations.slice(0, 5).map((rec) => (
        <div key={rec.id} className="flex items-start gap-3 p-3 rounded-lg border border-brand-blue/20 bg-brand-frost/30">
          <div className="rounded-full bg-brand-blue/10 p-1">
            <TrendingUp className="h-4 w-4 text-brand-blue" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{rec.title}</p>
              <Badge variant="outline">
                +{rec.estimatedImpact} pts
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
            <p className="text-xs text-muted-foreground mt-1">Effort: {rec.effort}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditRunner({ onAuditComplete }: { onAuditComplete: () => void }) {
  const [url, setUrl] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async () => {
    if (!url.trim()) return;

    setIsRunning(true);
    setError(null);

    try {
      const result = await runPageSEOAudit(url);
      if (result.success) {
        onAuditComplete();
        setUrl("");
      } else {
        setError(result.error || "Failed to run audit");
      }
    } catch {
      setError("Failed to run audit");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Run SEO Audit</CardTitle>
        <CardDescription>Enter a URL to analyze its SEO health</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isRunning}
          />
          <Button onClick={handleRunAudit} disabled={isRunning || !url.trim()}>
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Audit
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function WebsiteAnalyticsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
  const [activeTab, setActiveTab] = useState("overview");
  const [analyticsData, setAnalyticsData] = useState<WebsiteAnalyticsOverview | null>(null);
  const [seoData, setSeoData] = useState<WebsiteSEOOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [analyticsResult, seoResult] = await Promise.all([
        getWebsiteAnalytics(period),
        getWebsiteSEOOverview(),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalyticsData(analyticsResult.data);
      }

      if (seoResult.success && seoResult.data) {
        setSeoData(seoResult.data);
      }

      if (!analyticsResult.success && !seoResult.success) {
        setError("Failed to load data. You may not have permission to view website analytics.");
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Unable to load analytics</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="seo">SEO Audit</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && analyticsData && (
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Page Views"
              value={formatNumber(analyticsData.totalPageviews)}
              icon={<Eye className="h-5 w-5 text-brand-blue" />}
              trend={{
                value: analyticsData.periodComparison.pageviewsChange,
                isPositive: analyticsData.periodComparison.pageviewsChange > 0,
              }}
            />
            <StatCard
              title="Unique Visitors"
              value={formatNumber(analyticsData.totalUniqueVisitors)}
              icon={<Users className="h-5 w-5 text-brand-blue" />}
              trend={{
                value: analyticsData.periodComparison.visitorsChange,
                isPositive: analyticsData.periodComparison.visitorsChange > 0,
              }}
            />
            <StatCard
              title="Sessions"
              value={formatNumber(analyticsData.totalSessions)}
              icon={<MousePointerClick className="h-5 w-5 text-brand-blue" />}
              trend={{
                value: analyticsData.periodComparison.sessionsChange,
                isPositive: analyticsData.periodComparison.sessionsChange > 0,
              }}
            />
            <StatCard
              title="Avg. Session Duration"
              value={formatDuration(analyticsData.avgSessionDuration)}
              subtitle={`${formatPercent(analyticsData.avgBounceRate)} bounce rate`}
              icon={<Clock className="h-5 w-5 text-brand-blue" />}
            />
          </div>

          {/* Traffic & device breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <TrafficSourcesChart data={analyticsData.trafficSources} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>How visitors access your site</CardDescription>
              </CardHeader>
              <CardContent>
                <DeviceBreakdown data={analyticsData.deviceBreakdown} />
              </CardContent>
            </Card>
          </div>

          {/* Top pages & search queries */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages</CardDescription>
              </CardHeader>
              <CardContent>
                <TopPagesTable pages={analyticsData.topPages} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Search Queries</CardTitle>
                <CardDescription>What people search for</CardDescription>
              </CardHeader>
              <CardContent>
                <SearchQueriesTable queries={analyticsData.topSearchQueries} />
              </CardContent>
            </Card>
          </div>

          {/* Geographic distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Where your visitors are located</CardDescription>
            </CardHeader>
            <CardContent>
              <GeographicMap data={analyticsData.geographicData} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* SEO Tab */}
      {activeTab === "seo" && seoData && (
        <div className="space-y-6">
          {/* SEO scores */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <ScoreCard
              title="Overall SEO Score"
              score={seoData.overallScore}
              description={`${seoData.totalPagesAudited} pages audited`}
            />
            <ScoreCard title="Technical" score={seoData.avgTechnicalScore} />
            <ScoreCard title="Content" score={seoData.avgContentScore} />
            <ScoreCard title="Performance" score={seoData.avgPerformanceScore} />
            <ScoreCard title="Mobile" score={seoData.avgMobileScore} />
          </div>

          {/* Page health overview */}
          <Card>
            <CardHeader>
              <CardTitle>Page Health Overview</CardTitle>
              <CardDescription>Status of audited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1 text-center p-4 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center justify-center gap-2 text-green-700 mb-1">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{seoData.pagesHealthy}</span>
                  </div>
                  <p className="text-sm text-green-600">Healthy</p>
                </div>
                <div className="flex-1 text-center p-4 rounded-lg bg-amber-50 border border-amber-200">
                  <div className="flex items-center justify-center gap-2 text-amber-700 mb-1">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{seoData.pagesWithWarnings}</span>
                  </div>
                  <p className="text-sm text-amber-600">Warnings</p>
                </div>
                <div className="flex-1 text-center p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-center gap-2 text-red-700 mb-1">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-2xl font-bold">{seoData.pagesWithErrors}</span>
                  </div>
                  <p className="text-sm text-red-600">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Run audit */}
          <AuditRunner onAuditComplete={fetchData} />

          {/* Issues and recommendations */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>Critical issues to fix</CardDescription>
              </CardHeader>
              <CardContent>
                <SEOIssuesList issues={seoData.topIssues} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>Opportunities to improve</CardDescription>
              </CardHeader>
              <CardContent>
                <SEORecommendationsList recommendations={seoData.topRecommendations} />
              </CardContent>
            </Card>
          </div>

          {/* Page audits list */}
          {seoData.pageAudits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Audited Pages</CardTitle>
                <CardDescription>Individual page SEO scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.pageAudits.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{audit.pageTitle || audit.pagePath}</p>
                          <a
                            href={audit.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-brand-blue"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <p className="text-xs text-muted-foreground">{audit.pagePath}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`text-lg font-bold ${getScoreColor(audit.seoScore)}`}>
                            {audit.seoScore}
                          </span>
                          <span className="text-xs text-muted-foreground">/100</span>
                        </div>
                        {audit.scoreChange !== null && audit.scoreChange !== 0 && (
                          <div className={`flex items-center gap-1 ${audit.scoreChange > 0 ? "text-green-600" : "text-red-600"}`}>
                            {audit.scoreChange > 0 ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            <span className="text-sm font-medium">
                              {audit.scoreChange > 0 ? "+" : ""}{audit.scoreChange}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Last audit info */}
          {seoData.lastAuditedAt && (
            <p className="text-xs text-muted-foreground text-center">
              Last audit: {new Date(seoData.lastAuditedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Empty states */}
      {activeTab === "overview" && !analyticsData && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No analytics data yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analytics data will appear here once visitors start using your site
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === "seo" && !seoData && (
        <div className="space-y-6">
          <AuditRunner onAuditComplete={fetchData} />
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No SEO audits yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run an audit above to analyze your page SEO
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
