import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/seo", () => ({
  getBaseUrl: () => "https://repwell.test",
}));

vi.mock("@/lib/api-v2", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-v2")>();
  return {
    ...actual,
    getCompanyDetailV2: vi.fn(),
    getProfessionalDetailV2: vi.fn(),
    getProfessionalReviewsV2: vi.fn(),
  };
});

import { NextRequest } from "next/server";
import {
  getCompanyDetailV2,
  getProfessionalDetailV2,
  getProfessionalReviewsV2,
} from "@/lib/api-v2";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  WEBMCP_ORIGIN_RATE_LIMIT,
  WEBMCP_RATE_LIMIT_BUCKET,
} from "@/lib/webmcp/server";
import { GET as getCompanyProfile } from "@/app/api/webmcp/companies/[id]/route";
import { GET as getProfessionalProfile } from "@/app/api/webmcp/professionals/[id]/route";
import { GET as getProfessionalReviews } from "@/app/api/webmcp/professionals/[id]/reviews/route";

const testKey = "rw_test_webmcp_readonly";

function routeContext(id = "user_1") {
  return {
    params: Promise.resolve({ id }),
  };
}

function request(url: string, headers?: Record<string, string>) {
  return new NextRequest(url, {
    headers: {
      origin: "https://repwell.com",
      "x-forwarded-for": "203.0.113.20",
      ...headers,
    },
  });
}

function mockRateLimit(options?: {
  allowed?: boolean;
  retryAfterSeconds?: number;
}) {
  const rpc = vi.fn().mockResolvedValue({
    data: [
      {
        is_allowed: options?.allowed ?? true,
        current_count: options?.allowed === false ? 61 : 1,
        retry_after_seconds: options?.retryAfterSeconds ?? 60,
      },
    ],
    error: null,
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ rpc });
  return rpc;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.WEBMCP_INTERNAL_API_KEY = testKey;
});

describe("WebMCP proxy handlers", () => {
  it("returns 503 without touching the rate limiter when the internal key is absent", async () => {
    delete process.env.WEBMCP_INTERNAL_API_KEY;

    const response = await getCompanyProfile(
      request("http://localhost/api/webmcp/companies/company_1"),
      routeContext("company_1")
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "webmcp_unconfigured",
      message: "WebMCP internal API key is not configured",
    });
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(getCompanyDetailV2).not.toHaveBeenCalled();
  });

  it("rate limits by origin using the webmcp-origin bucket", async () => {
    const rpc = mockRateLimit({ allowed: false, retryAfterSeconds: 44 });

    const response = await getProfessionalReviews(
      request("http://localhost/api/webmcp/professionals/user_1/reviews"),
      routeContext()
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("44");
    await expect(response.json()).resolves.toEqual({
      error: "rate_limit_exceeded",
      message: "WebMCP proxy rate limit exceeded",
    });
    expect(rpc).toHaveBeenCalledWith("check_minute_rate_limit", {
      p_bucket: WEBMCP_RATE_LIMIT_BUCKET,
      p_window_key: expect.stringMatching(/^[a-f0-9]{64}$/),
      p_limit: WEBMCP_ORIGIN_RATE_LIMIT,
    });
    expect(getProfessionalReviewsV2).not.toHaveBeenCalled();
  });

  it("shapes professional profiles to open-tier fields only", async () => {
    mockRateLimit();
    vi.mocked(getProfessionalDetailV2).mockResolvedValue({
      id: "user_1",
      full_name: "Jane Smith",
      title: "Loan Officer",
      company_name: "Summit Mortgage",
      industry: "mortgage",
      location: "Chicago, IL",
      average_rating: 4.9,
      total_reviews: 47,
      profile_url: "https://repwell.test/pro/jane-smith",
      bio: "Keyed-tier bio",
      photo_url: "https://example.test/photo.jpg",
      social_links: { linkedin: "https://linkedin.example/jane" },
      nmls_id: "12345",
      nps_score: 92,
      reputation_score: 98,
      reviews: [],
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 46 },
      recency_stats: {
        reviews_last_30_days: 1,
        reviews_last_90_days: 4,
        reviews_last_year: 20,
      },
    });

    const response = await getProfessionalProfile(
      request("http://localhost/api/webmcp/professionals/user_1"),
      routeContext()
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      data: {
        id: "user_1",
        full_name: "Jane Smith",
        title: "Loan Officer",
        company_name: "Summit Mortgage",
        industry: "mortgage",
        location: "Chicago, IL",
        average_rating: 4.9,
        total_reviews: 47,
        profile_url: "https://repwell.test/pro/jane-smith",
      },
    });
    expect(body.data).not.toHaveProperty("nps_score");
    expect(body.data).not.toHaveProperty("reviews");
    expect(body.data).not.toHaveProperty("social_links");
  });

  it("caps review pages at 10 and strips keyed review annotations", async () => {
    mockRateLimit();
    vi.mocked(getProfessionalReviewsV2).mockResolvedValue({
      data: [
        {
          id: "review_1",
          rating: 5,
          review_text: "Responsive and clear.",
          reviewer_name: "Alex",
          review_date: "2026-01-10",
          platform: "google",
          sentiment_label: "positive",
          key_phrases: ["responsive"],
          verified: true,
        },
      ],
      total: 1,
    });

    const response = await getProfessionalReviews(
      request(
        "http://localhost/api/webmcp/professionals/user_1/reviews?page=1&per_page=10"
      ),
      routeContext()
    );

    expect(response.status).toBe(200);
    expect(getProfessionalReviewsV2).toHaveBeenCalledWith("user_1", {
      pagination: {
        page: 1,
        perPage: 10,
        offset: 0,
      },
      sortBy: "date_desc",
    });
    const body = await response.json();
    expect(body).toEqual({
      data: [
        {
          id: "review_1",
          rating: 5,
          review_text: "Responsive and clear.",
          reviewer_name: "Alex",
          review_date: "2026-01-10",
          platform: "google",
        },
      ],
      total: 1,
      page: 1,
      per_page: 10,
      total_pages: 1,
    });
    expect(body.data[0]).not.toHaveProperty("sentiment_label");
    expect(body.data[0]).not.toHaveProperty("key_phrases");
    expect(body.data[0]).not.toHaveProperty("verified");
  });

  it("rejects review per_page values above 10", async () => {
    mockRateLimit();

    const response = await getProfessionalReviews(
      request(
        "http://localhost/api/webmcp/professionals/user_1/reviews?page=1&per_page=11"
      ),
      routeContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "invalid_query",
      message: "per_page must be less than or equal to 10",
    });
    expect(getProfessionalReviewsV2).not.toHaveBeenCalled();
  });

  it("shapes company profiles without returning keyed team detail", async () => {
    mockRateLimit();
    vi.mocked(getCompanyDetailV2).mockResolvedValue({
      id: "company_1",
      name: "Summit Mortgage",
      slug: "summit-mortgage",
      industry: "mortgage",
      logo_url: "https://example.test/logo.png",
      website_url: "https://summit.example",
      professional_count: 3,
      avg_team_rating: 4.8,
      total_team_reviews: 82,
      team: [
        {
          id: "user_1",
          full_name: "Jane Smith",
          title: "Loan Officer",
          average_rating: 4.9,
          total_reviews: 47,
          profile_url: "https://repwell.test/pro/jane-smith",
        },
      ],
    });

    const response = await getCompanyProfile(
      request("http://localhost/api/webmcp/companies/company_1"),
      routeContext("company_1")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      data: {
        id: "company_1",
        name: "Summit Mortgage",
        slug: "summit-mortgage",
        industry: "mortgage",
        logo_url: "https://example.test/logo.png",
        website_url: "https://summit.example",
        professional_count: 3,
        avg_team_rating: 4.8,
        total_team_reviews: 82,
      },
    });
    expect(body.data).not.toHaveProperty("team");
  });
});
