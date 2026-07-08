import { Metadata } from "next";
import { Suspense } from "react";

import { DirectoryPageShell } from "@/components/directory/directory-page-shell";
import { generateDirectorySchemas } from "@/components/directory/directory-schema";
import { DirectorySearchContent } from "@/components/directory/directory-search-content";
import { DirectorySkeleton } from "@/components/directory/directory-skeleton";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { cachedSearchProfessionals } from "@/lib/directory/cached";
import {
  buildDirectorySearchRequest,
  type DirectorySearchParams,
} from "@/lib/directory/search-params";
import { getBaseUrl } from "@/lib/seo";

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
  searchParams: Promise<DirectorySearchParams>;
}

export default async function DirectoryPage(props: PageProps) {
  const params = await props.searchParams;
  const searchRequest = buildDirectorySearchRequest(params);
  const baseUrl = getBaseUrl();

  const searchResult = await cachedSearchProfessionals(searchRequest.cacheKey);
  const professionals = searchResult.success ? searchResult.data?.professionals || [] : [];
  const schemas = generateDirectorySchemas({ professionals, baseUrl });

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <DirectoryPageShell>
        <Suspense fallback={<DirectorySkeleton />}>
          <DirectorySearchContent searchRequest={searchRequest} />
        </Suspense>
      </DirectoryPageShell>
    </>
  );
}
