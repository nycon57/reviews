'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Tag,
  Image,
} from 'lucide-react';
import { type BusinessListing, formatPhoneNumber, getFullAddress } from '@/lib/listings/types';

interface ListingInfoCardProps {
  listing: BusinessListing;
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm">{value || <span className="text-muted-foreground italic">Not set</span>}</div>
      </div>
    </div>
  );
}

export function ListingInfoCard({ listing }: ListingInfoCardProps) {
  const address = getFullAddress(listing);
  const hasPhotos = listing.logoUrl || listing.coverPhotoUrl || listing.photos.length > 0;
  const hasHours = Object.keys(listing.hoursOfOperation).length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Information</CardTitle>
        <CardDescription>
          NAP data synced across directories
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 divide-y">
        <InfoRow
          icon={<Building2 className="h-4 w-4" />}
          label="Business Name"
          value={listing.businessName}
        />

        <InfoRow
          icon={<Phone className="h-4 w-4" />}
          label="Phone"
          value={formatPhoneNumber(listing.businessPhone)}
        />

        <InfoRow
          icon={<Mail className="h-4 w-4" />}
          label="Email"
          value={listing.businessEmail}
        />

        <InfoRow
          icon={<Globe className="h-4 w-4" />}
          label="Website"
          value={
            listing.businessWebsite ? (
              <a
                href={listing.businessWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {listing.businessWebsite}
              </a>
            ) : null
          }
        />

        <InfoRow
          icon={<MapPin className="h-4 w-4" />}
          label="Address"
          value={address}
        />

        <InfoRow
          icon={<Tag className="h-4 w-4" />}
          label="Categories"
          value={
            listing.businessCategories.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {listing.businessCategories.map((cat) => (
                  <Badge key={cat} variant="secondary" className="text-xs">
                    {cat}
                  </Badge>
                ))}
              </div>
            ) : null
          }
        />

        <InfoRow
          icon={<Tag className="h-4 w-4" />}
          label="Keywords"
          value={
            listing.businessKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {listing.businessKeywords.slice(0, 10).map((keyword) => (
                  <Badge key={keyword} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
                {listing.businessKeywords.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{listing.businessKeywords.length - 10} more
                  </Badge>
                )}
              </div>
            ) : null
          }
        />

        <InfoRow
          icon={<Clock className="h-4 w-4" />}
          label="Hours"
          value={
            hasHours ? (
              <div className="text-xs space-y-0.5">
                {Object.entries(listing.hoursOfOperation).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}</span>
                    <span>
                      {hours?.isClosed
                        ? 'Closed'
                        : `${hours?.open || ''} - ${hours?.close || ''}`}
                    </span>
                  </div>
                ))}
              </div>
            ) : null
          }
        />

        <InfoRow
          icon={<Image className="h-4 w-4" />}
          label="Photos"
          value={
            hasPhotos ? (
              <div className="flex items-center gap-2">
                {listing.logoUrl && (
                  <img
                    src={listing.logoUrl}
                    alt="Logo"
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                {listing.coverPhotoUrl && (
                  <img
                    src={listing.coverPhotoUrl}
                    alt="Cover"
                    className="h-10 w-16 rounded object-cover"
                  />
                )}
                {listing.photos.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{listing.photos.length} photos
                  </Badge>
                )}
              </div>
            ) : null
          }
        />

        {listing.businessDescription && (
          <div className="pt-3">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p className="text-sm text-muted-foreground line-clamp-4">
              {listing.businessDescription}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
