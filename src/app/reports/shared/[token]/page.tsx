import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getReportShareByToken, generateReport } from "@/lib/reporting";
import { ReportViewer } from "@/components/reporting/report-viewer";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, Link2 } from "lucide-react";
import type { Metadata } from "next";

interface SharedReportPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({
  params,
}: SharedReportPageProps): Promise<Metadata> {
  const { token } = await params;
  const shareResult = await getReportShareByToken(token);

  if (!shareResult.success || !shareResult.data) {
    return {
      title: "Report Not Found | ReviewHub",
    };
  }

  return {
    title: `${shareResult.data.title} | ReviewHub`,
    description: "Shared performance report from ReviewHub",
  };
}

export default async function SharedReportPage({
  params,
}: SharedReportPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Get share details
  const shareResult = await getReportShareByToken(token);

  if (!shareResult.success || !shareResult.data) {
    notFound();
  }

  const share = shareResult.data;

  // Check if expired
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>
              This shared report link has expired. Please request a new link from the
              report owner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Update access count
  await supabase
    .from("report_shares")
    .update({
      access_count: share.accessCount + 1,
      last_accessed_at: new Date().toISOString(),
    })
    .eq("id", share.id);

  // Generate the report
  const reportResult = await generateReport(
    share.templateId,
    {
      preset: "custom",
      start: new Date(share.dateRangeStart),
      end: new Date(share.dateRangeEnd),
    },
    share.filters || {}
  );

  if (!reportResult.success || !reportResult.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Error Loading Report</CardTitle>
            <CardDescription>
              There was an error generating this report. Please try again later or
              contact the report owner.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-lg font-semibold">{share.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Shared report from ReviewHub
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {format(new Date(share.dateRangeStart), "MMM d, yyyy")} -{" "}
                  {format(new Date(share.dateRangeEnd), "MMM d, yyyy")}
                </span>
              </div>
              {share.expiresAt && (
                <Badge variant="outline" className="text-xs">
                  Expires {format(new Date(share.expiresAt), "MMM d, yyyy")}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Report Content */}
      <main className="container mx-auto px-6 py-8">
        <ReportViewer report={reportResult.data} />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4">
        <div className="container mx-auto px-6">
          <p className="text-center text-sm text-muted-foreground">
            This report was generated by ReviewHub. Data is accurate as of{" "}
            {format(new Date(reportResult.data.generatedAt), "MMM d, yyyy 'at' h:mm a")}.
          </p>
        </div>
      </footer>
    </div>
  );
}
