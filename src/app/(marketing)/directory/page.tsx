import { Metadata } from "next";
import { Suspense } from "react";
import {
  searchProfessionals,
  getAvailableStates,
  type SearchFilters,
  type DirectoryProfessional,
} from "@/lib/directory/actions";
import { DirectorySearch } from "@/components/directory";
import { getBaseUrl } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Find a Professional | RepWell Professional Directory",
  description:
    "Search our directory of trusted professionals. Find experts by location, rating, and specialty. Read reviews and connect with the right professional for your needs.",
  keywords: [
    "find professional",
    "professional directory",
    "expert directory",
    "professional near me",
    "specialist",
    "advisor",
    "consultant",
  ],
  openGraph: {
    title: "Find a Professional | RepWell Professional Directory",
    description:
      "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
    type: "website",
    url: `${getBaseUrl()}/directory`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Find a Professional | RepWell Professional Directory",
    description:
      "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
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
    searchProfessionals(filters, page, 20),
    getAvailableStates(),
  ]);

  const initialResults = searchResult.success ? searchResult.data?.professionals || [] : [];
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
function generateDirectorySchema(professionals: DirectoryProfessional[], baseUrl: string) {
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Professional Directory",
    description:
      "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
    numberOfItems: professionals.length,
    itemListElement: professionals.slice(0, 10).map((professional, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        "@id": `${baseUrl}/pro/${professional.id}`,
        name: professional.full_name,
        jobTitle: professional.title || "Professional",
        url: `${baseUrl}/pro/${professional.id}`,
        ...(professional.photo_url && { image: professional.photo_url }),
        ...(professional.email && { email: professional.email }),
        ...(professional.phone && { telephone: professional.phone }),
        ...(professional.organization && {
          worksFor: {
            "@type": "Organization",
            name: professional.organization.name,
          },
        }),
        ...(professional.average_rating && professional.total_reviews && {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(professional.average_rating).toFixed(1),
            reviewCount: professional.total_reviews,
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
    name: "Find a Professional | RepWell Professional Directory",
    description:
      "Search our directory of trusted professionals. Find experts by location, rating, and specialty.",
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
  const searchResult = await searchProfessionals(filters, page, 20);
  const professionals = searchResult.success ? searchResult.data?.professionals || [] : [];

  // Generate structured data
  const schemas = generateDirectorySchema(professionals, baseUrl);

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
                Find a Professional
              </h1>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Connect with trusted professionals in your area. Search by location,
                read reviews, and find the perfect professional for your needs.
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
                  Our professional directory makes it easy to find and compare experts.
                  Read real customer reviews, see ratings, and contact professionals directly.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-3">What to Look For</h2>
                <p className="text-sm text-muted-foreground">
                  Consider professionals with high ratings, experience in your area of need,
                  and positive customer feedback about communication and service quality.
                </p>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-3">Getting Started</h2>
                <p className="text-sm text-muted-foreground">
                  Search by your city or state, filter by rating, and browse profiles.
                  Once you find a professional you like, call or email them directly to
                  get started.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
