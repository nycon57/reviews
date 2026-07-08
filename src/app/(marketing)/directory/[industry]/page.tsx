import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { DirectoryPageShell } from "@/components/directory/directory-page-shell";
import { generateDirectorySchemas } from "@/components/directory/directory-schema";
import { DirectorySearchContent } from "@/components/directory/directory-search-content";
import { DirectorySkeleton } from "@/components/directory/directory-skeleton";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { cachedGetAvailableIndustries, cachedSearchProfessionals } from "@/lib/directory/cached";
import {
  buildIndustryBreadcrumbs,
  getIndustryLabel,
  getIndustrySlug,
  parseIndustrySlug,
} from "@/lib/directory/breadcrumb-utils";
import {
  buildDirectorySearchRequest,
  type DirectorySearchParams,
} from "@/lib/directory/search-params";
import { getIndustryConfig, getSupportedIndustries } from "@/lib/industry/configs";
import { getBaseUrl } from "@/lib/seo";

interface PageProps {
  params: Promise<{
    industry: string;
  }>;
  searchParams: Promise<DirectorySearchParams>;
}

export async function generateStaticParams() {
  return getSupportedIndustries().map((industry) => ({
    industry: getIndustrySlug(industry),
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
  const params = await props.searchParams;
  const searchRequest = buildDirectorySearchRequest(params, industry);

  const [searchResult, availableIndustries] = await Promise.all([
    cachedSearchProfessionals(
      searchRequest.filters,
      searchRequest.page,
      searchRequest.pageSize
    ),
    cachedGetAvailableIndustries(),
  ]);

  const professionals = searchResult.success ? searchResult.data?.professionals || [] : [];
  const schemas = generateDirectorySchemas({
    professionals,
    baseUrl,
    industry,
  });

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <DirectoryPageShell
        industryContext={{
          industry,
          label,
          professional: config.labels.professional,
          professionalPlural: config.labels.professionalPlural,
          breadcrumbs,
          availableIndustries,
        }}
      >
        <Suspense fallback={<DirectorySkeleton />}>
          <DirectorySearchContent searchRequest={searchRequest} industry={industry} />
        </Suspense>
      </DirectoryPageShell>
    </>
  );
}
