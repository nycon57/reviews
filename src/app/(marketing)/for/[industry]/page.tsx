import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllIndustryPageSlugs,
  getIndustryPageConfigBySlug,
} from "@/config/industry-pages";
import { getBaseUrl } from "@/lib/seo";
import { buildIndustryBreadcrumbs } from "@/lib/seo/marketing-breadcrumbs";
import { IndustryLandingPage } from "./industry-landing-page";

interface PageProps {
  params: Promise<{ industry: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllIndustryPageSlugs();
  return slugs.map((industry) => ({ industry }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { industry } = await params;
  const config = getIndustryPageConfigBySlug(industry);

  if (!config) {
    return {
      title: "Industry Not Found | RepWell",
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

export default async function IndustryPage({ params }: PageProps) {
  const { industry } = await params;
  const config = getIndustryPageConfigBySlug(industry);

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();
  const { schema } = buildIndustryBreadcrumbs(config, baseUrl);

  return (
    <>
      {/* BreadcrumbList JSON-LD is sourced from static build-time industry config. */}
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
      <IndustryLandingPage config={config} />
    </>
  );
}
