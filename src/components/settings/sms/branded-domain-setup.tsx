'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  Globe,
  CheckCircle,
  XCircle,
  Copy,
  Trash,
  ArrowsClockwise,
  SpinnerGap,
  ShieldCheck,
  Check,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  getBrandedDomain,
  addBrandedDomain,
  verifyDomainDns,
  removeBrandedDomain,
  type BrandedDomain,
} from '@/lib/sms/enterprise/branded-domains';

export function BrandedDomainSetup() {
  const [domain, setDomain] = useState<BrandedDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchIdRef = useRef(0);

  useEffect(() => {
    const fetchId = ++fetchIdRef.current;

    getBrandedDomain().then((result) => {
      if (fetchId !== fetchIdRef.current) return;
      if (result.success) {
        setDomain(result.data ?? null);
      }
      setLoading(false);
    });
  }, []);

  function handleAdd() {
    if (!newDomain.trim()) return;

    startTransition(async () => {
      const result = await addBrandedDomain({ domain: newDomain.trim() });
      if (result.success && result.data) {
        setDomain(result.data);
        setNewDomain('');
        toast({ title: 'Domain added', description: 'Configure the DNS record below to activate.' });
      } else if (!result.success) {
        toast({ title: 'Failed to add domain', description: result.error, variant: 'destructive' });
      }
    });
  }

  function handleVerify() {
    if (!domain) return;

    startTransition(async () => {
      const result = await verifyDomainDns({ domainId: domain.id });
      if (result.success && result.data) {
        toast({
          title: result.data.verified ? 'DNS verified' : 'Verification pending',
          description: result.data.message,
          variant: result.data.verified ? 'default' : 'destructive',
        });
        const refreshed = await getBrandedDomain();
        if (refreshed.success) {
          setDomain(refreshed.data ?? null);
        }
      } else if (!result.success) {
        toast({ title: 'Verification failed', description: result.error, variant: 'destructive' });
      }
    });
  }

  function handleRemove() {
    if (!domain) return;

    startTransition(async () => {
      const result = await removeBrandedDomain({ domainId: domain.id });
      if (result.success) {
        setDomain(null);
        toast({ title: 'Domain removed', description: 'Short links will use the default domain.' });
      } else if (!result.success) {
        toast({ title: 'Failed to remove', description: result.error, variant: 'destructive' });
      }
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Branded Short Domain
        </CardTitle>
        <CardDescription>
          Use a custom domain for SMS short links instead of the default app.repwell.com/r/.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {domain ? (
          <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="font-mono font-medium">{domain.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  {domain.dnsVerified ? (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      DNS Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      <XCircle className="mr-1 h-3 w-3" />
                      DNS Pending
                    </Badge>
                  )}
                  {domain.sslActive && (
                    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                      <ShieldCheck className="mr-1 h-3 w-3" />
                      SSL Active
                    </Badge>
                  )}
                </div>
              </div>

              {/* DNS Instructions */}
              {!domain.dnsVerified && (
                <div className="rounded-md bg-muted/50 p-3 space-y-2">
                  <p className="text-sm font-medium">DNS Configuration Required</p>
                  <p className="text-sm text-muted-foreground">
                    Add the following CNAME record to your DNS provider:
                  </p>
                  <div className="flex items-center gap-2 rounded border bg-background px-3 py-2">
                    <code className="flex-1 text-sm">
                      {domain.domain} → {domain.cnameTarget}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(domain.cnameTarget)}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    DNS changes may take up to 48 hours to propagate.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVerify}
                  disabled={isPending}
                >
                  {isPending ? (
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowsClockwise className="mr-2 h-4 w-4" />
                  )}
                  Verify DNS
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash className="mr-2 h-4 w-4" />
                      Remove Domain
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove branded domain?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Short links will revert to the default app.repwell.com domain.
                        Existing links will continue to work until they expire.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleRemove}>
                        Remove Domain
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
        ) : (
          <div className="space-y-3">
              <Label htmlFor="branded-domain">Custom Short Link Domain</Label>
              <div className="flex gap-2">
                <Input
                  id="branded-domain"
                  placeholder="review.yourdomain.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <Button onClick={handleAdd} disabled={!newDomain.trim() || isPending}>
                  {isPending ? (
                    <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Globe className="mr-2 h-4 w-4" />
                  )}
                  Add Domain
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a subdomain you own (e.g., review.acmelending.com). You will need to add a
                CNAME record pointing to our servers.
              </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
