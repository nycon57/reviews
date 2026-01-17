'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationPreferencesCard } from '@/components/notifications';

function NotificationsSkeleton() {
  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-repwell-teal-500">
          Notification Preferences
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how and when you want to be notified about reviews, surveys, and account activity.
        </p>
      </div>

      <Suspense fallback={<NotificationsSkeleton />}>
        <NotificationPreferencesCard />
      </Suspense>
    </div>
  );
}
