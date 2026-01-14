import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getListing, getDirectoryConnections, getAccuracyHistory } from '@/lib/listings/actions';
import { getFullAddress } from '@/lib/listings/types';
import { ListingDetailClient } from './listing-detail-client';

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const result = await getListing(id);

  if (!result.success || !result.data) {
    return {
      title: 'Listing Not Found | ReviewHub',
    };
  }

  return {
    title: `${result.data.businessName} | Business Listings | ReviewHub`,
    description: `Manage business listing for ${result.data.businessName}`,
  };
}

function ConnectionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function AccuracySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-2 w-full" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

async function ListingContent({ id }: { id: string }) {
  const [listingResult, connectionsResult, accuracyResult] = await Promise.all([
    getListing(id),
    getDirectoryConnections(id),
    getAccuracyHistory(id),
  ]);

  if (!listingResult.success || !listingResult.data) {
    notFound();
  }

  const listing = listingResult.data;
  const connections = connectionsResult.success ? connectionsResult.data || [] : [];
  const accuracyHistory = accuracyResult.success ? accuracyResult.data || [] : [];
  const latestHistory = accuracyHistory[0];

  return (
    <ListingDetailClient
      listing={listing}
      connections={connections}
      accuracyHistory={latestHistory}
    />
  );
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;

  // First fetch the listing to check if it exists
  const listingResult = await getListing(id);

  if (!listingResult.success || !listingResult.data) {
    notFound();
  }

  const listing = listingResult.data;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-1">
            <Link href="/dashboard/listings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{listing.businessName}</h1>
            <p className="text-muted-foreground">{getFullAddress(listing) || 'No address'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/dashboard/listings/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Main content */}
      <Suspense
        fallback={
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ConnectionsSkeleton />
            </div>
            <div>
              <AccuracySkeleton />
            </div>
          </div>
        }
      >
        <ListingContent id={id} />
      </Suspense>
    </div>
  );
}
