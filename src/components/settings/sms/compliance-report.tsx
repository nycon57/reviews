'use client';

import { useState, useCallback } from 'react';
import { ChartBar, DownloadSimple, CalendarBlank } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  getComplianceReport,
  exportOptOutReport,
  type ComplianceReportRow,
} from '@/lib/sms/compliance/actions';

export function ComplianceReport() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState<ComplianceReportRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getComplianceReport({ startDate, endDate });
      if (result.success && result.data) {
        setReport(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.success ? 'No data returned' : result.error,
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, toast]);

  async function handleExportCsv() {
    setIsExporting(true);
    try {
      const result = await exportOptOutReport({ startDate, endDate });
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `opt-out-report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Report exported', description: 'CSV file downloaded.' });
      } else {
        toast({
          title: 'Export failed',
          description: result.success ? 'No data returned' : result.error,
          variant: 'destructive',
        });
      }
    } finally {
      setIsExporting(false);
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
              <ChartBar weight="duotone" className="h-5 w-5" />
              Compliance Report
            </CardTitle>
            <CardDescription>
              View daily opt-in/opt-out metrics and export compliance data.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={isExporting || !report}
            className="text-repwell-teal-300 border-repwell-teal-300/30"
          >
            <DownloadSimple className="h-4 w-4 mr-1.5" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Date Range Picker */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-sm font-medium text-repwell-teal-500">Start date</Label>
            <div className="relative mt-1.5">
              <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
          <div className="flex-1">
            <Label className="text-sm font-medium text-repwell-teal-500">End date</Label>
            <div className="relative mt-1.5">
              <CalendarBlank className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={loadReport}
            disabled={isLoading}
            className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
          >
            {isLoading ? 'Loading...' : 'Generate'}
          </Button>
        </div>

        {/* Report Table */}
        {report !== null && (
          <>
            {report.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-repwell-sage-100/50 flex items-center justify-center">
                  <ChartBar weight="duotone" className="h-5 w-5 text-repwell-teal-300" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No compliance data for the selected date range.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-repwell-teal-500 font-semibold">Date</TableHead>
                      <TableHead className="text-repwell-teal-500 font-semibold text-right">
                        Opted In
                      </TableHead>
                      <TableHead className="text-repwell-teal-500 font-semibold text-right">
                        Opted Out
                      </TableHead>
                      <TableHead className="text-repwell-teal-500 font-semibold text-right">
                        Net Change
                      </TableHead>
                      <TableHead className="text-repwell-teal-500 font-semibold text-right">
                        Compliance Rate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.map((row) => (
                      <TableRow key={row.date} className="hover:bg-muted/20">
                        <TableCell className="text-sm text-repwell-teal-400">
                          {formatDate(row.date)}
                        </TableCell>
                        <TableCell className="text-sm text-repwell-teal-400 text-right tabular-nums">
                          {row.optedIn}
                        </TableCell>
                        <TableCell className="text-sm text-right tabular-nums">
                          <span className={row.optedOut > 0 ? 'text-red-500' : 'text-repwell-teal-400'}>
                            {row.optedOut}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-right tabular-nums">
                          <span
                            className={
                              row.netChange > 0
                                ? 'text-repwell-sage-200'
                                : row.netChange < 0
                                  ? 'text-red-500'
                                  : 'text-repwell-teal-400'
                            }
                          >
                            {row.netChange > 0 ? '+' : ''}
                            {row.netChange}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant="outline"
                            className={
                              row.complianceRate >= 90
                                ? 'bg-repwell-sage-200/10 text-repwell-sage-200 border-repwell-sage-200/30'
                                : row.complianceRate >= 70
                                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                                  : 'bg-red-50 text-red-600 border-red-200'
                            }
                          >
                            {row.complianceRate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
