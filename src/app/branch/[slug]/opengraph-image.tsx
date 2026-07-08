import { getPublicBranchOgCardData } from "@/lib/seo/actions";
import { PROFILE_OG_SIZE, createProfileOgRoute } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = PROFILE_OG_SIZE;
export const contentType = "image/png";

export default createProfileOgRoute({
  fetch: getPublicBranchOgCardData,
  generic: {
    variant: "generic",
    name: "RepWell",
    affiliation: "Verified customer reviews for local branches",
    descriptor: "Branch profile",
    monogramSource: "Rep Well",
  },
  toCard: ({ branch, organization }) => ({
    variant: "branch",
    name: branch.name,
    affiliation: organization?.name ? `Branch of ${organization.name}` : "Verified branch reviews",
    descriptor: "Branch profile",
    rating: branch.average_rating,
    reviewCount: branch.total_reviews,
    imageUrl: branch.cover_image_url || branch.photo_url,
    imageAlt: `${branch.name} branch image`,
    monogramSource: branch.name,
  }),
});
