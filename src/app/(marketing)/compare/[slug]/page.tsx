import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  competitorConfigs,
  competitorSlugs,
  generateBreadcrumbListSchema,
  generateFAQPageSchema,
  generateProductSchema,
} from "@/lib/competitor-pages";
import { CompetitorComparisonPage } from "@/components/competitor-pages";
import { getBaseUrl } from "@/lib/seo";

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

export function generateStaticParams(): Array<{ slug: string }> {
  return competitorSlugs.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// SEO metadata (per-page title, description, OG, Twitter, canonical)
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const config = competitorConfigs[slug];
  if (!config) return {};

  const baseUrl = getBaseUrl();
  const canonicalUrl = config.seo.canonicalUrl ?? `${baseUrl}/compare/${slug}`;
  const ogImage =
    config.seo.ogImage ?? `${baseUrl}/images/og/compare-default.png`;

  return {
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      url: canonicalUrl,
      type: "website",
      images: [
        { url: ogImage, width: 1200, height: 630, alt: config.seo.title },
      ],
    },
    twitter: {
      card: config.seo.twitterCard ?? "summary_large_image",
      title: config.seo.title,
      description: config.seo.description,
      images: [ogImage],
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function CompareSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = competitorConfigs[slug];

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const breadcrumbSchema = generateBreadcrumbListSchema(config, baseUrl);
  const productSchema = generateProductSchema(config);
  const faqSchema = generateFAQPageSchema(config.faq);

  return (
    <>
      {/* FAQPage JSON-LD — safe: content sourced from static build-time competitor config, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* BreadcrumbList JSON-LD — safe: content sourced from static build-time competitor config, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* Product + AggregateRating JSON-LD — safe: content sourced from static build-time competitor config, not user input */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <CompetitorComparisonPage config={config} />
    </>
  );
}
