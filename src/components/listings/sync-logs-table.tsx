'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  History,
} from 'lucide-react';
import { type ListingSyncLog } from '@/lib/listings/types';
import { getSyncLogs } from '@/lib/listings/actions';

interface SyncLogsTableProps {
  listingId: string;
}

function getStatusIcon(status: ListingSyncLog['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'in_progress':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'started':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadgeVariant(status: ListingSyncLog['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'completed':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'in_progress':
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatDuration(ms: number | null): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function SyncLogsTable({ listingId }: SyncLogsTableProps) {
  const [logs, setLogs] = useState<ListingSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const result = await getSyncLogs(listingId);
      if (result.success && result.data) {
        setLogs(result.data);
      } else {
        setError(result.error || 'Failed to load sync logs');
      }
      setLoading(false);
    }

    fetchLogs();
  }, [listingId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync History</CardTitle>
          <CardDescription>Track sync operations across directories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <History className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No sync history yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect directories and sync to see history
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sync History</CardTitle>
        <CardDescription>Recent sync operations across directories</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Directories</TableHead>
              <TableHead>Conflicts</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <Badge variant={getStatusBadgeVariant(log.status)} className="text-xs">
                      {log.status}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="capitalize">{log.syncType.replace('_', ' ')}</TableCell>
                <TableCell>{log.directoriesSynced}</TableCell>
                <TableCell>
                  {log.conflictsDetected > 0 ? (
                    <span className="text-orange-600">
                      {log.conflictsDetected} ({log.conflictsResolved} resolved)
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDuration(log.durationMs)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(log.startedAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
