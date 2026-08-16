import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  getAllPublicLOIds,
  getAllPublicUserSlugs,
  getPublicBranchProfile,
  getPublicLOList,
  getPublicLOProfile,
} from "../actions";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createMockQueryChain(finalResult: {
  data?: unknown;
  error?: unknown;
  count?: number;
}): MockChain {
  const chain: MockChain = {} as MockChain;
  const returnChain = () => chain;

  chain.select = vi.fn().mockImplementation(returnChain);
  chain.eq = vi.fn().mockImplementation(returnChain);
  chain.neq = vi.fn().mockImplementation(returnChain);
  chain.is = vi.fn().mockImplementation(returnChain);
  chain.order = vi.fn().mockImplementation(returnChain);
  chain.limit = vi.fn().mockImplementation(returnChain);
  chain.not = vi.fn().mockImplementation(returnChain);
  chain.update = vi.fn().mockImplementation(returnChain);
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => void) =>
    Promise.resolve(finalResult).then(resolve)
  );

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public visibility queries in seo actions", () => {
  it("applies public visibility filters in getPublicLOProfile without excluding individual admins", async () => {
    const usersChain = createMockQueryChain({
      data: null,
      error: { message: "not found" },
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "users") return usersChain;
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    await getPublicLOProfile("visible-slug");

    expect(usersChain.eq).toHaveBeenCalledWith("is_active", true);
    expect(usersChain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
    expect(usersChain.neq).toHaveBeenCalledWith("role", "manager");
    expect(usersChain.neq).toHaveBeenCalledWith("role", "enterprise");
    expect(usersChain.neq).not.toHaveBeenCalledWith("role", "admin");
    expect(usersChain.is).toHaveBeenCalledWith("is_public_professional", true);
  });

  it("applies public visibility filters to sitemap user queries", async () => {
    const idChain = createMockQueryChain({ data: [], error: null });
    const slugChain = createMockQueryChain({ data: [], error: null });
    let userCallCount = 0;

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== "users") throw new Error(`Unexpected table: ${table}`);
        userCallCount += 1;
        return userCallCount === 1 ? idChain : slugChain;
      }),
    });

    await getAllPublicLOIds();
    await getAllPublicUserSlugs();

    for (const chain of [idChain, slugChain]) {
      expect(chain.eq).toHaveBeenCalledWith("is_active", true);
      expect(chain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
      expect(chain.neq).toHaveBeenCalledWith("role", "manager");
      expect(chain.neq).toHaveBeenCalledWith("role", "enterprise");
      expect(chain.neq).not.toHaveBeenCalledWith("role", "admin");
      expect(chain.is).toHaveBeenCalledWith("is_public_professional", true);
    }

    expect(slugChain.not).toHaveBeenCalledWith("slug", "is", null);
  });

  it("applies public visibility filters to branch members", async () => {
    const branchChain = createMockQueryChain({
      data: {
        id: "branch-1",
        name: "Main Branch",
        slug: "main-branch",
        global_slug: "main-branch-org",
        description: null,
        address: null,
        phone: null,
        email: null,
        website_url: null,
        hours_of_operation: null,
        manager_id: null,
        manager_name: null,
        google_maps_url: null,
        photo_url: null,
        cover_image_url: null,
        average_rating: 5,
        total_reviews: 10,
        total_members: 3,
        linkedin_url: null,
        facebook_url: null,
        instagram_url: null,
        twitter_url: null,
        zillow_profile_url: null,
        is_active: true,
        is_public: true,
        organization_id: "org-1",
      },
      error: null,
    });
    const organizationChain = createMockQueryChain({
      data: {
        id: "org-1",
        name: "Org",
        logo_url: null,
        domain: null,
        slug: "org",
        account_type: "enterprise",
        subscription_tier: "pro",
      },
      error: null,
    });
    const branchUsersChain = createMockQueryChain({ data: [], error: null });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "branches") return branchChain;
        if (table === "organizations") return organizationChain;
        if (table === "users") return branchUsersChain;
        if (table === "reviews") return createMockQueryChain({ data: [], error: null });
        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    await getPublicBranchProfile("main-branch-org");

    expect(branchUsersChain.eq).toHaveBeenCalledWith("is_active", true);
    expect(branchUsersChain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
    expect(branchUsersChain.neq).toHaveBeenCalledWith("role", "manager");
    expect(branchUsersChain.neq).toHaveBeenCalledWith("role", "enterprise");
    expect(branchUsersChain.neq).not.toHaveBeenCalledWith("role", "admin");
    expect(branchUsersChain.is).toHaveBeenCalledWith("is_public_professional", true);
  });

  it("applies public visibility filters to the public professional list", async () => {
    const usersChain = createMockQueryChain({ data: [], error: null });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== "users") throw new Error(`Unexpected table: ${table}`);
        return usersChain;
      }),
    });

    await getPublicLOList();

    expect(usersChain.eq).toHaveBeenCalledWith("is_active", true);
    expect(usersChain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
    expect(usersChain.neq).toHaveBeenCalledWith("role", "manager");
    expect(usersChain.neq).toHaveBeenCalledWith("role", "enterprise");
    expect(usersChain.neq).not.toHaveBeenCalledWith("role", "admin");
    expect(usersChain.is).toHaveBeenCalledWith("is_public_professional", true);
  });
});
