import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const {
  createUntypedAdminClientMock,
  createAdminClientMock,
  unifiedGetUserMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  createUntypedAdminClientMock: vi.fn(),
  createAdminClientMock: vi.fn(),
  unifiedGetUserMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createUntypedAdminClient: createUntypedAdminClientMock,
  createAdminClient: createAdminClientMock,
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: unifiedGetUserMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

import {
  bulkUpdateSmartLinks,
  getSmartLinkAnalytics,
  listSmartLinks,
} from "@/lib/share-studio/actions";

type QueryResponse = {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
};

type QueryBuilderMock = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: Promise<QueryResponse>["then"];
};

function createQueryBuilder(response: QueryResponse) {
  const builder = {} as QueryBuilderMock;
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.is = vi.fn(() => builder);
  builder.not = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.range = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(response));
  builder.maybeSingle = vi.fn(() => Promise.resolve(response));
  builder.then = (resolve, reject) => Promise.resolve(response).then(resolve, reject);
  return builder;
}

function createSupabaseClient(responses: QueryResponse[], rpcResponses: QueryResponse[] = []) {
  const builders: ReturnType<typeof createQueryBuilder>[] = [];
  const fromMock = vi.fn(() => {
    const response = responses.shift();
    if (!response) {
      throw new Error("Unexpected Supabase query");
    }
    const builder = createQueryBuilder(response);
    builders.push(builder);
    return builder;
  });
  const rpcMock = vi.fn(() => {
    const response = rpcResponses.shift();
    if (!response) {
      throw new Error("Unexpected Supabase RPC");
    }
    return Promise.resolve(response);
  });

  return {
    client: {
      from: fromMock,
      rpc: rpcMock,
      storage: {
        from: vi.fn(() => ({
          remove: vi.fn(() => Promise.resolve({ error: null })),
        })),
      },
    },
    builders,
    fromMock,
    rpcMock,
  };
}

const PINNED_NOW = new Date("2026-07-08T12:00:00Z");
const daysAgo = (days: number) => new Date(PINNED_NOW.getTime() - days * 86_400_000);
const eventDateDaysAgo = (days: number) => daysAgo(days).toISOString().slice(0, 10);

const managerProfile = {
  id: "user-1",
  organization_id: "org-1",
  role: "manager",
  is_owner: false,
  organizations: {
    account_type: "enterprise",
    subscription_tier: "enterprise",
    subscription_status: "active",
    grace_period_ends_at: null,
  },
};

function mockAccessContext() {
  const { client } = createSupabaseClient([{ data: managerProfile, error: null }]);
  createAdminClientMock.mockReturnValue(client);
}

describe("Share Studio hub actions", () => {
  // The analytics window is computed from the real clock; pin it so the
  // fixture dates below (derived from PINNED_NOW) always fall inside it.
  beforeAll(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(PINNED_NOW);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    unifiedGetUserMock.mockResolvedValue({ id: "user-1", email: "manager@example.com" });
    mockAccessContext();
  });

  it("lists Smart Links with a batched daily stats query", async () => {
    const { client, fromMock } = createSupabaseClient([
      {
        data: [
          {
            id: "link-1",
            title: "Great review",
            slug: "great-review",
            destination_url: "https://example.com",
            published: true,
            archived_at: null,
            created_at: daysAgo(7).toISOString(),
            proof_items: {
              id: "item-1",
              source_type: "review",
              source_id: "review-1",
              title: "Review from Jane",
              customer_name: "Jane",
              rating: 5,
            },
          },
        ],
        count: 1,
        error: null,
      },
      {
        data: [
          {
            proof_link_id: "link-1",
            event_type: "view",
            event_count: 7,
            event_date: eventDateDaysAgo(1),
          },
          {
            proof_link_id: "link-1",
            event_type: "click",
            event_count: 2,
            event_date: eventDateDaysAgo(1),
          },
        ],
        error: null,
      },
    ]);
    createUntypedAdminClientMock.mockReturnValue(client);

    const result = await listSmartLinks({
      page: 1,
      search: "great",
      status: "live",
    });

    expect(result.success).toBe(true);
    expect(result.data?.items[0]).toMatchObject({
      id: "link-1",
      slug: "great-review",
      stats7d: { views: 7, clicks: 2 },
      source: { customerName: "Jane", sourceType: "review" },
    });
    expect(fromMock).toHaveBeenCalledWith("proof_link_events_daily");
  });

  it("bulk-updates Smart Links in the authenticated organization", async () => {
    const { client, builders } = createSupabaseClient([
      { data: [{ id: "link-1" }, { id: "link-2" }], error: null },
    ]);
    createUntypedAdminClientMock.mockReturnValue(client);

    const result = await bulkUpdateSmartLinks({
      ids: ["link-1", "link-2"],
      action: "unpublish",
    });

    expect(result).toEqual({
      success: true,
      data: { updated: 2 },
    });
    expect(builders[0].update).toHaveBeenCalledWith(
      expect.objectContaining({ published: false })
    );
    expect(builders[0].eq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(builders[0].in).toHaveBeenCalledWith("id", ["link-1", "link-2"]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/share-studio");
  });

  it("loads per-link analytics with totals, CTR, series, and referrers", async () => {
    const { client, rpcMock } = createSupabaseClient([
      {
        data: {
          id: "link-1",
          title: "Great review",
          slug: "great-review",
          destination_url: null,
          published: true,
          archived_at: null,
          created_at: daysAgo(7).toISOString(),
          proof_items: {
            id: "item-1",
            source_type: "review",
            source_id: "review-1",
            title: "Review from Jane",
            customer_name: "Jane",
            rating: 5,
          },
        },
        error: null,
      },
      {
        data: [
          {
            proof_link_id: "link-1",
            event_type: "view",
            event_count: 10,
            event_date: eventDateDaysAgo(1),
          },
          {
            proof_link_id: "link-1",
            event_type: "click",
            event_count: 3,
            event_date: eventDateDaysAgo(1),
          },
        ],
        error: null,
      },
    ], [
      {
        data: [
          { referrer: "linkedin.com", event_count: 2 },
          { referrer: "Direct", event_count: 1 },
        ],
        error: null,
      },
    ]);
    createUntypedAdminClientMock.mockReturnValue(client);

    const result = await getSmartLinkAnalytics("link-1");

    expect(result.success).toBe(true);
    expect(result.data?.totals).toMatchObject({
      views: 10,
      clicks: 3,
      ctr: 30,
    });
    expect(result.data?.series).toHaveLength(30);
    expect(result.data?.referrers.slice(0, 2)).toEqual([
      { referrer: "linkedin.com", count: 2 },
      { referrer: "Direct", count: 1 },
    ]);
    expect(rpcMock).toHaveBeenCalledWith("proof_link_referrer_summary", {
      p_link_id: "link-1",
      p_days: 30,
      p_limit: 10,
    });
  });
});
