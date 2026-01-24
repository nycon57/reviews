'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Warning as AlertTriangle,
  Eye,
  EyeSlash as EyeOff,
} from "@phosphor-icons/react";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { CreateApiKeyResult } from '@/lib/api-keys/types';

interface ApiKeyCreatedDialogProps {
  result: CreateApiKeyResult | null;
  onClose: () => void;
}

export function ApiKeyCreatedDialog({
  result,
  onClose,
}: ApiKeyCreatedDialogProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    if (!result?.rawKey) return;

    try {
      await navigator.clipboard.writeText(result.rawKey);
      setCopied(true);
      toast({
        title: 'Copied',
        description: 'API key copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    setCopied(false);
    setShowKey(false);
    onClose();
  };

  if (!result) return null;

  const maskedKey = result.rawKey.replace(/(.{12})(.*)(.{4})/, '$1...$3');

  return (
    <Dialog open={!!result} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            API Key Created
          </DialogTitle>
          <DialogDescription>
            Your new API key <strong>{result.apiKey.name}</strong> has been
            created successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Make sure to copy your API key now. You won&apos;t be able to see it
              again. If you lose it, you&apos;ll need to create a new one.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <label className="text-sm font-medium text-repwell-teal-500">
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <code className="block w-full rounded-lg bg-muted px-4 py-3 font-mono text-sm break-all select-all border">
                  {showKey ? result.rawKey : maskedKey}
                </code>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  className="h-9 w-9"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="h-9 w-9"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Environment:</span>
                <span className="ml-2 font-medium">
                  {result.apiKey.environment === 'live' ? 'Production' : 'Test'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Rate Limit:</span>
                <span className="ml-2 font-medium">
                  {result.apiKey.rateLimit.toLocaleString()}/hr
                </span>
              </div>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Scopes:</span>
              <span className="ml-2 font-medium">
                {result.apiKey.scopes.join(', ')}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-dashed p-4">
            <h4 className="text-sm font-medium text-repwell-teal-500 mb-2">
              Quick Start
            </h4>
            <code className="block text-xs bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto">
              <span className="text-slate-400"># Using curl</span>
              <br />
              curl -X GET &quot;https://api.repwell.com/v1/surveys&quot; \<br />
              &nbsp;&nbsp;-H &quot;x-api-key: {result.rawKey.substring(0, 20)}...&quot;
            </code>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="bg-repwell-teal-300 hover:bg-repwell-teal-400">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
