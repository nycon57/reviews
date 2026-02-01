'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  ClockCounterClockwise,
  FunnelSimple,
  DownloadSimple,
  CaretLeft,
  CaretRight,
  Phone,
  Shield,
  EnvelopeSimple,
  Prohibit,
  ChatCircle,
  CreditCard,
  Gear,
  Export,
  Warning,
  SpinnerGap,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getAuditLog,
  type AuditLogQuery,
  type AuditLogPage,
} from '@/lib/sms/audit/audit-actions';
import { exportAuditLog, exportSmsMessages } from '@/lib/sms/audit/export';
import type { AuditLogEntry, SmsAuditEventType } from '@/lib/sms/audit/audit-logger';

// ── Event type display config ───────────────────────────────────────────

const EVENT_LABELS: Record<SmsAuditEventType, { label: string; color: string }> = {
  consent_granted: { label: 'Consent Granted', color: 'bg-green-50 text-green-700 border-green-200' },
  consent_revoked: { label: 'Consent Revoked', color: 'bg-red-50 text-red-700 border-red-200' },
  message_sent: { label: 'Message Sent', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  message_failed: { label: 'Message Failed', color: 'bg-red-50 text-red-700 border-red-200' },
  message_queued: { label: 'Message Queued', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  opt_out_received: { label: 'Opt-Out', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  keyword_response: { label: 'Keyword Response', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  quiet_hours_blocked: { label: 'Quiet Hours', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  rate_limited: { label: 'Rate Limited', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  credit_deducted: { label: 'Credit Deducted', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  number_assigned: { label: 'Number Assigned', color: 'bg-green-50 text-green-700 border-green-200' },
  number_unassigned: { label: 'Number Unassigned', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  domain_verified: { label: 'Domain Verified', color: 'bg-green-50 text-green-700 border-green-200' },
  settings_changed: { label: 'Settings Changed', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  export_generated: { label: 'Export Generated', color: 'bg-blue-50 text-blue-700 border-blue-200' },
};

function getEventIcon(type: SmsAuditEventType) {
  switch (type) {
    case 'consent_granted':
    case 'consent_revoked':
      return <Shield className="h-3.5 w-3.5" />;
    case 'message_sent':
    case 'message_failed':
    case 'message_queued':
      return <EnvelopeSimple className="h-3.5 w-3.5" />;
    case 'opt_out_received':
      return <Prohibit className="h-3.5 w-3.5" />;
    case 'keyword_response':
      return <ChatCircle className="h-3.5 w-3.5" />;
    case 'quiet_hours_blocked':
      return <Warning className="h-3.5 w-3.5" />;
    case 'rate_limited':
      return <Warning className="h-3.5 w-3.5" />;
    case 'credit_deducted':
      return <CreditCard className="h-3.5 w-3.5" />;
    case 'number_assigned':
    case 'number_unassigned':
      return <Phone className="h-3.5 w-3.5" />;
    case 'domain_verified':
    case 'settings_changed':
      return <Gear className="h-3.5 w-3.5" />;
    case 'export_generated':
      return <Export className="h-3.5 w-3.5" />;
  }
}

// ── Component ───────────────────────────────────────────────────────────

export function AuditLogViewer() {
  const [page, setPage] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [eventType, setEventType] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;

    const query: AuditLogQuery = {
      page: currentPage,
      pageSize: 50,
      eventType: eventType || undefined,
      phoneNumber: phoneNumber || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };

    getAuditLog(query).then((result) => {
      if (fetchId !== fetchIdRef.current) return;
      if (result.success && result.data) {
        setPage(result.data);
      }
      setLoading(false);
    });
  }, [currentPage, eventType, phoneNumber, startDate, endDate]);

  function handleFilter() {
    setCurrentPage(1);
  }

  function handleExportAuditLog() {
    startTransition(async () => {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const result = await exportAuditLog({
        startDate: start,
        endDate: end,
        eventType: eventType || undefined,
        format: 'csv',
      });

      if (result.success && result.data) {
        downloadCsv(result.data.csv, result.data.filename);
        toast({
          title: 'Export complete',
          description: `Audit log exported. SHA-256: ${result.data.hash.slice(0, 16)}...`,
        });
      } else if (!result.success) {
        toast({ title: 'Export failed', description: result.error, variant: 'destructive' });
      }
    });
  }

  function handleExportMessages() {
    startTransition(async () => {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const result = await exportSmsMessages({ startDate: start, endDate: end });

      if (result.success && result.data) {
        downloadCsv(result.data.csv, result.data.filename);
        toast({
          title: 'Export complete',
          description: `Messages exported. SHA-256: ${result.data.hash.slice(0, 16)}...`,
        });
      } else if (!result.success) {
        toast({ title: 'Export failed', description: result.error, variant: 'destructive' });
      }
    });
  }

  if (loading && !page) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClockCounterClockwise className="h-5 w-5" />
              Compliance Audit Log
            </CardTitle>
            <CardDescription>
              Immutable record of all SMS compliance events. Retained for 5 years minimum.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportMessages}
              disabled={isPending}
            >
              {isPending ? (
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DownloadSimple className="mr-2 h-4 w-4" />
              )}
              Export Messages
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAuditLog}
              disabled={isPending}
            >
              {isPending ? (
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DownloadSimple className="mr-2 h-4 w-4" />
              )}
              Export Audit Log
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Event Type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                {(Object.keys(EVENT_LABELS) as SmsAuditEventType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {EVENT_LABELS[type].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Phone Number</Label>
            <Input
              placeholder="+1..."
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[150px]"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={handleFilter}>
            <FunnelSimple className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[160px]">Event</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {page?.entries.map((entry) => (
                <AuditLogRow key={entry.id} entry={entry} />
              ))}
              {page?.entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    No audit log entries found for the selected filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {page && page.total > page.pageSize && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(page.page - 1) * page.pageSize + 1}–
              {Math.min(page.page * page.pageSize, page.total)} of {page.total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <CaretLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!page.hasMore}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <CaretRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Row Component ───────────────────────────────────────────────────────

function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const config = EVENT_LABELS[entry.eventType] ?? {
    label: entry.eventType,
    color: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const detailsStr = Object.keys(entry.details).length > 0
    ? Object.entries(entry.details)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(', ')
    : '—';

  return (
    <TableRow>
      <TableCell className="text-sm tabular-nums">
        {new Date(entry.createdAt).toLocaleString()}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={`gap-1 ${config.color}`}>
          {getEventIcon(entry.eventType)}
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">
        {entry.phoneNumber ?? '—'}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {entry.actorEmail ?? 'System'}
      </TableCell>
      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
        {detailsStr}
      </TableCell>
    </TableRow>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
