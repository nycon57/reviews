import type {
  CompanyDetail,
  ProfessionalDetail,
  ProfessionalReview,
} from "@/lib/api-v2";

export function toWebMcpProfessionalProfile(professional: ProfessionalDetail) {
  return {
    id: professional.id,
    full_name: professional.full_name,
    title: professional.title,
    company_name: professional.company_name,
    industry: professional.industry,
    location: professional.location,
    average_rating: professional.average_rating,
    total_reviews: professional.total_reviews,
    profile_url: professional.profile_url,
  };
}

export function toWebMcpReviewSummary(review: ProfessionalReview) {
  return {
    id: review.id,
    rating: review.rating,
    review_text: review.review_text,
    reviewer_name: review.reviewer_name,
    review_date: review.review_date,
    platform: review.platform,
  };
}

export function toWebMcpCompanyProfile(company: CompanyDetail) {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    industry: company.industry,
    logo_url: company.logo_url,
    website_url: company.website_url,
    professional_count: company.professional_count,
    avg_team_rating: company.avg_team_rating,
    total_team_reviews: company.total_team_reviews,
  };
}
