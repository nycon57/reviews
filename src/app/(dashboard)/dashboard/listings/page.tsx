import { Suspense } from 'react';
import Link from 'next/link';
import { MapPin, Plus, AlertTriangle, CheckCircle2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getListings, getListingsSummary, getListingAlerts } from '@/lib/listings/actions';
import { getAccuracyScoreColor, getAccuracyScoreLabel, getFullAddress } from '@/lib/listings/types';
import { ListingAlertsPanel } from '@/components/listings/listing-alerts-panel';

export const metadata = {
  title: 'Business Listings | ReviewHub',
  description: 'Manage your business listings across online directories',
};

function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ListingsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

async function ListingsSummaryStats() {
  const result = await getListingsSummary();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load listings summary.
      </div>
    );
  }

  const { totalListings, averageAccuracy, connectedDirectories, unresolvedAlerts } = result.data;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalListings}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${getAccuracyScoreColor(averageAccuracy)}`}>
            {averageAccuracy}%
          </div>
          <p className="text-xs text-muted-foreground">{getAccuracyScoreLabel(averageAccuracy)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Connected Directories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{connectedDirectories}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Unresolved Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${unresolvedAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {unresolvedAlerts}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

async function ListingsList() {
  const result = await getListings();

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load listings.
      </div>
    );
  }

  const listings = result.data;

  if (listings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No business listings yet</h3>
          <p className="text-muted-foreground text-center mb-4 max-w-sm">
            Create your first listing to start managing your business information across online directories.
          </p>
          <Button asChild>
            <Link href="/dashboard/listings/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Listing
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Listings</CardTitle>
        <CardDescription>
          Manage your business information across directories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {listings.map((listing) => {
          const accuracyColor = getAccuracyScoreColor(listing.accuracyScore);
          const address = getFullAddress(listing);

          return (
            <Link
              key={listing.id}
              href={`/dashboard/listings/${listing.id}`}
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{listing.businessName}</h3>
                  <p className="text-sm text-muted-foreground">{address || 'No address'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {listing.napConsistencyStatus === 'consistent' ? (
                      <Badge variant="outline" className="text-xs gap-1 text-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        NAP Consistent
                      </Badge>
                    ) : listing.napConsistencyStatus === 'inconsistent' ? (
                      <Badge variant="outline" className="text-xs gap-1 text-orange-600">
                        <AlertTriangle className="h-3 w-3" />
                        NAP Issues
                      </Badge>
                    ) : null}
                    {listing.potentialDuplicates.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {listing.potentialDuplicates.length} duplicates
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${accuracyColor}`}>
                  {listing.accuracyScore}
                </div>
                <p className="text-xs text-muted-foreground">Accuracy Score</p>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

async function AlertsSection() {
  const result = await getListingAlerts();

  if (!result.success || !result.data || result.data.length === 0) {
    return null;
  }

  return <ListingAlertsPanel alerts={result.data} />;
}

export default async function ListingsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Listings</h1>
            <p className="text-muted-foreground">
              Manage your business information across 100+ directories
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Listing
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <Suspense fallback={<StatsSkeleton />}>
        <ListingsSummaryStats />
      </Suspense>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<ListingsSkeleton />}>
            <ListingsList />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<AlertsSkeleton />}>
            <AlertsSection />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
