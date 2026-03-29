import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllSolutionPageSlugs,
  getSolutionPageConfigBySlug,
} from "@/config/solution-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildSolutionBreadcrumbs } from "@/lib/seo/marketing-breadcrumbs";
import { MarketingBreadcrumbs } from "@/components/shared/marketing-breadcrumbs";
import { SolutionLandingPage } from "./solution-landing-page";

interface PageProps {
  params: Promise<{ solution: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllSolutionPageSlugs();
  return slugs.map((solution) => ({ solution }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { solution } = await params;
  const config = getSolutionPageConfigBySlug(solution);

  if (!config) {
    return {
      title: "Solution Not Found | RepWell",
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

export default async function SolutionPage({ params }: PageProps) {
  const { solution } = await params;
  const config = getSolutionPageConfigBySlug(solution);

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const { items, schema } = buildSolutionBreadcrumbs(config, baseUrl);

  return (
    <>
      {/* BreadcrumbList JSON-LD — safe: sourced from static build-time solution config */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
        <MarketingBreadcrumbs items={items} />
      </div>
      <SolutionLandingPage config={config} />
    </>
  );
}
