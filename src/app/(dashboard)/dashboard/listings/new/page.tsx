import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListingForm } from '@/components/listings/listing-form';

export const metadata = {
  title: 'Create Listing | Business Listings | ReviewHub',
  description: 'Create a new business listing to manage across directories',
};

export default function NewListingPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-1">
          <Link href="/dashboard/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Listing</h1>
          <p className="text-muted-foreground">
            Add a new business location to manage across directories
          </p>
        </div>
      </div>

      {/* Form */}
      <ListingForm mode="create" />
    </div>
  );
}
