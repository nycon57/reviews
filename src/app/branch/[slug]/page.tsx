import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublicBranchProfile } from "@/lib/seo/actions";
import {
  generateBranchProfileMetadata,
  getBaseUrl,
  generateBranchProfilePageSchema,
} from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { BranchProfileContent } from "./branch-profile-content";
import { buildBranchBreadcrumbs } from "@/lib/directory/breadcrumb-utils";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicBranchProfile(slug);

  if (!result.success || !result.data) {
    return {
      title: "Branch Not Found",
      description: "The requested branch profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();

  return generateBranchProfileMetadata(
    result.data.branch,
    result.data.organization,
    baseUrl
  );
}

export default async function BranchProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicBranchProfile(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  // 301 redirect UUID -> slug URL for SEO
  if (result.redirectSlug) {
    redirect(`/branch/${result.redirectSlug}`);
  }

  const { branch, organization, professionals, reviews, is_enterprise } = result.data;
  const baseUrl = getBaseUrl();

  // Build breadcrumbs
  const breadcrumbs = buildBranchBreadcrumbs(
    { name: branch.name, global_slug: branch.global_slug, id: branch.id },
    organization ? { slug: organization.slug, name: organization.name } : null
  );

  // Add is_published and status for schema filtering
  const reviewsWithStatus = reviews.map((r) => ({
    ...r,
    is_published: true,
    status: "approved" as const,
  }));

  // Generate structured data schemas
  const schemas = generateBranchProfilePageSchema(
    {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      global_slug: branch.global_slug,
      description: branch.description,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      website_url: branch.website_url,
      hours_of_operation: branch.hours_of_operation,
      google_maps_url: branch.google_maps_url,
      photo_url: branch.photo_url,
      average_rating: branch.average_rating,
      total_reviews: branch.total_reviews,
    },
    organization,
    professionals,
    reviewsWithStatus,
    baseUrl
  );

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <BranchProfileContent
        branch={branch}
        organization={organization}
        professionals={professionals}
        reviews={reviews}
        breadcrumbs={breadcrumbs}
        isEnterprise={is_enterprise}
      />
    </>
  );
}
