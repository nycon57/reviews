import { getPublicOrganizationOgCardData } from "@/lib/seo/actions";
import { PROFILE_OG_SIZE, createProfileOgRoute } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = PROFILE_OG_SIZE;
export const contentType = "image/png";

export default createProfileOgRoute({
  fetch: getPublicOrganizationOgCardData,
  generic: {
    variant: "generic",
    name: "RepWell",
    affiliation: "Verified customer reviews for trusted organizations",
    descriptor: "Organization profile",
    monogramSource: "Rep Well",
  },
  toCard: ({ organization }) => ({
    variant: "organization",
    name: organization.name,
    affiliation: "Verified organization reviews and locations",
    descriptor: "Organization profile",
    rating: organization.aggregate_rating,
    reviewCount: organization.total_reviews,
    imageUrl: organization.logo_url,
    imageAlt: `${organization.name} logo`,
    monogramSource: organization.name,
  }),
});
