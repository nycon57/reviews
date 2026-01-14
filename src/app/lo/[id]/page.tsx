import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicLOProfile } from "@/lib/seo/actions";
import {
  generateLOProfileMetadata,
  getBaseUrl,
  generateProfilePageSchema,
} from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { LOProfileContent } from "./lo-profile-content";

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
      title: "Loan Officer Not Found",
      description: "The requested loan officer profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();

  return generateLOProfileMetadata(
    result.data.loanOfficer,
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

  const { loanOfficer, organization, reviews } = result.data;
  const baseUrl = getBaseUrl();

  // Add is_published and status for schema filtering
  const reviewsWithStatus = reviews.map((r) => ({
    ...r,
    is_published: true,
    status: "approved" as const,
  }));

  // Generate structured data schemas
  const schemas = generateProfilePageSchema(
    loanOfficer,
    organization,
    reviewsWithStatus,
    baseUrl
  );

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <LOProfileContent
        loanOfficer={loanOfficer}
        organization={organization}
        reviews={reviews}
      />
    </>
  );
}
