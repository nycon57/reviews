'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Key,
  RefreshCw,
  ExternalLink,
  Shield,
  Zap,
  Code,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ApiKeyList,
  CreateApiKeyDialog,
  ApiKeyCreatedDialog,
} from '@/components/api-keys';
import { getApiKeys } from '@/lib/api-keys/actions';
import type { ApiKey, CreateApiKeyResult } from '@/lib/api-keys/types';

function ApiKeysSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  );
}

export function ApiTab() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResult | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'test'>('live');

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    const result = await getApiKeys();
    if (result.success && result.data) {
      setApiKeys(result.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Initial data fetch on mount
    let mounted = true;
    (async () => {
      const result = await getApiKeys();
      if (mounted && result.success && result.data) {
        setApiKeys(result.data);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
     
  }, []);

  const liveKeys = apiKeys.filter((k) => k.environment === 'live');
  const testKeys = apiKeys.filter((k) => k.environment === 'test');

  const handleKeyCreated = (result: CreateApiKeyResult) => {
    setCreatedKey(result);
    fetchApiKeys();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-repwell-teal-500">
            API Keys
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for integrating with the RepWell API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchApiKeys}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <CreateApiKeyDialog onKeyCreated={handleKeyCreated} />
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border border-border shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-repwell-teal-400" />
              <CardTitle className="text-sm font-medium">Secure</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Keys are hashed using SHA-256 and never stored in plain text.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-repwell-teal-400" />
              <CardTitle className="text-sm font-medium">Rate Limited</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Each key has configurable rate limits to protect your account.
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-soft">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-repwell-teal-400" />
              <CardTitle className="text-sm font-medium">REST API</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Full access to surveys, reviews, and more via our REST API.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* API Keys List */}
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-repwell-teal-400" />
            Your API Keys
          </CardTitle>
          <CardDescription>
            API keys allow external applications to authenticate with the
            RepWell API. Keep your keys secure and never share them publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'live' | 'test')}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="live">
                Live Keys
                {liveKeys.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {liveKeys.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="test">
                Test Keys
                {testKeys.length > 0 && (
                  <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-xs">
                    {testKeys.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {loading ? (
                <ApiKeysSkeleton />
              ) : (
                <ApiKeyList
                  apiKeys={liveKeys}
                  onRefresh={fetchApiKeys}
                  onKeyRotated={handleKeyCreated}
                />
              )}
            </TabsContent>

            <TabsContent value="test">
              {loading ? (
                <ApiKeysSkeleton />
              ) : (
                <ApiKeyList
                  apiKeys={testKeys}
                  onRefresh={fetchApiKeys}
                  onKeyRotated={handleKeyCreated}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Card className="border-dashed border border-border">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <h3 className="font-medium text-repwell-teal-500">
              API Documentation
            </h3>
            <p className="text-sm text-muted-foreground">
              Learn how to integrate with the RepWell API
            </p>
          </div>
          <Link href="/developers" target="_blank">
            <Button variant="outline" className="gap-2">
              View Docs
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Created Key Dialog */}
      <ApiKeyCreatedDialog
        result={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </div>
  );
}
