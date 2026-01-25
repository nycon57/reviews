import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicLOProfile } from "@/lib/seo/actions";
import {
  generateLOProfileMetadata,
  getBaseUrl,
  generateProfilePageSchema,
} from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { ProProfileContent } from "./pro-profile-content";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getPublicLOProfile(id);

  if (!result.success || !result.data) {
    return {
      title: "Professional Not Found",
      description: "The requested professional profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();

  return generateLOProfileMetadata(
    result.data.professional,
    result.data.organization,
    baseUrl
  );
}

export default async function LOProfilePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getPublicLOProfile(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const { professional, organization, reviews, featuredReviews, businessHours } = result.data;
  const baseUrl = getBaseUrl();

  // Add is_published and status for schema filtering
  const reviewsWithStatus = reviews.map((r) => ({
    ...r,
    is_published: true,
    status: "approved" as const,
  }));

  // Generate structured data schemas
  const schemas = generateProfilePageSchema(
    professional,
    organization,
    reviewsWithStatus,
    baseUrl
  );

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <ProProfileContent
        professional={professional}
        organization={organization}
        reviews={reviews}
        featuredReviews={featuredReviews}
        businessHours={businessHours}
      />
    </>
  );
}
