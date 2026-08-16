import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAllIntegrationSlugs,
  getIntegrationBySlug,
} from "@/config/integration-pages";
import { getBaseUrl } from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import {
  generateIntegrationSchema,
  generateIntegrationBreadcrumbs,
} from "@/lib/integrations/schema-generators";
import { IntegrationDetailPage } from "./integration-detail-page";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getAllIntegrationSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const config = getIntegrationBySlug(slug);

  if (!config) {
    return {
      title: "Integration Not Found | RepWell",
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
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo.title,
      description: config.seo.description,
    },
  };
}

export default async function IntegrationPage({ params }: PageProps) {
  const { slug } = await params;
  const config = getIntegrationBySlug(slug);

  if (!config) {
    notFound();
  }

  const baseUrl = getBaseUrl();

  return (
    <>
      <MultiSchemaStructuredData
        schemas={[
          generateIntegrationSchema(config, baseUrl),
          generateIntegrationBreadcrumbs(config, baseUrl),
        ]}
      />
      <IntegrationDetailPage config={config} />
    </>
  );
}
