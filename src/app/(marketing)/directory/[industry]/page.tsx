import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  searchProfessionals,
  getAvailableStates,
  getAvailableIndustries,
  type SearchFilters,
  type DirectoryProfessional,
} from "@/lib/directory/actions";
import { DirectorySearch } from "@/components/directory";
import { getBaseUrl } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { IndustryFilter, industryFilterConfig } from "@/components/directory/industry-filter";
import { DirectoryBreadcrumbs } from "@/components/shared/directory-breadcrumbs";
import {
  buildIndustryBreadcrumbs,
  parseIndustrySlug,
  getIndustryLabel,
} from "@/lib/directory/breadcrumb-utils";
import type { IndustryType } from "@/lib/industry/types";
import { getIndustryConfig } from "@/lib/industry/configs";
import {
  MagnifyingGlass,
  Star,
  MapPin,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";

interface PageProps {
  params: Promise<{
    industry: string;
  }>;
  searchParams: Promise<{
    q?: string;
    city?: string;
    state?: string;
    rating?: string;
    sort?: string;
    page?: string;
  }>;
}

// Generate static params for all industries
export async function generateStaticParams() {
  return Object.values(industryFilterConfig).map(({ slug }) => ({
    industry: slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry: industrySlug } = await params;
  const industry = parseIndustrySlug(industrySlug);

  if (!industry) {
    return {
      title: "Industry Not Found",
      robots: { index: false, follow: false },
    };
  }

  const config = getIndustryConfig(industry);
  const label = getIndustryLabel(industry);
  const baseUrl = getBaseUrl();

  return {
    title: `Find ${config.labels.professionalPlural} | ${label} Professionals Directory`,
    description: `Search our directory of trusted ${config.labels.professionalPlural.toLowerCase()}. Find ${label.toLowerCase()} experts by location, rating, and specialty. Read reviews and connect with the right professional for your needs.`,
    keywords: [
      `find ${config.labels.professional.toLowerCase()}`,
      `${label.toLowerCase()} professionals`,
      `${config.labels.professional.toLowerCase()} near me`,
      `${label.toLowerCase()} directory`,
      `${config.labels.professional.toLowerCase()} reviews`,
    ],
    openGraph: {
      title: `Find ${config.labels.professionalPlural} | ${label} Professionals Directory`,
      description: `Search our directory of trusted ${config.labels.professionalPlural.toLowerCase()}. Find ${label.toLowerCase()} experts by location and rating.`,
      type: "website",
      url: `${baseUrl}/directory/${industrySlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `Find ${config.labels.professionalPlural} | ${label} Professionals Directory`,
      description: `Search our directory of trusted ${config.labels.professionalPlural.toLowerCase()}.`,
    },
    alternates: {
      canonical: `${baseUrl}/directory/${industrySlug}`,
    },
  };
}

async function IndustryDirectoryContent({
  industry,
  searchParams,
}: {
  industry: IndustryType;
  searchParams: PageProps["searchParams"];
}) {
  const params = await searchParams;

  // Build filters from search params with industry pre-filter
  const filters: SearchFilters = {
    query: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    minRating: params.rating ? parseFloat(params.rating) : undefined,
    sortBy: (params.sort as "rating" | "reviews" | "name") || "rating",
    sortOrder: "desc",
    industry, // Pre-filter by industry
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
      industryFilter={industry}
    />
  );
}

// Generate structured data for the industry directory page
function generateIndustryDirectorySchema(
  industry: IndustryType,
  professionals: DirectoryProfessional[],
  baseUrl: string
) {
  const config = getIndustryConfig(industry);
  const label = getIndustryLabel(industry);
  const slug = industryFilterConfig[industry]?.slug || industry;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${label} Professional Directory`,
    description: `Find trusted ${config.labels.professionalPlural.toLowerCase()} in our directory. Search by location and rating.`,
    numberOfItems: professionals.length,
    itemListElement: professionals.slice(0, 10).map((professional, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Person",
        "@id": `${baseUrl}/pro/${professional.id}`,
        name: professional.full_name,
        jobTitle: professional.title || config.labels.professional,
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
        ...(professional.average_rating &&
          professional.total_reviews && {
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

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Find a Professional",
        item: `${baseUrl}/directory`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `${baseUrl}/directory/${slug}`,
      },
    ],
  };

  const webPageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${baseUrl}/directory/${slug}`,
    name: `Find ${config.labels.professionalPlural} | ${label} Professionals Directory`,
    description: `Search our directory of trusted ${config.labels.professionalPlural.toLowerCase()}.`,
    url: `${baseUrl}/directory/${slug}`,
    breadcrumb: breadcrumbSchema,
    isPartOf: {
      "@type": "WebSite",
      "@id": baseUrl,
      name: "RepWell",
      url: baseUrl,
    },
    mainEntity: itemListSchema,
  };

  return [webPageSchema, itemListSchema, breadcrumbSchema];
}

function DirectorySkeleton() {
  return (
    <div className="space-y-6">
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-11 flex-1 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-40 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-40 bg-repwell-sage-100/30" />
            <Skeleton className="h-11 w-24 bg-repwell-sage-100/30" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="border-border rounded-xl shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-16 w-16 rounded-full bg-repwell-sage-100/30" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32 bg-repwell-sage-100/30" />
                  <Skeleton className="h-4 w-24 bg-repwell-sage-100/30" />
                </div>
              </div>
              <Skeleton className="mt-4 h-4 w-40 bg-repwell-sage-100/30" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function IndustryDirectoryPage(props: PageProps) {
  const { industry: industrySlug } = await props.params;
  const industry = parseIndustrySlug(industrySlug);

  if (!industry) {
    notFound();
  }

  const config = getIndustryConfig(industry);
  const label = getIndustryLabel(industry);
  const baseUrl = getBaseUrl();
  const breadcrumbs = buildIndustryBreadcrumbs(industry);

  // Fetch data for structured data and industry filter
  const params = await props.searchParams;
  const filters: SearchFilters = {
    query: params.q || undefined,
    city: params.city || undefined,
    state: params.state || undefined,
    minRating: params.rating ? parseFloat(params.rating) : undefined,
    sortBy: (params.sort as "rating" | "reviews" | "name") || "rating",
    sortOrder: "desc",
    industry,
  };
  const page = params.page ? parseInt(params.page, 10) : 1;

  const [searchResult, availableIndustries] = await Promise.all([
    searchProfessionals(filters, page, 20),
    getAvailableIndustries(),
  ]);

  const professionals = searchResult.success ? searchResult.data?.professionals || [] : [];

  // Generate structured data
  const schemas = generateIndustryDirectorySchema(industry, professionals, baseUrl);

  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
      <div className="bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-repwell-sage-100/20 to-transparent pt-16 pb-12 md:pt-24 md:pb-16">
          {/* Background decorations */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-4 h-4 bg-repwell-teal-300 rounded-full opacity-40" />
            <div className="absolute top-40 right-20 w-3 h-3 bg-repwell-sage-200 rounded-full opacity-30" />
            <div className="absolute bottom-32 left-1/4 w-4 h-4 bg-repwell-sage-100 transform rotate-12 opacity-50" />
            <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-repwell-teal-300/30 transform rotate-45" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Breadcrumbs */}
            <DirectoryBreadcrumbs items={breadcrumbs} className="mb-6" />

            <div className="text-center max-w-3xl mx-auto">
              {/* Eyebrow */}
              <span className="inline-flex items-center gap-2 font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 mb-4">
                <MagnifyingGlass weight="bold" size={14} />
                {label} Directory
              </span>

              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-repwell-teal-500 mb-6">
                Find{" "}
                <span className="text-repwell-sage-200">{config.labels.professionalPlural}</span>
              </h1>

              <p className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed max-w-2xl mx-auto">
                Connect with trusted {label.toLowerCase()} professionals in your area.
                Search by location, read reviews, and find the perfect{" "}
                {config.labels.professional.toLowerCase()} for your needs.
              </p>
            </div>

            {/* Industry Filter */}
            <div className="mt-10 flex justify-center">
              <IndustryFilter
                selected={industry}
                industries={availableIndustries}
                mode="link"
              />
            </div>
          </div>
        </section>

        {/* Directory Content */}
        <section className="py-8 md:py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Suspense fallback={<DirectorySkeleton />}>
              <IndustryDirectoryContent
                industry={industry}
                searchParams={props.searchParams}
              />
            </Suspense>
          </div>
        </section>

        {/* Features/Benefits Section */}
        <section className="py-16 md:py-24 bg-repwell-sage-100/20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 mb-4 block">
                Why RepWell
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
                Find the Right {config.labels.professional}
              </h2>
              <p className="font-sans text-lg text-repwell-teal-400">
                Our directory helps you make informed decisions with verified reviews and ratings.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="bg-white border border-border rounded-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-repwell-sage-100/50 rounded-xl flex items-center justify-center mb-6">
                  <Star weight="duotone" size={24} className="text-repwell-teal-300" />
                </div>
                <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-3">
                  Why Choose Our {label} Directory?
                </h3>
                <p className="font-sans text-repwell-teal-400 leading-relaxed">
                  Our {label.toLowerCase()} professional directory makes it easy to find
                  and compare {config.labels.professionalPlural.toLowerCase()}. Read real
                  customer reviews, see ratings, and contact professionals directly.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white border border-border rounded-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-repwell-sage-100/50 rounded-xl flex items-center justify-center mb-6">
                  <CheckCircle weight="duotone" size={24} className="text-repwell-teal-300" />
                </div>
                <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-3">
                  What to Look For
                </h3>
                <p className="font-sans text-repwell-teal-400 leading-relaxed">
                  Consider {config.labels.professionalPlural.toLowerCase()} with high
                  ratings, experience in your specific needs, and positive customer
                  feedback about communication and service quality.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white border border-border rounded-xl p-6 lg:p-8 shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="w-12 h-12 bg-repwell-sage-100/50 rounded-xl flex items-center justify-center mb-6">
                  <MapPin weight="duotone" size={24} className="text-repwell-teal-300" />
                </div>
                <h3 className="font-sans text-xl font-semibold text-repwell-teal-500 mb-3">
                  Getting Started
                </h3>
                <p className="font-sans text-repwell-teal-400 leading-relaxed">
                  Search by your city or state, filter by rating, and browse profiles.
                  Once you find a {config.labels.professional.toLowerCase()} you like,
                  contact them directly to get started.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative bg-repwell-teal-500 rounded-3xl overflow-hidden px-8 py-16 md:px-16 md:py-20">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-repwell-teal-400/50 to-transparent" />

              <div className="relative text-center max-w-2xl mx-auto">
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                  Are you a {config.labels.professional.toLowerCase()}?
                </h2>
                <p className="font-sans text-lg text-repwell-sage-100/80 mb-10">
                  Join RepWell to showcase your expertise, collect reviews, and grow your reputation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-repwell-sage-100 text-repwell-teal-500 font-sans font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Join the Directory
                  </a>
                  <a
                    href="/features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-white/10 text-white font-sans font-semibold text-sm border-2 border-white rounded-lg transition-all duration-200"
                  >
                    Learn More
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
