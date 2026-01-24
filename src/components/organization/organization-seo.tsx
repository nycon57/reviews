"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle as CheckCircle2,
  XCircle,
  Warning as AlertTriangle,
  ArrowsClockwise as RefreshCw,
  ArrowSquareOut as ExternalLink,
  FileCode as FileCode2,
  Globe,
  MagnifyingGlass as Search,
  FileText,
  SpinnerGap as Loader2,
  Copy,
  Check,
} from "@phosphor-icons/react";
import { runSEOAudit, type SEOAuditResult } from "@/lib/seo/audit-actions";

type AuditItemStatus = "pass" | "fail" | "warning" | "not_applicable";

interface AuditItemDisplayProps {
  title: string;
  description: string;
  status: AuditItemStatus;
  details?: string;
  priority: "high" | "medium" | "low";
}

function AuditItem({ title, description, status, details, priority }: AuditItemDisplayProps) {
  const statusConfig = {
    pass: {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      badge: <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Pass</Badge>,
    },
    fail: {
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      badge: <Badge variant="destructive">Fail</Badge>,
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      badge: <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>,
    },
    not_applicable: {
      icon: <CheckCircle2 className="h-5 w-5 text-muted-foreground" />,
      badge: <Badge variant="outline">N/A</Badge>,
    },
  };

  const priorityColors = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-blue-500",
  };

  return (
    <div className={`rounded-lg border bg-card p-4 border-l-4 ${priorityColors[priority]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {statusConfig[status].icon}
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            {details && (
              <p className="mt-2 text-sm text-muted-foreground/80 italic">{details}</p>
            )}
          </div>
        </div>
        {statusConfig[status].badge}
      </div>
    </div>
  );
}

function CategorySection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: AuditItemDisplayProps[];
}) {
  const passCount = items.filter((i) => i.status === "pass").length;
  const totalCount = items.filter((i) => i.status !== "not_applicable").length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant="outline">
            {passCount}/{totalCount} passed
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item, i) => (
          <AuditItem key={i} {...item} />
        ))}
      </CardContent>
    </Card>
  );
}

export function OrganizationSEO() {
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [audit, setAudit] = useState<SEOAuditResult | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    let cancelled = false;
    async function loadInitialAudit() {
      const result = await runSEOAudit();
      if (!cancelled && result.success && result.data) {
        setAudit(result.data);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    loadInitialAudit();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleRefresh() {
    startTransition(async () => {
      setLoading(true);
      const result = await runSEOAudit();
      if (result.success && result.data) {
        setAudit(result.data);
      }
      setLoading(false);
      toast({
        title: "Audit refreshed",
        description: "SEO audit has been updated.",
      });
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "URL copied to clipboard.",
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group audit items by category
  const technicalItems = audit?.items.filter((i) => i.category === "technical") || [];
  const contentItems = audit?.items.filter((i) => i.category === "content") || [];
  const structuredDataItems = audit?.items.filter((i) => i.category === "structured_data") || [];
  const socialItems = audit?.items.filter((i) => i.category === "social") || [];

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>SEO Health Score</CardTitle>
              <CardDescription>
                Overall SEO performance based on {audit?.items.length || 0} checks
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{audit?.score || 0}%</div>
              <div className="flex-1">
                <Progress value={audit?.score || 0} className="h-3" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {audit?.score && audit.score >= 80
                ? "Great job! Your SEO setup is well optimized."
                : audit?.score && audit.score >= 60
                  ? "Good progress, but there's room for improvement."
                  : "Several SEO improvements are recommended."}
            </p>
            {audit?.generatedAt && (
              <p className="text-xs text-muted-foreground">
                Last checked: {new Date(audit.generatedAt).toLocaleString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SEO Resources</CardTitle>
          <CardDescription>
            Quick access to your SEO configuration files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sitemap</p>
                  <p className="text-xs text-muted-foreground">/sitemap.xml</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(`${baseUrl}/sitemap.xml`)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Robots.txt</p>
                  <p className="text-xs text-muted-foreground">/robots.txt</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(`${baseUrl}/robots.txt`)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <a href="/robots.txt" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Google Search Console Info */}
      <Alert>
        <Search className="h-4 w-4" />
        <AlertTitle>Google Search Console</AlertTitle>
        <AlertDescription>
          To verify rich results and structured data, submit your sitemap to{" "}
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Google Search Console
          </a>{" "}
          and use the{" "}
          <a
            href="https://search.google.com/test/rich-results"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            Rich Results Test
          </a>{" "}
          to validate your structured data.
        </AlertDescription>
      </Alert>

      {/* Audit Categories */}
      {technicalItems.length > 0 && (
        <CategorySection
          title="Technical SEO"
          icon={<FileCode2 className="h-5 w-5 text-muted-foreground" />}
          items={technicalItems}
        />
      )}

      {structuredDataItems.length > 0 && (
        <CategorySection
          title="Structured Data"
          icon={<FileText className="h-5 w-5 text-muted-foreground" />}
          items={structuredDataItems}
        />
      )}

      {contentItems.length > 0 && (
        <CategorySection
          title="Content"
          icon={<Globe className="h-5 w-5 text-muted-foreground" />}
          items={contentItems}
        />
      )}

      {socialItems.length > 0 && (
        <CategorySection
          title="Social & Sharing"
          icon={<ExternalLink className="h-5 w-5 text-muted-foreground" />}
          items={socialItems}
        />
      )}
    </div>
  );
}
