import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicOrganizationProfile } from "@/lib/seo/actions";
import {
  generateOrganizationProfileMetadata,
  getBaseUrl,
  generateOrganizationProfilePageSchema,
} from "@/lib/seo";
import { MultiSchemaStructuredData } from "@/components/seo/structured-data";
import { OrganizationProfileContent } from "./organization-profile-content";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicOrganizationProfile(slug);

  if (!result.success || !result.data) {
    return {
      title: "Organization Not Found",
      description: "The requested organization profile could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseUrl();

  return generateOrganizationProfileMetadata(result.data.organization, baseUrl);
}

export default async function OrganizationProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicOrganizationProfile(slug);

  if (!result.success || !result.data) {
    notFound();
  }

  const { organization, branches, featuredLoanOfficers, testimonials } = result.data;
  const baseUrl = getBaseUrl();

  // Generate structured data schemas
  const schemas = generateOrganizationProfilePageSchema(
    {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      domain: organization.domain,
      logo_url: organization.logo_url,
      description: organization.description,
      mission_statement: organization.mission_statement,
      website_url: organization.website_url,
      headquarters_address: organization.headquarters_address,
      aggregate_rating: organization.aggregate_rating,
      total_reviews: organization.total_reviews,
      total_branches: organization.total_branches,
      total_loan_officers: organization.total_loan_officers,
    },
    branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
    })),
    featuredLoanOfficers.map((lo) => ({
      id: lo.id,
      full_name: lo.full_name,
      title: lo.title,
    })),
    testimonials.map((t) => ({
      id: t.id,
      customer_name: t.customer_name,
      customer_location: t.customer_location,
      rating: t.rating,
      text: t.text,
      review_date: t.review_date,
    })),
    baseUrl
  );

  return (
    <>
      <MultiSchemaStructuredData schemas={schemas} />
      <OrganizationProfileContent
        organization={organization}
        branches={branches}
        featuredLoanOfficers={featuredLoanOfficers}
        testimonials={testimonials}
      />
    </>
  );
}
