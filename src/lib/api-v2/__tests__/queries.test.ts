import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/seo", () => ({
  getBaseUrl: () => "https://repwell.test",
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  buildCompanyRollup,
  listCompaniesV2,
  parseCompanyListParams,
  parseCrossReviewSearchParams,
  parseProfessionalSearchParams,
  searchReviewsV2,
  searchProfessionalsV2,
} from "../queries";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createMockQueryChain(finalResult: {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}): MockChain {
  const chain = {} as MockChain;
  const returnChain = () => chain;

  chain.select = vi.fn().mockImplementation(returnChain);
  chain.eq = vi.fn().mockImplementation(returnChain);
  chain.neq = vi.fn().mockImplementation(returnChain);
  chain.is = vi.fn().mockImplementation(returnChain);
  chain.gt = vi.fn().mockImplementation(returnChain);
  chain.gte = vi.fn().mockImplementation(returnChain);
  chain.lte = vi.fn().mockImplementation(returnChain);
  chain.ilike = vi.fn().mockImplementation(returnChain);
  chain.in = vi.fn().mockImplementation(returnChain);
  chain.not = vi.fn().mockImplementation(returnChain);
  chain.or = vi.fn().mockImplementation(returnChain);
  chain.order = vi.fn().mockImplementation(returnChain);
  chain.range = vi.fn().mockImplementation(returnChain);
  chain.limit = vi.fn().mockImplementation(returnChain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) =>
    Promise.resolve(finalResult).then(resolve)
  );

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("searchProfessionalsV2", () => {
  it("applies public visibility filters and approved-review visibility", async () => {
    const userId = "11111111-1111-4111-8111-111111111111";
    const usersChain = createMockQueryChain({
      data: [
        {
          id: userId,
          slug: "jane-smith",
          full_name: "Jane Smith",
          title: "Loan Officer",
          bio: null,
          photo_url: null,
          avatar_url: null,
          nmls_id: null,
          nps_score: null,
          reputation_score: null,
          average_rating: 4.8,
          total_reviews: 3,
          industry: "mortgage",
          branch: "Chicago",
          address: { city: "Chicago", state: "IL" },
          organization_id: "org_1",
          linkedin_url: null,
          facebook_url: null,
          instagram_url: null,
          twitter_url: null,
          personal_website_url: null,
          updated_at: "2026-01-01T00:00:00.000Z",
          organizations: {
            id: "org_1",
            name: "Summit Mortgage",
            slug: "summit",
            industry: "mortgage",
            logo_url: null,
            website_url: null,
          },
        },
      ],
      error: null,
      count: 1,
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from,
    });

    const parsed = parseProfessionalSearchParams(
      new URLSearchParams("industry=mortgage&location=chicago&min_rating=4.5")
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await searchProfessionalsV2(parsed.value);

    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      full_name: "Jane Smith",
      company_name: "Summit Mortgage",
      profile_url: "https://repwell.test/pro/jane-smith",
    });

    expect(from).toHaveBeenCalledTimes(1);
    expect(usersChain.select).toHaveBeenCalledWith(expect.any(String), {
      count: "exact",
    });
    expect(usersChain.eq).toHaveBeenCalledWith("is_active", true);
    expect(usersChain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
    expect(usersChain.neq).toHaveBeenCalledWith("role", "manager");
    expect(usersChain.neq).toHaveBeenCalledWith("role", "enterprise");
    expect(usersChain.is).toHaveBeenCalledWith("is_public_professional", true);
    expect(usersChain.is).toHaveBeenCalledWith("has_published_review", true);
    expect(usersChain.ilike).toHaveBeenCalledWith("industry", "%mortgage%");
    expect(usersChain.gte).toHaveBeenCalledWith("average_rating", 4.5);
    expect(usersChain.or).toHaveBeenCalledWith(
      "branch.ilike.%chicago%,address->>city.ilike.%chicago%,address->>state.ilike.%chicago%"
    );
    expect(usersChain.order).toHaveBeenCalledWith("average_rating", {
      ascending: false,
    });
    expect(usersChain.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(usersChain.range).toHaveBeenCalledWith(0, 19);
  });
});

describe("searchReviewsV2", () => {
  it("joins visible professionals and pages reviews in the database", async () => {
    const reviewsChain = createMockQueryChain({
      data: [
        {
          id: "review_1",
          user_id: "user_1",
          organization_id: "org_1",
          rating: 5,
          text: "Responsive and helpful",
          customer_name: "Alex",
          review_date: "2026-01-01T00:00:00.000Z",
          source: "google",
          sentiment_label: "positive",
          key_phrases: ["responsive"],
          verified_at: "2026-01-02T00:00:00.000Z",
          professional: {
            id: "user_1",
            slug: "jane-smith",
            full_name: "Jane Smith",
            title: "Loan Officer",
            bio: null,
            photo_url: null,
            avatar_url: null,
            nmls_id: null,
            nps_score: null,
            reputation_score: null,
            average_rating: 4.8,
            total_reviews: 3,
            industry: "mortgage",
            branch: "Chicago",
            address: { city: "Chicago", state: "IL" },
            organization_id: "org_1",
            linkedin_url: null,
            facebook_url: null,
            instagram_url: null,
            twitter_url: null,
            personal_website_url: null,
            updated_at: "2026-01-01T00:00:00.000Z",
            organizations: {
              id: "org_1",
              name: "Summit Mortgage",
              slug: "summit",
              industry: "mortgage",
              logo_url: null,
              website_url: null,
            },
          },
        },
      ],
      error: null,
      count: 1,
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "reviews") return reviewsChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

    const parsed = parseCrossReviewSearchParams(
      new URLSearchParams(
        "keyword=responsive&industry=mortgage&location=chicago&sort_by=rating_desc"
      )
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await searchReviewsV2(parsed.value);

    expect(result.total).toBe(1);
    expect(result.data[0]).toMatchObject({
      id: "review_1",
      professional: {
        id: "user_1",
        full_name: "Jane Smith",
        company_name: "Summit Mortgage",
        profile_url: "https://repwell.test/pro/jane-smith",
      },
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(reviewsChain.select).toHaveBeenCalledWith(expect.any(String), {
      count: "exact",
    });
    expect(reviewsChain.eq).toHaveBeenCalledWith("status", "approved");
    expect(reviewsChain.eq).toHaveBeenCalledWith("is_published", true);
    expect(reviewsChain.eq).toHaveBeenCalledWith("professional.is_active", true);
    expect(reviewsChain.neq).toHaveBeenCalledWith("professional.role", "manager");
    expect(reviewsChain.is).toHaveBeenCalledWith(
      "professional.is_public_professional",
      true
    );
    expect(reviewsChain.ilike).toHaveBeenCalledWith("text", "%responsive%");
    expect(reviewsChain.ilike).toHaveBeenCalledWith(
      "professional.industry",
      "%mortgage%"
    );
    expect(reviewsChain.or).toHaveBeenCalledWith(
      "branch.ilike.%chicago%,address->>city.ilike.%chicago%,address->>state.ilike.%chicago%",
      { referencedTable: "professional" }
    );
    expect(reviewsChain.order).toHaveBeenCalledWith("rating", {
      ascending: false,
    });
    expect(reviewsChain.order).toHaveBeenCalledWith("id", { ascending: true });
    expect(reviewsChain.range).toHaveBeenCalledWith(0, 19);
  });
});

describe("listCompaniesV2", () => {
  it("reads company summaries from organization_review_rollups with count and range", async () => {
    const companiesChain = createMockQueryChain({
      data: [
        {
          organization_id: "org_1",
          name: "Summit Mortgage",
          slug: "summit",
          industry: "mortgage",
          professional_count: 4,
          published_reviews: 12,
          average_rating: 4.75,
        },
      ],
      error: null,
      count: 9,
    });
    const from = vi.fn().mockImplementation((table: string) => {
      if (table === "organization_review_rollups") return companiesChain;
      throw new Error(`Unexpected table: ${table}`);
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from });

    const parsed = parseCompanyListParams(
      new URLSearchParams(
        "industry=mortgage&min_avg_rating=4.5&sort_by=reviews&page=2&per_page=3"
      )
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = await listCompaniesV2(parsed.value);

    expect(result).toEqual({
      data: [
        {
          id: "org_1",
          name: "Summit Mortgage",
          slug: "summit",
          industry: "mortgage",
          logo_url: null,
          website_url: null,
          professional_count: 4,
          avg_team_rating: 4.75,
          total_team_reviews: 12,
        },
      ],
      total: 9,
    });
    expect(companiesChain.select).toHaveBeenCalledWith(expect.any(String), {
      count: "exact",
    });
    expect(companiesChain.ilike).toHaveBeenCalledWith("industry", "%mortgage%");
    expect(companiesChain.gte).toHaveBeenCalledWith("average_rating", 4.5);
    expect(companiesChain.order).toHaveBeenCalledWith("published_reviews", {
      ascending: false,
    });
    expect(companiesChain.order).toHaveBeenCalledWith("organization_id", {
      ascending: true,
    });
    expect(companiesChain.range).toHaveBeenCalledWith(3, 5);
  });
});

describe("buildCompanyRollup", () => {
  it("computes aggregate shape from approved reviews across active professionals", () => {
    const organization = {
      id: "org_1",
      name: "Summit Mortgage",
      slug: "summit",
      industry: "mortgage",
      logo_url: null,
      website_url: "https://summit.example",
    } as Parameters<typeof buildCompanyRollup>[0];
    const professionals = [
      {
        id: "user_1",
        slug: "jane-smith",
        full_name: "Jane Smith",
        title: "Loan Officer",
        bio: null,
        photo_url: null,
        avatar_url: null,
        nmls_id: null,
        nps_score: null,
        reputation_score: null,
        average_rating: 4.5,
        total_reviews: 2,
        industry: "mortgage",
        branch: null,
        address: null,
        organization_id: "org_1",
        linkedin_url: null,
        facebook_url: null,
        instagram_url: null,
        twitter_url: null,
        personal_website_url: null,
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "user_2",
        slug: "zero-review",
        full_name: "Zero Review",
        title: "Loan Officer",
        bio: null,
        photo_url: null,
        avatar_url: null,
        nmls_id: null,
        nps_score: null,
        reputation_score: null,
        average_rating: null,
        total_reviews: 0,
        industry: "mortgage",
        branch: null,
        address: null,
        organization_id: "org_1",
        linkedin_url: null,
        facebook_url: null,
        instagram_url: null,
        twitter_url: null,
        personal_website_url: null,
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ] as Parameters<typeof buildCompanyRollup>[1];
    const reviews = [
      {
        id: "review_1",
        user_id: "user_1",
        organization_id: "org_1",
        rating: 5,
        text: "Great",
        customer_name: "Alex",
        review_date: "2026-01-01T00:00:00.000Z",
        source: "google",
        sentiment_label: "positive",
        key_phrases: ["great"],
        verified_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "review_2",
        user_id: "user_1",
        organization_id: "org_1",
        rating: 4,
        text: "Helpful",
        customer_name: "Sam",
        review_date: "2026-01-03T00:00:00.000Z",
        source: "zillow",
        sentiment_label: "positive",
        key_phrases: ["helpful"],
        verified_at: null,
      },
      {
        id: "review_3",
        user_id: "not_active",
        organization_id: "org_1",
        rating: 1,
        text: "Ignored",
        customer_name: "Nope",
        review_date: "2026-01-04T00:00:00.000Z",
        source: "google",
        sentiment_label: "negative",
        key_phrases: null,
        verified_at: null,
      },
    ] as Parameters<typeof buildCompanyRollup>[2];

    const rollup = buildCompanyRollup(organization, professionals, reviews);

    expect(rollup).toMatchObject({
      professional_count: 1,
      avg_team_rating: 4.5,
      total_team_reviews: 2,
      team: [
        {
          id: "user_1",
          full_name: "Jane Smith",
          average_rating: 4.5,
          total_reviews: 2,
          profile_url: "https://repwell.test/pro/jane-smith",
        },
      ],
    });
  });

  it("returns null aggregate rating for companies with no reviewed professionals", () => {
    const organization = {
      id: "org_1",
      name: "Summit Mortgage",
      slug: "summit",
      industry: "mortgage",
      logo_url: null,
      website_url: null,
    } as Parameters<typeof buildCompanyRollup>[0];

    const rollup = buildCompanyRollup(organization, [], []);

    expect(rollup.professional_count).toBe(0);
    expect(rollup.avg_team_rating).toBeNull();
    expect(rollup.total_team_reviews).toBe(0);
    expect(rollup.team).toEqual([]);
  });
});
