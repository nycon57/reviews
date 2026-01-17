'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIntegrationCard } from '@/components/google/google-integration-card';
import { SocialIntegrationCard } from '@/components/social';
import { SalesforceIntegrationCard } from '@/components/salesforce';
import { SlackIntegrationCard, TeamsIntegrationCard } from '@/components/integrations';

function IntegrationCardSkeleton() {
  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export function IntegrationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-repwell-teal-500">
          Connected Services
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage integrations with external platforms to sync reviews, publish testimonials, and more.
        </p>
      </div>

      <div className="grid gap-6">
        <Suspense fallback={<IntegrationCardSkeleton />}>
          <GoogleIntegrationCard />
        </Suspense>

        <Suspense fallback={<IntegrationCardSkeleton />}>
          <SocialIntegrationCard />
        </Suspense>

        <Suspense fallback={<IntegrationCardSkeleton />}>
          <SalesforceIntegrationCard />
        </Suspense>

        <Suspense fallback={<IntegrationCardSkeleton />}>
          <SlackIntegrationCard />
        </Suspense>

        <Suspense fallback={<IntegrationCardSkeleton />}>
          <TeamsIntegrationCard />
        </Suspense>
      </div>
    </div>
  );
}
