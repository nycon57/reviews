import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllFeaturePageSlugs,
  getFeaturePageConfigBySlug,
} from "@/config/feature-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildFeatureBreadcrumbs } from "@/lib/seo/marketing-breadcrumbs";
import { MarketingBreadcrumbs } from "@/components/shared/marketing-breadcrumbs";
import { FeatureLandingPage } from "./feature-landing-page";

interface PageProps {
  params: Promise<{ feature: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllFeaturePageSlugs();
  return slugs.map((feature) => ({ feature }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { feature } = await params;
  const config = getFeaturePageConfigBySlug(feature);

  if (!config) {
    return {
      title: "Feature Not Found | RepWell",
    };
  }

  return {
    title: config.seo.title,
    description: config.seo.description,
    keywords: config.seo.keywords,
    openGraph: {
      title: config.seo.title,
      description: config.seo.description,
      type: "website",
      siteName: "RepWell",
      images: config.seo.ogImage ? [config.seo.ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo.title,
      description: config.seo.description,
    },
  };
}

export default async function FeaturePage({ params }: PageProps) {
  const { feature } = await params;
  const config = getFeaturePageConfigBySlug(feature);

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const { items, schema } = buildFeatureBreadcrumbs(config, baseUrl);

  return (
    <>
      {/* BreadcrumbList JSON-LD — safe: sourced from static build-time feature config */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <MarketingBreadcrumbs items={items} />
      </div>
      <FeatureLandingPage config={config} />
    </>
  );
}
