import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/seo";
import { applyPublicProfessionalFilters } from "@/lib/users/public-visibility";
import type { Database, Json, Tables } from "@/types/database.types";
import {
  escapeLike,
  paginateArray,
  parseDateParam,
  parseEnumParam,
  parsePaginationParams,
  parseRatingParam,
  type PaginationParams,
  type ValidationResult,
} from "./params";

type UserRow = Pick<
  Tables<"users">,
  | "id"
  | "slug"
  | "full_name"
  | "title"
  | "bio"
  | "photo_url"
  | "avatar_url"
  | "nmls_id"
  | "nps_score"
  | "reputation_score"
  | "average_rating"
  | "total_reviews"
  | "industry"
  | "branch"
  | "address"
  | "organization_id"
  | "linkedin_url"
  | "facebook_url"
  | "instagram_url"
  | "twitter_url"
  | "personal_website_url"
  | "updated_at"
>;

type OrganizationRow = Pick<
  Tables<"organizations">,
  "id" | "name" | "slug" | "industry" | "logo_url" | "website_url"
>;

type ReviewRow = Pick<
  Tables<"reviews">,
  | "id"
  | "user_id"
  | "organization_id"
  | "rating"
  | "text"
  | "customer_name"
  | "review_date"
  | "source"
  | "sentiment_label"
  | "key_phrases"
  | "verified_at"
>;

type UserWithOrganization = UserRow & {
  organizations?: OrganizationRow | OrganizationRow[] | null;
};

type ReviewWithProfessional = ReviewRow & {
  professional?: UserWithOrganization | UserWithOrganization[] | null;
};

type OrganizationReviewRollupRow =
  Database["public"]["Views"]["organization_review_rollups"]["Row"];

export interface ProfessionalSummary {
  id: string;
  full_name: string;
  title: string | null;
  company_name: string | null;
  industry: string | null;
  location: string | null;
  average_rating: number | null;
  total_reviews: number;
  profile_url: string;
}

export interface ProfessionalDetail extends ProfessionalSummary {
  bio: string | null;
  photo_url: string | null;
  social_links: Record<string, string>;
  nmls_id: string | null;
  nps_score: number | null;
  reputation_score: number | null;
  reviews: ProfessionalReview[];
  rating_distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  recency_stats: {
    reviews_last_30_days: number;
    reviews_last_90_days: number;
    reviews_last_year: number;
  };
}

export interface ProfessionalReview {
  id: string;
  rating: number;
  review_text: string | null;
  reviewer_name: string | null;
  review_date: string;
  platform: string;
  sentiment_label: string | null;
  key_phrases: string[] | null;
  verified?: boolean;
}

export interface CrossProfessionalReview extends Omit<ProfessionalReview, "verified"> {
  professional: {
    id: string;
    full_name: string;
    title: string | null;
    company_name: string | null;
    profile_url: string;
  };
}

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  logo_url: string | null;
  website_url: string | null;
  professional_count: number;
  avg_team_rating: number | null;
  total_team_reviews: number;
}

export interface CompanyDetail extends CompanySummary {
  team: Array<{
    id: string;
    full_name: string;
    title: string | null;
    average_rating: number | null;
    total_reviews: number;
    profile_url: string;
  }>;
}

export type ProfessionalSearchSort = "rating" | "reviews" | "recent";
export type ReviewSort = "date_desc" | "date_asc" | "rating_desc" | "rating_asc";
export type CompanySort = "rating" | "size" | "reviews";

const PROFESSIONAL_SELECT = `
  id,
  slug,
  full_name,
  title,
  bio,
  photo_url,
  avatar_url,
  nmls_id,
  nps_score,
  reputation_score,
  average_rating,
  total_reviews,
  industry,
  branch,
  address,
  organization_id,
  linkedin_url,
  facebook_url,
  instagram_url,
  twitter_url,
  personal_website_url,
  updated_at,
  organizations!inner (
    id,
    name,
    slug,
    industry,
    logo_url,
    website_url
  )
`;

const REVIEW_SELECT = `
  id,
  user_id,
  organization_id,
  rating,
  text,
  customer_name,
  review_date,
  source,
  sentiment_label,
  key_phrases,
  verified_at
`;

const CROSS_REVIEW_SELECT = `
  ${REVIEW_SELECT},
  professional:users!reviews_user_id_fkey!inner (
    ${PROFESSIONAL_SELECT}
  )
`;

function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

function invalid<T>(message: string): ValidationResult<T> {
  return { ok: false, message };
}

function getEmbeddedOrganization(row: UserWithOrganization): OrganizationRow | null {
  const org = row.organizations;
  if (Array.isArray(org)) return org[0] ?? null;
  return org ?? null;
}

function getAddressPart(address: Json | null, key: "city" | "state"): string | null {
  if (!address || typeof address !== "object" || Array.isArray(address)) return null;
  const value = (address as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getLocation(row: UserRow): string | null {
  const city = getAddressPart(row.address, "city");
  const state = getAddressPart(row.address, "state");
  const addressLocation = [city, state].filter(Boolean).join(", ");
  return addressLocation || row.branch || null;
}

function profileUrl(row: Pick<UserRow, "id" | "slug">): string {
  return `${getBaseUrl()}/pro/${row.slug || row.id}`;
}

function normalizeName(value: string | null): string {
  return value?.trim() || "Unknown";
}

function toProfessionalSummary(row: UserWithOrganization): ProfessionalSummary {
  const organization = getEmbeddedOrganization(row);
  return {
    id: row.id,
    full_name: normalizeName(row.full_name),
    title: row.title,
    company_name: organization?.name ?? null,
    industry: row.industry ?? organization?.industry ?? null,
    location: getLocation(row),
    average_rating: row.average_rating,
    total_reviews: row.total_reviews ?? 0,
    profile_url: profileUrl(row),
  };
}

function toProfessionalReview(row: ReviewRow): ProfessionalReview {
  return {
    id: row.id,
    rating: row.rating,
    review_text: row.text,
    reviewer_name: row.customer_name,
    review_date: row.review_date,
    platform: row.source,
    sentiment_label: row.sentiment_label,
    key_phrases: row.key_phrases,
    verified: Boolean(row.verified_at),
  };
}

function sortReviews(rows: ReviewRow[], sortBy: ReviewSort): ReviewRow[] {
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (sortBy === "rating_desc") return b.rating - a.rating;
    if (sortBy === "rating_asc") return a.rating - b.rating;
    const aDate = new Date(a.review_date).getTime();
    const bDate = new Date(b.review_date).getTime();
    return sortBy === "date_asc" ? aDate - bDate : bDate - aDate;
  });
  return sorted;
}

function getEmbeddedProfessional(row: ReviewWithProfessional): UserWithOrganization | null {
  const professional = row.professional;
  if (Array.isArray(professional)) return professional[0] ?? null;
  return professional ?? null;
}

type OrderableQuery<T> = T & {
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) => T;
};

function asOrderable<T>(query: T): OrderableQuery<T> {
  return query as OrderableQuery<T>;
}

function applyReviewSort<T>(query: T, sortBy: ReviewSort): T {
  const ordered = asOrderable(query);
  if (sortBy === "rating_desc") {
    return asOrderable(ordered.order("rating", { ascending: false })).order("id", {
      ascending: true,
    });
  }
  if (sortBy === "rating_asc") {
    return asOrderable(ordered.order("rating", { ascending: true })).order("id", {
      ascending: true,
    });
  }
  return asOrderable(
    ordered.order("review_date", { ascending: sortBy === "date_asc" })
  ).order("id", { ascending: true });
}

function applyProfessionalSearchSort<T>(query: T, sortBy: ProfessionalSearchSort): T {
  const ordered = asOrderable(query);
  if (sortBy === "reviews") {
    return asOrderable(ordered.order("total_reviews", { ascending: false })).order("id", {
      ascending: true,
    });
  }
  if (sortBy === "recent") {
    return asOrderable(ordered.order("updated_at", { ascending: false })).order("id", {
      ascending: true,
    });
  }
  return asOrderable(ordered.order("average_rating", { ascending: false })).order("id", {
    ascending: true,
  });
}

function applyCompanySort<T>(query: T, sortBy: CompanySort): T {
  const ordered = asOrderable(query);
  if (sortBy === "size") {
    return asOrderable(
      ordered.order("professional_count", { ascending: false })
    ).order("organization_id", { ascending: true });
  }
  if (sortBy === "reviews") {
    return asOrderable(
      ordered.order("published_reviews", { ascending: false })
    ).order("organization_id", { ascending: true });
  }
  return asOrderable(
    ordered.order("average_rating", { ascending: false })
  ).order("organization_id", { ascending: true });
}

function rangeEnd(pagination: PaginationParams): number {
  return pagination.offset + pagination.perPage - 1;
}

function toIlikePattern(value: string): string {
  return `%${escapeLike(value)}%`;
}

function toCompanySummary(row: OrganizationReviewRollupRow): CompanySummary {
  return {
    id: row.organization_id ?? "",
    name: row.name?.trim() || "Unknown",
    slug: row.slug ?? "",
    industry: row.industry,
    logo_url: row.logo_url ?? null,
    website_url: row.website_url ?? null,
    professional_count: row.professional_count ?? 0,
    avg_team_rating: row.average_rating,
    total_team_reviews: row.published_reviews ?? 0,
  };
}

export function parseProfessionalSearchParams(
  searchParams: URLSearchParams
): ValidationResult<{
  name?: string;
  industry?: string;
  location?: string;
  minRating?: number;
  sortBy: ProfessionalSearchSort;
  pagination: PaginationParams;
}> {
  const pagination = parsePaginationParams(searchParams, {
    maxPerPage: 50,
    defaultPerPage: 20,
  });
  if (!pagination.ok) return pagination;

  const minRating = parseRatingParam(searchParams, "min_rating");
  if (!minRating.ok) return minRating;

  const sortBy = parseEnumParam(
    searchParams,
    "sort_by",
    ["rating", "reviews", "recent"] as const,
    "rating"
  );
  if (!sortBy.ok) return sortBy;

  return ok({
    name: searchParams.get("name")?.trim() || undefined,
    industry: searchParams.get("industry")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    minRating: minRating.value,
    sortBy: sortBy.value,
    pagination: pagination.value,
  });
}

export async function searchProfessionalsV2(
  params: ReturnType<typeof parseProfessionalSearchParams> extends ValidationResult<
    infer T
  >
    ? T
    : never
): Promise<{ data: ProfessionalSummary[]; total: number }> {
  const supabase = createAdminClient();
  let query = applyPublicProfessionalFilters(
    supabase.from("users").select(PROFESSIONAL_SELECT, { count: "exact" })
  ).is("has_published_review", true);

  if (params.name) {
    query = query.ilike("full_name", toIlikePattern(params.name));
  }
  if (params.minRating !== undefined) {
    query = query.gte("average_rating", params.minRating);
  }
  if (params.industry) {
    query = query.ilike("industry", toIlikePattern(params.industry));
  }
  if (params.location) {
    const pattern = toIlikePattern(params.location);
    query = query.or(
      `branch.ilike.${pattern},address->>city.ilike.${pattern},address->>state.ilike.${pattern}`
    );
  }

  const { data, error, count } = await applyProfessionalSearchSort(query, params.sortBy).range(
    params.pagination.offset,
    rangeEnd(params.pagination)
  );
  if (error || !data) {
    throw new Error("Failed to search professionals");
  }

  return {
    data: data.map(toProfessionalSummary),
    total: count ?? 0,
  };
}

async function getVisibleProfessional(id: string): Promise<UserWithOrganization | null> {
  const supabase = createAdminClient();
  const { data, error } = await applyPublicProfessionalFilters(
    supabase.from("users").select(PROFESSIONAL_SELECT)
  )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

function buildRatingDistribution(
  reviews: ReviewRow[]
): Record<1 | 2 | 3 | 4 | 5, number> {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const review of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] += 1;
  }
  return distribution;
}

function buildRecencyStats(reviews: ReviewRow[]): ProfessionalDetail["recency_stats"] {
  const now = Date.now();
  const daysAgo = (days: number) => now - days * 86_400_000;

  return {
    reviews_last_30_days: reviews.filter(
      (review) => new Date(review.review_date).getTime() >= daysAgo(30)
    ).length,
    reviews_last_90_days: reviews.filter(
      (review) => new Date(review.review_date).getTime() >= daysAgo(90)
    ).length,
    reviews_last_year: reviews.filter(
      (review) => new Date(review.review_date).getTime() >= daysAgo(365)
    ).length,
  };
}

function buildSocialLinks(row: UserRow): Record<string, string> {
  return Object.fromEntries(
    [
      ["linkedin", row.linkedin_url],
      ["facebook", row.facebook_url],
      ["instagram", row.instagram_url],
      ["twitter", row.twitter_url],
      ["website", row.personal_website_url],
    ].filter((entry): entry is [string, string] => Boolean(entry[1]))
  );
}

async function getApprovedReviewsForProfessional(
  professionalId: string,
  options?: {
    sortBy?: ReviewSort;
    platform?: string;
    minRating?: number;
  }
): Promise<ReviewRow[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("user_id", professionalId)
    .eq("status", "approved")
    .eq("is_published", true);

  if (options?.platform) query = query.eq("source", options.platform);
  if (options?.minRating !== undefined) query = query.gte("rating", options.minRating);

  const { data, error } = await query.limit(1000);
  if (error || !data) {
    throw new Error("Failed to fetch reviews");
  }

  return sortReviews(data, options?.sortBy ?? "date_desc");
}

export async function getProfessionalDetailV2(
  id: string
): Promise<ProfessionalDetail | null> {
  const professional = await getVisibleProfessional(id);
  if (!professional) return null;

  const reviews = await getApprovedReviewsForProfessional(id);
  const summary = toProfessionalSummary(professional);

  return {
    ...summary,
    bio: professional.bio,
    photo_url: professional.avatar_url || professional.photo_url,
    social_links: buildSocialLinks(professional),
    nmls_id: professional.nmls_id,
    nps_score: professional.nps_score,
    reputation_score: professional.reputation_score,
    reviews: reviews.slice(0, 25).map(toProfessionalReview),
    rating_distribution: buildRatingDistribution(reviews),
    recency_stats: buildRecencyStats(reviews),
  };
}

export function parseProfessionalReviewsParams(
  searchParams: URLSearchParams
): ValidationResult<{
  pagination: PaginationParams;
  sortBy: ReviewSort;
  platform?: string;
  minRating?: number;
}> {
  const pagination = parsePaginationParams(searchParams, {
    maxPerPage: 100,
    defaultPerPage: 20,
  });
  if (!pagination.ok) return pagination;

  const sortBy = parseEnumParam(
    searchParams,
    "sort_by",
    ["date_desc", "date_asc", "rating_desc", "rating_asc"] as const,
    "date_desc"
  );
  if (!sortBy.ok) return sortBy;

  const minRating = parseRatingParam(searchParams, "min_rating");
  if (!minRating.ok) return minRating;

  return ok({
    pagination: pagination.value,
    sortBy: sortBy.value,
    platform: searchParams.get("platform")?.trim() || undefined,
    minRating: minRating.value,
  });
}

export async function getProfessionalReviewsV2(
  professionalId: string,
  params: ReturnType<typeof parseProfessionalReviewsParams> extends ValidationResult<
    infer T
  >
    ? T
    : never
): Promise<{ data: ProfessionalReview[]; total: number } | null> {
  const professional = await getVisibleProfessional(professionalId);
  if (!professional) return null;

  const reviews = await getApprovedReviewsForProfessional(professionalId, {
    sortBy: params.sortBy,
    platform: params.platform,
    minRating: params.minRating,
  });
  const page = paginateArray(reviews.map(toProfessionalReview), params.pagination);
  return page;
}

export function parseCrossReviewSearchParams(
  searchParams: URLSearchParams
): ValidationResult<{
  keyword?: string;
  platform?: string;
  minRating?: number;
  maxRating?: number;
  dateFrom?: string;
  dateTo?: string;
  industry?: string;
  location?: string;
  sortBy: ReviewSort;
  pagination: PaginationParams;
}> {
  const pagination = parsePaginationParams(searchParams, {
    maxPerPage: 100,
    defaultPerPage: 20,
  });
  if (!pagination.ok) return pagination;

  const minRating = parseRatingParam(searchParams, "min_rating");
  if (!minRating.ok) return minRating;
  const maxRating = parseRatingParam(searchParams, "max_rating");
  if (!maxRating.ok) return maxRating;
  if (
    minRating.value !== undefined &&
    maxRating.value !== undefined &&
    minRating.value > maxRating.value
  ) {
    return invalid("min_rating must be less than or equal to max_rating");
  }

  const dateFrom = parseDateParam(searchParams, "date_from");
  if (!dateFrom.ok) return dateFrom;
  const dateTo = parseDateParam(searchParams, "date_to");
  if (!dateTo.ok) return dateTo;
  if (dateFrom.value && dateTo.value && dateFrom.value > dateTo.value) {
    return invalid("date_from must be before or equal to date_to");
  }

  const sortBy = parseEnumParam(
    searchParams,
    "sort_by",
    ["date_desc", "date_asc", "rating_desc", "rating_asc"] as const,
    "date_desc"
  );
  if (!sortBy.ok) return sortBy;

  return ok({
    keyword: searchParams.get("keyword")?.trim() || undefined,
    platform: searchParams.get("platform")?.trim() || undefined,
    minRating: minRating.value,
    maxRating: maxRating.value,
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    industry: searchParams.get("industry")?.trim() || undefined,
    location: searchParams.get("location")?.trim() || undefined,
    sortBy: sortBy.value,
    pagination: pagination.value,
  });
}

export async function searchReviewsV2(
  params: ReturnType<typeof parseCrossReviewSearchParams> extends ValidationResult<
    infer T
  >
    ? T
    : never
): Promise<{ data: CrossProfessionalReview[]; total: number }> {
  const supabase = createAdminClient();
  let query = supabase
    .from("reviews")
    .select(CROSS_REVIEW_SELECT, { count: "exact" })
    .eq("status", "approved")
    .eq("is_published", true)
    .not("user_id", "is", null)
    .eq("professional.is_active", true)
    .eq("professional.accepts_public_reviews", true)
    .neq("professional.role", "manager")
    .neq("professional.role", "enterprise")
    .is("professional.is_public_professional", true);

  if (params.keyword) {
    query = query.ilike("text", toIlikePattern(params.keyword));
  }
  if (params.platform) query = query.eq("source", params.platform);
  if (params.minRating !== undefined) query = query.gte("rating", params.minRating);
  if (params.maxRating !== undefined) query = query.lte("rating", params.maxRating);
  if (params.dateFrom) query = query.gte("review_date", params.dateFrom);
  if (params.dateTo) query = query.lte("review_date", params.dateTo);
  if (params.industry) {
    query = query.ilike("professional.industry", toIlikePattern(params.industry));
  }
  if (params.location) {
    const pattern = toIlikePattern(params.location);
    query = query.or(
      `branch.ilike.${pattern},address->>city.ilike.${pattern},address->>state.ilike.${pattern}`,
      { referencedTable: "professional" }
    );
  }

  const { data, error, count } = await applyReviewSort(query, params.sortBy).range(
    params.pagination.offset,
    rangeEnd(params.pagination)
  );
  if (error || !data) {
    throw new Error("Failed to search reviews");
  }

  const mapped = data.flatMap((review) => {
    const professional = getEmbeddedProfessional(review);
    if (!professional) return [];
    const organization = getEmbeddedOrganization(professional);
    return [
      {
        id: review.id,
        rating: review.rating,
        review_text: review.text,
        reviewer_name: review.customer_name,
        review_date: review.review_date,
        platform: review.source,
        sentiment_label: review.sentiment_label,
        key_phrases: review.key_phrases,
        professional: {
          id: professional.id,
          full_name: normalizeName(professional.full_name),
          title: professional.title,
          company_name: organization?.name ?? null,
          profile_url: profileUrl(professional),
        },
      },
    ];
  });

  return {
    data: mapped,
    total: count ?? 0,
  };
}

export function parseCompanyListParams(
  searchParams: URLSearchParams
): ValidationResult<{
  industry?: string;
  minAvgRating?: number;
  sortBy: CompanySort;
  pagination: PaginationParams;
}> {
  const pagination = parsePaginationParams(searchParams, {
    maxPerPage: 100,
    defaultPerPage: 20,
  });
  if (!pagination.ok) return pagination;

  const minAvgRating = parseRatingParam(searchParams, "min_avg_rating");
  if (!minAvgRating.ok) return minAvgRating;

  const sortBy = parseEnumParam(
    searchParams,
    "sort_by",
    ["rating", "size", "reviews"] as const,
    "rating"
  );
  if (!sortBy.ok) return sortBy;

  return ok({
    industry: searchParams.get("industry")?.trim() || undefined,
    minAvgRating: minAvgRating.value,
    sortBy: sortBy.value,
    pagination: pagination.value,
  });
}

function roundedAverage(total: number, count: number): number | null {
  if (count === 0) return null;
  return Number((total / count).toFixed(2));
}

export function buildCompanyRollup(
  organization: OrganizationRow,
  professionals: UserRow[],
  reviews: ReviewRow[]
): CompanyDetail {
  const professionalIds = new Set(professionals.map((professional) => professional.id));
  const reviewsByProfessional = new Map<string, ReviewRow[]>();

  for (const review of reviews) {
    if (!review.user_id || !professionalIds.has(review.user_id)) continue;
    const existing = reviewsByProfessional.get(review.user_id) ?? [];
    existing.push(review);
    reviewsByProfessional.set(review.user_id, existing);
  }

  const activeProfessionalIds = [...reviewsByProfessional.keys()];
  const totalTeamReviews = activeProfessionalIds.reduce(
    (sum, id) => sum + (reviewsByProfessional.get(id)?.length ?? 0),
    0
  );
  const ratingTotal = activeProfessionalIds.reduce((sum, id) => {
    return (
      sum +
      (reviewsByProfessional.get(id) ?? []).reduce(
        (reviewSum, review) => reviewSum + review.rating,
        0
      )
    );
  }, 0);

  const professionalMap = new Map(professionals.map((professional) => [professional.id, professional]));
  const team = activeProfessionalIds
    .map((id) => {
      const professional = professionalMap.get(id)!;
      const professionalReviews = reviewsByProfessional.get(id) ?? [];
      const professionalRatingTotal = professionalReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      return {
        id: professional.id,
        full_name: normalizeName(professional.full_name),
        title: professional.title,
        average_rating: roundedAverage(
          professionalRatingTotal,
          professionalReviews.length
        ),
        total_reviews: professionalReviews.length,
        profile_url: profileUrl(professional),
      };
    })
    .sort((a, b) => b.total_reviews - a.total_reviews);

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    industry: organization.industry,
    logo_url: organization.logo_url,
    website_url: organization.website_url,
    professional_count: activeProfessionalIds.length,
    avg_team_rating: roundedAverage(ratingTotal, totalTeamReviews),
    total_team_reviews: totalTeamReviews,
    team,
  };
}

async function loadCompanyDetailRollups(
  organizations: OrganizationRow[]
): Promise<CompanyDetail[]> {
  const orgIds = organizations.map((org) => org.id);
  if (orgIds.length === 0) return [];

  const supabase = createAdminClient();
  const { data: professionals, error: professionalError } = await applyPublicProfessionalFilters(
    supabase.from("users").select(
      "id, slug, full_name, title, average_rating, total_reviews, organization_id, updated_at, branch, address, industry, bio, photo_url, avatar_url, nmls_id, nps_score, reputation_score, linkedin_url, facebook_url, instagram_url, twitter_url, personal_website_url"
    )
  ).in("organization_id", orgIds);

  if (professionalError || !professionals) {
    throw new Error("Failed to fetch company professionals");
  }

  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
    .select(REVIEW_SELECT)
    .in("organization_id", orgIds)
    .eq("status", "approved")
    .eq("is_published", true);

  if (reviewError || !reviews) {
    throw new Error("Failed to fetch company reviews");
  }

  const professionalsByOrg = new Map<string, UserRow[]>();
  for (const professional of professionals) {
    if (!professional.organization_id) continue;
    const existing = professionalsByOrg.get(professional.organization_id) ?? [];
    existing.push(professional);
    professionalsByOrg.set(professional.organization_id, existing);
  }

  const reviewsByOrg = new Map<string, ReviewRow[]>();
  for (const review of reviews) {
    const existing = reviewsByOrg.get(review.organization_id) ?? [];
    existing.push(review);
    reviewsByOrg.set(review.organization_id, existing);
  }

  return organizations.map((organization) =>
    buildCompanyRollup(
      organization,
      professionalsByOrg.get(organization.id) ?? [],
      reviewsByOrg.get(organization.id) ?? []
    )
  );
}

export async function listCompaniesV2(
  params: ReturnType<typeof parseCompanyListParams> extends ValidationResult<infer T>
    ? T
    : never
): Promise<{ data: CompanySummary[]; total: number }> {
  const supabase = createAdminClient();
  let query = supabase
    .from("organization_review_rollups")
    .select(
      "organization_id, name, slug, industry, logo_url, website_url, professional_count, published_reviews, average_rating",
      { count: "exact" }
    );

  if (params.industry) {
    query = query.ilike("industry", toIlikePattern(params.industry));
  }
  if (params.minAvgRating !== undefined) {
    query = query.gte("average_rating", params.minAvgRating);
  }

  const { data, error, count } = await applyCompanySort(query, params.sortBy).range(
    params.pagination.offset,
    rangeEnd(params.pagination)
  );
  if (error || !data) {
    throw new Error("Failed to fetch companies");
  }

  return {
    data: data.map(toCompanySummary),
    total: count ?? 0,
  };
}

export async function getCompanyDetailV2(id: string): Promise<CompanyDetail | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, industry, logo_url, website_url")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const [rollup] = await loadCompanyDetailRollups([data]);
  return rollup ?? null;
}
