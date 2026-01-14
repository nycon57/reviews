'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AccuracyScoreCard } from '@/components/listings/accuracy-score-card';
import { DirectoryConnectionsGrid } from '@/components/listings/directory-connection-card';
import { ListingInfoCard } from '@/components/listings/listing-info-card';
import { SyncLogsTable } from '@/components/listings/sync-logs-table';
import type { BusinessListing, DirectoryConnection, ListingAccuracyHistory } from '@/lib/listings/types';

interface ListingDetailClientProps {
  listing: BusinessListing;
  connections: DirectoryConnection[];
  accuracyHistory?: ListingAccuracyHistory;
}

export function ListingDetailClient({
  listing,
  connections: initialConnections,
  accuracyHistory,
}: ListingDetailClientProps) {
  const [connections, setConnections] = useState(initialConnections);

  const handleConnectionUpdate = (updatedConnection: DirectoryConnection) => {
    setConnections((prev) =>
      prev.map((c) => (c.id === updatedConnection.id ? updatedConnection : c))
    );
  };

  return (
    <Tabs defaultValue="directories" className="space-y-6">
      <TabsList>
        <TabsTrigger value="directories">Directories</TabsTrigger>
        <TabsTrigger value="info">Business Info</TabsTrigger>
        <TabsTrigger value="history">Sync History</TabsTrigger>
      </TabsList>

      <TabsContent value="directories" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DirectoryConnectionsGrid
              connections={connections}
              onUpdate={handleConnectionUpdate}
            />
          </div>
          <div>
            <AccuracyScoreCard
              score={listing.accuracyScore}
              previousScore={accuracyHistory?.previousScore ?? undefined}
              breakdown={accuracyHistory?.scoreBreakdown}
              lastChecked={listing.lastAccuracyCheck ?? undefined}
            />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="info" className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <ListingInfoCard listing={listing} />
          <AccuracyScoreCard
            score={listing.accuracyScore}
            previousScore={accuracyHistory?.previousScore ?? undefined}
            breakdown={accuracyHistory?.scoreBreakdown}
            lastChecked={listing.lastAccuracyCheck ?? undefined}
          />
        </div>
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <SyncLogsTable listingId={listing.id} />
      </TabsContent>
    </Tabs>
  );
}
