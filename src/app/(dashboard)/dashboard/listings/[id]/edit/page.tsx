import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getListing } from '@/lib/listings/actions';
import { ListingForm } from '@/components/listings/listing-form';

interface EditListingPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditListingPageProps) {
  const { id } = await params;
  const result = await getListing(id);

  if (!result.success || !result.data) {
    return {
      title: 'Listing Not Found | RepWell',
    };
  }

  return {
    title: `Edit ${result.data.businessName} | Business Listings | RepWell`,
    description: `Edit business listing for ${result.data.businessName}`,
  };
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const result = await getListing(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const listing = result.data;

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href={`/dashboard/listings/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Listing</h1>
          <p className="text-muted-foreground">{listing.businessName}</p>
        </div>
      </div>

      {/* Form */}
      <ListingForm listing={listing} mode="edit" />
    </div>
  );
}
