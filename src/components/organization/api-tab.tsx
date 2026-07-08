'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Key,
  ArrowsClockwise as RefreshCw,
  ArrowSquareOut as ExternalLink,
  Shield,
  Lightning as Zap,
  Code,
  Plus,
  CheckCircle,
  ArrowRight,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ApiKeyList,
  CreateApiKeyDialog,
  ApiKeyCreatedDialog,
} from '@/components/api-keys';
import { getApiKeys } from '@/lib/api-keys/actions';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
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

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}

function QuickActionButton({ icon, title, description, href, onClick, primary }: QuickActionButtonProps) {
  const content = (
    <>
      <div className={`p-2 rounded-lg transition-colors ${
        primary
          ? 'bg-repwell-teal-400/20 group-hover:bg-repwell-teal-400/30'
          : 'bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${primary ? 'text-repwell-teal-400 dark:text-repwell-sage-100/80' : 'text-heading-accent'}`}>{title}</p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </>
  );

  const className = `w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
    primary
      ? 'bg-repwell-teal-400/10 hover:bg-repwell-teal-400/20 border border-repwell-teal-400/30'
      : 'bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10'
  }`;

  if (href) {
    return (
      <Link href={href} target="_blank" className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
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
  const totalKeys = apiKeys.length;

  const handleKeyCreated = (result: CreateApiKeyResult) => {
    setCreatedKey(result);
    fetchApiKeys();
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-heading-accent tracking-tight">
            API Keys
          </h2>
          <p className="text-repwell-teal-300 mt-1">
            Manage API keys for integrating with the RepWell API.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchApiKeys}
            disabled={loading}
            className="border-border/50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* API Overview Hero Card */}
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-repwell-teal-300 to-repwell-teal-400 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Key weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">API Access</p>
                        <h3 className="text-2xl font-bold">
                          {totalKeys} Active {totalKeys === 1 ? 'Key' : 'Keys'}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        <Shield weight="bold" className="h-3 w-3 mr-1" />
                        SHA-256 Hashed
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        <Zap weight="bold" className="h-3 w-3 mr-1" />
                        Rate Limited
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 border">
                        <Code weight="bold" className="h-3 w-3 mr-1" />
                        REST API
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-white/90 text-sm">
                  Your API keys provide secure access to surveys, reviews, testimonials, and more through our REST API.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* API Keys List Card */}
          <motion.div variants={fadeInUp}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5 text-label" />
                      Your API Keys
                    </CardTitle>
                    <CardDescription>
                      Keep your keys secure and never share them publicly.
                    </CardDescription>
                  </div>
                  <div id="create-key-area">
                    <CreateApiKeyDialog onKeyCreated={handleKeyCreated} />
                  </div>
                </div>
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
          </motion.div>
        </div>

        {/* Right Column - Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-heading-accent">Quick Actions</h4>

              <div className="space-y-3">
                <QuickActionButton
                  icon={<Plus weight="duotone" className="h-4 w-4 text-label" />}
                  title="Create API Key"
                  description="Generate a new key"
                  onClick={() => {
                    const createArea = document.getElementById('create-key-area');
                    createArea?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Click the button after scrolling
                    setTimeout(() => {
                      const btn = createArea?.querySelector('button');
                      btn?.click();
                    }, 300);
                  }}
                  primary
                />

                <QuickActionButton
                  icon={<ExternalLink weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="View Documentation"
                  description="API reference & guides"
                  href="/developers"
                />
              </div>

              {/* Security Features */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-heading-accent">Security Features</p>
                <ul className="space-y-2">
                  {[
                    'SHA-256 hashed keys',
                    'Configurable rate limits',
                    'Environment separation',
                    'Revoke keys instantly',
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-repwell-teal-300">
                      <CheckCircle weight="duotone" className="h-4 w-4 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Created Key Dialog */}
      <ApiKeyCreatedDialog
        result={createdKey}
        onClose={() => setCreatedKey(null)}
      />
    </motion.div>
  );
}
