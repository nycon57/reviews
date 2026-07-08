import { getPublicLOProfile } from "@/lib/seo/actions";
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
    affiliation: "Verified customer reviews for trusted professionals",
    descriptor: "Professional profile",
    monogramSource: "Rep Well",
  });
}

export default async function OpenGraphImage({ params }: RouteParams) {
  const { slug } = await params;
  const result = await getPublicLOProfile(slug);

  if (!result.success || !result.data) {
    return genericCard();
  }

  const { professional, organization } = result.data;
  const affiliation = [
    professional.title,
    organization?.name ? `at ${organization.name}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return buildProfileOpenGraphImage({
    variant: "professional",
    name: professional.full_name,
    affiliation,
    descriptor: "Professional profile",
    rating: professional.average_rating,
    reviewCount: professional.total_reviews,
    imageUrl: professional.photo_url,
    imageAlt: `${professional.full_name} profile photo`,
    monogramSource: professional.full_name,
  });
}
