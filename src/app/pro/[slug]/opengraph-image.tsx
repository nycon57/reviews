import { getPublicProfessionalOgCardData } from "@/lib/seo/actions";
import { PROFILE_OG_SIZE, createProfileOgRoute } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;
export const size = PROFILE_OG_SIZE;
export const contentType = "image/png";

export default createProfileOgRoute({
  fetch: getPublicProfessionalOgCardData,
  generic: {
    variant: "generic",
    name: "RepWell",
    affiliation: "Verified customer reviews for trusted professionals",
    descriptor: "Professional profile",
    monogramSource: "Rep Well",
  },
  toCard: ({ professional, organization }) => {
    const affiliation = [
      professional.title,
      organization?.name ? `at ${organization.name}` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      variant: "professional",
      name: professional.full_name,
      affiliation,
      descriptor: "Professional profile",
      rating: professional.average_rating,
      reviewCount: professional.total_reviews,
      imageUrl: professional.photo_url,
      imageAlt: `${professional.full_name} profile photo`,
      monogramSource: professional.full_name,
    };
  },
});
