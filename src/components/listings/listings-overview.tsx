'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  MapPin,
  Globe,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import {
  type BusinessListing,
  type DirectoryConnection,
  getAccuracyScoreColor,
  getAccuracyScoreLabel,
  getFullAddress,
} from '@/lib/listings/types';

interface ListingsOverviewProps {
  listings: BusinessListing[];
  connections?: DirectoryConnection[];
  summary?: {
    totalListings: number;
    averageAccuracy: number;
    connectedDirectories: number;
    unresolvedAlerts: number;
  };
}

export function ListingsOverview({ listings, connections = [], summary }: ListingsOverviewProps) {
  // Calculate stats
  const connectedCount = connections.filter((c) => c.isConnected).length;
  const totalConnections = connections.length;
  const averageAccuracy =
    summary?.averageAccuracy ??
    (listings.length > 0
      ? Math.round(
          listings.reduce((sum, l) => sum + l.accuracyScore, 0) / listings.length
        )
      : 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Listings"
          value={summary?.totalListings ?? listings.length}
          icon={<Building2 className="h-5 w-5" />}
          description="Active business listings"
        />
        <StatsCard
          title="Average Accuracy"
          value={`${averageAccuracy}%`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          description={getAccuracyScoreLabel(averageAccuracy)}
          valueClass={getAccuracyScoreColor(averageAccuracy)}
        />
        <StatsCard
          title="Connected Directories"
          value={summary?.connectedDirectories ?? connectedCount}
          icon={<Globe className="h-5 w-5" />}
          description={`of ${totalConnections} available`}
        />
        <StatsCard
          title="Active Alerts"
          value={summary?.unresolvedAlerts ?? 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          description="Require attention"
          valueClass={(summary?.unresolvedAlerts ?? 0) > 0 ? 'text-orange-600' : 'text-green-600'}
        />
      </div>

      {/* Listings List */}
      {listings.length > 0 ? (
        <div className="space-y-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Listings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first business listing to start managing your online presence.
              </p>
              <Button asChild>
                <Link href="/dashboard/listings/new">Create Listing</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  valueClass?: string;
}

function StatsCard({ title, value, icon, description, valueClass }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold ${valueClass || ''}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="p-3 bg-muted rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ListingCardProps {
  listing: BusinessListing;
}

function ListingCard({ listing }: ListingCardProps) {
  const address = getFullAddress(listing);
  const accuracyColor = getAccuracyScoreColor(listing.accuracyScore);
  const accuracyLabel = getAccuracyScoreLabel(listing.accuracyScore);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Logo or placeholder */}
            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {listing.logoUrl ? (
                <img
                  src={listing.logoUrl}
                  alt={listing.businessName}
                  className="h-full w-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="h-7 w-7 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{listing.businessName}</h3>
                {listing.potentialDuplicates.length > 0 && (
                  <Badge variant="outline" className="text-xs text-orange-600">
                    {listing.potentialDuplicates.length} duplicate{listing.potentialDuplicates.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {address && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {address}
                </p>
              )}
              {listing.businessWebsite && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {listing.businessWebsite}
                </p>
              )}
            </div>
          </div>

          {/* Accuracy Score and Actions */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className={`text-2xl font-bold ${accuracyColor}`}>
                {listing.accuracyScore}
              </div>
              <p className="text-xs text-muted-foreground">{accuracyLabel}</p>
              <Progress value={listing.accuracyScore} className="h-1 w-20 mt-1" />
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/dashboard/listings/${listing.id}`}>
                Manage
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for dashboard widget
interface ListingsWidgetProps {
  summary: {
    totalListings: number;
    averageAccuracy: number;
    connectedDirectories: number;
    unresolvedAlerts: number;
  };
}

export function ListingsWidget({ summary }: ListingsWidgetProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Business Listings</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/listings">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{summary.totalListings}</p>
            <p className="text-xs text-muted-foreground">Total Listings</p>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${getAccuracyScoreColor(summary.averageAccuracy)}`}>
              {summary.averageAccuracy}%
            </p>
            <p className="text-xs text-muted-foreground">Avg Accuracy</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{summary.connectedDirectories}</p>
            <p className="text-xs text-muted-foreground">Directories</p>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${summary.unresolvedAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {summary.unresolvedAlerts}
            </p>
            <p className="text-xs text-muted-foreground">Alerts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
