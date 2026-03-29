import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  competitorConfigs,
  competitorSlugs,
  generateFAQPageSchema,
  generateProductSchema,
} from "@/lib/competitor-pages";
import { CompetitorComparisonPage } from "@/components/competitor-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildCompareBreadcrumbs } from "@/lib/seo/marketing-breadcrumbs";
import { MarketingBreadcrumbs } from "@/components/shared/marketing-breadcrumbs";

// ---------------------------------------------------------------------------
// Static generation — all competitor pages are pre-rendered at build time
// ---------------------------------------------------------------------------

/** Ensure these pages are always statically generated (never dynamic). */
export const dynamic = "force-static";

/** Disable ISR — pages are fully static, never revalidated. */
export const revalidate = false;

/** Return 404 for any slug not in generateStaticParams. */
export const dynamicParams = false;

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
  const { items: breadcrumbItems, schema: breadcrumbSchema } = buildCompareBreadcrumbs(config, baseUrl);
  const productSchema = generateProductSchema(config);
  const faqSchema = generateFAQPageSchema(config.faq);

  return (
    <>
      {/* Preload display font for hero heading (LCP element) */}
      <link
        rel="preload"
        href="/fonts/Erstoria.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      {/* Preconnect + dns-prefetch for image CDNs */}
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://temwotqafrafajehuiuh.supabase.co" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://temwotqafrafajehuiuh.supabase.co" />
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
      <MarketingBreadcrumbs items={breadcrumbItems} />
      <CompetitorComparisonPage config={config} />
    </>
  );
}
