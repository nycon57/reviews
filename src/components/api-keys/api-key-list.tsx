'use client';

import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Key,
  Copy,
  RefreshCw,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { deleteApiKey, rotateApiKey } from '@/lib/api-keys/actions';
import type { ApiKey, CreateApiKeyResult } from '@/lib/api-keys/types';

interface ApiKeyListProps {
  apiKeys: ApiKey[];
  onRefresh: () => void;
  onKeyRotated?: (result: CreateApiKeyResult) => void;
}

export function ApiKeyList({
  apiKeys,
  onRefresh,
  onKeyRotated,
}: ApiKeyListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  // Store the initial timestamp when the component first renders
  // eslint-disable-next-line react-hooks/purity -- Intentionally get current time once on mount
  const weekFromNowRef = useRef<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Helper to check if a date is within the next week
  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    return expiryDate < weekFromNowRef.current;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: 'API key prefix copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(deleteId);

    const result = await deleteApiKey(deleteId);

    if (result.success) {
      toast({
        title: 'API key deleted',
        description: 'The API key has been permanently revoked',
      });
      onRefresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete API key',
        variant: 'destructive',
      });
    }

    setLoading(null);
    setDeleteId(null);
  };

  const handleRotate = async () => {
    if (!rotateId) return;
    setLoading(rotateId);

    const result = await rotateApiKey(rotateId);

    if (result.success && result.data) {
      toast({
        title: 'API key rotated',
        description: 'A new key has been generated. Make sure to copy it.',
      });
      onKeyRotated?.(result.data);
      onRefresh();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to rotate API key',
        variant: 'destructive',
      });
    }

    setLoading(null);
    setRotateId(null);
  };

  const getStatusBadge = (apiKey: ApiKey) => {
    if (!apiKey.isActive) {
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertCircle className="mr-1 h-3 w-3" />
          Inactive
        </Badge>
      );
    }

    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertCircle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    }

    if (apiKey.expiresAt && isExpiringSoon(apiKey.expiresAt)) {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
          <Clock className="mr-1 h-3 w-3" />
          Expiring Soon
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="bg-repwell-sage-200 text-repwell-teal-500 text-xs">
        <CheckCircle className="mr-1 h-3 w-3" />
        Active
      </Badge>
    );
  };

  if (apiKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Key className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-repwell-teal-500 mb-1">No API keys yet</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Create your first API key to start integrating with the RepWell API.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {apiKeys.map((apiKey) => (
          <div
            key={apiKey.id}
            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="rounded-full bg-muted p-2 shrink-0">
                <Key className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-repwell-teal-500 truncate">
                    {apiKey.name}
                  </span>
                  {getStatusBadge(apiKey)}
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    {apiKey.environment}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono text-muted-foreground">
                    {apiKey.keyPrefix}...
                  </code>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(apiKey.keyPrefix)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy prefix</TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {apiKey.lastUsedAt && (
                    <span>
                      Last used{' '}
                      {formatDistanceToNow(new Date(apiKey.lastUsedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                  <span>{apiKey.requestCount.toLocaleString()} requests</span>
                  {apiKey.expiresAt && (
                    <span>
                      Expires{' '}
                      {formatDistanceToNow(new Date(apiKey.expiresAt), {
                        addSuffix: true,
                      })}
                    </span>
                  )}
                </div>
                {apiKey.scopes.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {apiKey.scopes.slice(0, 3).map((scope) => (
                      <Badge
                        key={scope}
                        variant="secondary"
                        className="text-xs font-normal"
                      >
                        {scope}
                      </Badge>
                    ))}
                    {apiKey.scopes.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        +{apiKey.scopes.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  disabled={loading === apiKey.id}
                >
                  {loading === apiKey.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setRotateId(apiKey.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rotate Key
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteId(apiKey.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Revoke Key
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke this API key? Any integrations
              using this key will stop working immediately. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rotate Confirmation */}
      <AlertDialog open={!!rotateId} onOpenChange={() => setRotateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key and deactivate the current one.
              You&apos;ll need to update any integrations with the new key. The new
              key will only be shown once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotate}>
              Rotate Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
