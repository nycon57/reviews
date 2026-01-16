import { Metadata } from "next";
import { Suspense } from "react";
import {
  searchLoanOfficers,
  getAvailableStates,
  type SearchFilters,
  type DirectoryLoanOfficer,
} from "@/lib/directory/actions";
import { DirectorySearch } from "@/components/directory";
import { getBaseUrl } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Find a Loan Officer | Mortgage Professional Directory",
  description:
    "Search our directory of trusted mortgage loan officers. Find professionals by location, rating, and specialty. Read reviews and connect with the right loan officer for your home financing needs.",
  keywords: [
    "find loan officer",
    "mortgage professional",
    "loan officer directory",
    "mortgage broker near me",
    "home loan specialist",
    "refinance expert",
    "first time home buyer loan officer",
    "VA loan specialist",
    "FHA loan expert",
  ],
  openGraph: {
    title: "Find a Loan Officer | Mortgage Professional Directory",
    description:
      "Search our directory of trusted mortgage loan officers. Find professionals by location, rating, and specialty.",
    type: "website",
    url: `${getBaseUrl()}/directory`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a Loan Officer | Mortgage Professional Directory",
    description:
      "Search our directory of trusted mortgage loan officers. Find professionals by location, rating, and specialty.",
  },
  alternates: {
    canonical: `${getBaseUrl()}/directory`,
  },
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    state?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}

async function DirectoryContent({ searchParams }: PageProps) {
  const params = await searchParams;

  // Build filters from search params
  const filters: SearchFilters = {
    query: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    minRating: params.rating ? parseFloat(params.rating) : undefined,
    sortBy: (params.sort as "rating" | "reviews" | "name") || "rating",
    sortOrder: "desc",
  };

  const page = params.page ? parseInt(params.page, 10) : 1;

  // Fetch initial data
  const [searchResult, availableStates] = await Promise.all([
    searchLoanOfficers(filters, page, 20),
    getAvailableStates(),
  ]);

  const initialResults = searchResult.success ? searchResult.data?.loanOfficers || [] : [];
  const initialCount = searchResult.success ? searchResult.data?.totalCount || 0 : 0;

  return (
    <DirectorySearch
      initialResults={initialResults}
      initialCount={initialCount}
      availableStates={availableStates}
    />
  );
}

// Generate structured data for the directory page
function generateDirectorySchema(loanOfficers: DirectoryLoanOfficer[], baseUrl: string) {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Mortgage Loan Officer Directory",
    description:
      "Search our directory of trusted mortgage loan officers. Find professionals by location, rating, and specialty.",
    numberOfItems: loanOfficers.length,
    itemListElement: loanOfficers.slice(0, 10).map((lo, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        "@id": `${baseUrl}/lo/${lo.id}`,
        name: lo.full_name,
        jobTitle: lo.title || "Loan Officer",
        url: `${baseUrl}/lo/${lo.id}`,
        ...(lo.photo_url && { image: lo.photo_url }),
        ...(lo.email && { email: lo.email }),
        ...(lo.phone && { telephone: lo.phone }),
        ...(lo.organization && {
          worksFor: {
            "@type": "Organization",
            name: lo.organization.name,
          },
        }),
        ...(lo.average_rating && lo.total_reviews && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(lo.average_rating).toFixed(1),
            reviewCount: lo.total_reviews,
            bestRating: 5,
            worstRating: 1,
          },
        }),
      },
    })),
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/directory`,
    name: "Find a Loan Officer | Mortgage Professional Directory",
    description:
      "Search our directory of trusted mortgage loan officers. Find professionals by location, rating, and specialty.",
    url: `${baseUrl}/directory`,
    isPartOf: {
      "@type": "WebSite",
      "@id": baseUrl,
      name: "RepWell",
      url: baseUrl,
    },
    mainEntity: itemListSchema,
  };

  return [webPageSchema, itemListSchema];
}

function DirectorySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <Skeleton className="mt-4 h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function DirectoryPage(props: PageProps) {
  const params = await props.searchParams;
  const baseUrl = getBaseUrl();

  // Fetch initial data for structured data generation
  const filters: SearchFilters = {
    query: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    minRating: params.rating ? parseFloat(params.rating) : undefined,
    sortBy: (params.sort as "rating" | "reviews" | "name") || "rating",
    sortOrder: "desc",
  };
  const page = params.page ? parseInt(params.page, 10) : 1;
  const searchResult = await searchLoanOfficers(filters, page, 20);
  const loanOfficers = searchResult.success ? searchResult.data?.loanOfficers || [] : [];

  // Generate structured data
  const schemas = generateDirectorySchema(loanOfficers, baseUrl);

  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
      <div className="bg-gradient-to-b from-background to-muted/30">
        {/* Hero Section */}
        <div className="border-b bg-card">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Find a Loan Officer
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect with trusted mortgage professionals in your area. Search by location,
                read reviews, and find the perfect loan officer for your home financing journey.
              </p>
            </div>
          </div>
        </div>

        {/* Directory Content */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Suspense fallback={<DirectorySkeleton />}>
            <DirectoryContent searchParams={props.searchParams} />
          </Suspense>
        </div>

        {/* SEO Content Section */}
        <div className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
              <div>
                <h2 className="text-lg font-semibold mb-3">Why Use Our Directory?</h2>
                <p className="text-sm text-muted-foreground">
                  Our loan officer directory makes it easy to find and compare mortgage professionals.
                  Read real customer reviews, see ratings, and contact loan officers directly.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-3">What to Look For</h2>
                <p className="text-sm text-muted-foreground">
                  Consider loan officers with high ratings, experience in your loan type
                  (FHA, VA, Conventional, Jumbo), and positive customer feedback about
                  communication and closing times.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-3">Getting Started</h2>
                <p className="text-sm text-muted-foreground">
                  Search by your city or state, filter by rating, and browse profiles.
                  Once you find a loan officer you like, call or email them directly to
                  start your home financing process.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
