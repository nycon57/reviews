import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  customerPageConfigs,
  getAllCustomerSlugs,
  getCustomerPageConfig,
} from "@/config/customer-pages";
import { getBaseUrl } from "@/lib/seo";
import { generateBreadcrumbSchema } from "@/lib/seo/schema-generators";
import { CustomerDetailPage } from "@/components/customers/customer-detail-page";

// ---------------------------------------------------------------------------
// Static generation — all case study pages are pre-rendered at build time
// ---------------------------------------------------------------------------

export const dynamic = "force-static";
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return getAllCustomerSlugs().map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = getCustomerPageConfig(slug);
  if (!config) return {};

  const baseUrl = getBaseUrl();
  const canonicalUrl = `${baseUrl}/customers/${slug}`;

  return {
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords as string[],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      url: canonicalUrl,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo.title,
      description: config.seo.description,
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function CustomerSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = customerPageConfigs[slug];

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  // Article JSON-LD schema — safe: content sourced from static build-time
  // config (src/config/customer-pages.ts), not user input.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: config.heroHeadline,
    description: config.seo.description,
    url: `${baseUrl}/customers/${slug}`,
    about: {
      "@type": "Organization",
      name: config.companyName,
    },
    publisher: {
      "@type": "Organization",
      name: "RepWell",
      url: baseUrl,
    },
  };

  // Breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Customer Stories", url: `${baseUrl}/customers` },
    { name: config.companyName, url: `${baseUrl}/customers/${slug}` },
  ]);

  return (
    <>
      {/* Article JSON-LD — content is from static build-time config, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {/* BreadcrumbList JSON-LD — content is from static build-time config, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <CustomerDetailPage config={config} />
    </>
  );
}
