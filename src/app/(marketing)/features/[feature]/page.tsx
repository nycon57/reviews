import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllFeaturePageSlugs,
  getFeaturePageConfigBySlug,
} from "@/config/feature-pages";
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

  return <FeatureLandingPage config={config} />;
}
