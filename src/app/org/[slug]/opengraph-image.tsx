import { getPublicOrganizationProfile } from "@/lib/seo/actions";
import {
  PROFILE_OG_SIZE,
  buildProfileOpenGraphImage,
} from "@/lib/seo/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = PROFILE_OG_SIZE;
export const contentType = "image/png";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

function genericCard() {
  return buildProfileOpenGraphImage({
    variant: "generic",
    name: "RepWell",
    affiliation: "Verified customer reviews for trusted organizations",
    descriptor: "Organization profile",
    monogramSource: "Rep Well",
  });
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { slug } = await params;
  const result = await getPublicOrganizationProfile(slug);

  if (!result.success || !result.data) {
    return genericCard();
  }

  const { organization } = result.data;

  return buildProfileOpenGraphImage({
    variant: "organization",
    name: organization.name,
    affiliation: "Verified organization reviews and locations",
    descriptor: "Organization profile",
    rating: organization.aggregate_rating,
    reviewCount: organization.total_reviews,
    imageUrl: organization.logo_url,
    imageAlt: `${organization.name} logo`,
    monogramSource: organization.name,
  });
}
