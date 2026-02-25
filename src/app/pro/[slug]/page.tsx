import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicLOProfile } from "@/lib/seo/actions";
import {
  generateLOProfileMetadata,
  getBaseUrl,
  generateProfilePageSchema,
} from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { ProProfileContent } from "./pro-profile-content";
import { buildProfessionalBreadcrumbs } from "@/lib/directory/breadcrumb-utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Check if a string is a valid UUID v4
 */
function isUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicLOProfile(slug);

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
  const { slug } = await params;
  const result = await getPublicLOProfile(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const { professional, organization, branch, reviews, featuredReviews, businessHours, is_enterprise, is_pro } = result.data;

  // If accessed via UUID and user has a slug, redirect to the SEO-friendly URL
  if (isUUID(slug) && professional.slug) {
    redirect(`/pro/${professional.slug}`);
  }

  const baseUrl = getBaseUrl();

  // Build breadcrumbs for navigation — only link to org page for enterprise accounts (href present)
  const breadcrumbs = buildProfessionalBreadcrumbs(
    { id: professional.id, full_name: professional.full_name, slug: professional.slug },
    organization?.href
      ? {
          slug: organization.slug,
          name: organization.name,
          industry: organization.industry,
        }
      : null
  );

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
        branch={branch}
        reviews={reviews}
        featuredReviews={featuredReviews}
        businessHours={businessHours}
        breadcrumbs={breadcrumbs}
        isEnterprise={is_enterprise}
        isPro={is_pro}
      />
    </>
  );
}
