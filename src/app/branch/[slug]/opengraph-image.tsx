import { getPublicBranchProfile } from "@/lib/seo/actions";
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
    affiliation: "Verified customer reviews for local branches",
    descriptor: "Branch profile",
    monogramSource: "Rep Well",
  });
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { slug } = await params;
  const result = await getPublicBranchProfile(slug);

  if (!result.success || !result.data) {
    return genericCard();
  }

  const { branch, organization } = result.data;

  return buildProfileOpenGraphImage({
    variant: "branch",
    name: branch.name,
    affiliation: organization?.name ? `Branch of ${organization.name}` : "Verified branch reviews",
    descriptor: "Branch profile",
    rating: branch.average_rating,
    reviewCount: branch.total_reviews,
    imageUrl: branch.cover_image_url || branch.photo_url,
    imageAlt: `${branch.name} branch image`,
    monogramSource: branch.name,
  });
}
