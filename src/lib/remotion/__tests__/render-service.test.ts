import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminClientMock,
  bundleMock,
  renderMediaMock,
  renderStillMock,
  selectCompositionMock,
  readFileMock,
  unlinkMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  bundleMock: vi.fn(),
  renderMediaMock: vi.fn(),
  renderStillMock: vi.fn(),
  selectCompositionMock: vi.fn(),
  readFileMock: vi.fn(),
  unlinkMock: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock("@remotion/bundler", () => ({
  bundle: bundleMock,
}));

vi.mock("@remotion/renderer", () => ({
  renderMedia: renderMediaMock,
  renderStill: renderStillMock,
  selectComposition: selectCompositionMock,
}));

vi.mock("fs/promises", () => ({
  readFile: readFileMock,
  unlink: unlinkMock,
}));

import { renderVideo } from "../render-service";

type QueryRecord = {
  table: string;
  filters: Array<[string, unknown]>;
};

function createQueryBuilder(
  table: string,
  response: { data: unknown; error: unknown },
  queryLog: QueryRecord[]
) {
  const record: QueryRecord = {
    table,
    filters: [],
  };
  queryLog.push(record);

  const builder = {
    eq: vi.fn((column: string, value: unknown) => {
      record.filters.push([column, value]);
      return builder;
    }),
    order: vi.fn(() => builder),
    limit: vi.fn(() => builder),
    in: vi.fn(() => builder),
    single: vi.fn().mockResolvedValue(response),
    maybeSingle: vi.fn().mockResolvedValue(response),
  };

  return builder;
}

function createAdminClient(queryLog: QueryRecord[]) {
  const responses = {
    organizations: {
      data: {
        id: "org-1",
        name: "Org One",
        logo_url: null,
        primary_color: "#354f52",
      },
      error: null,
    },
    users: {
      data: {
        id: "user-99",
        full_name: "Cross Tenant User",
        photo_url: null,
      },
      error: null,
    },
    leaderboard_snapshots: {
      data: {
        reputation_score: 88,
        rank: 1,
        total_reviews: 32,
        average_rating: 4.9,
      },
      error: null,
    },
  } as const;

  const storageBucket = {
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({
      data: {
        publicUrl: "https://example.com/video.mp4",
      },
    }),
  };

  return {
    from: vi.fn((table: keyof typeof responses) => ({
      select: vi.fn(() => createQueryBuilder(table, responses[table], queryLog)),
    })),
    storage: {
      from: vi.fn(() => storageBucket),
    },
  };
}

describe("render service organization scoping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bundleMock.mockResolvedValue("/tmp/remotion-bundle");
    selectCompositionMock.mockResolvedValue({ durationInFrames: 180 });
    renderMediaMock.mockResolvedValue(undefined);
    renderStillMock.mockResolvedValue(undefined);
    readFileMock.mockResolvedValue(Buffer.from("video"));
    unlinkMock.mockResolvedValue(undefined);
  });

  it("scopes new leader lookups to the requested organization", async () => {
    const queryLog: QueryRecord[] = [];
    createAdminClientMock.mockReturnValue(createAdminClient(queryLog));

    const result = await renderVideo({
      compositionType: "leaderboard-celebration",
      celebrationType: "new_leader",
      format: "16:9",
      organizationId: "org-1",
      userId: "user-99",
    });

    expect(result.success).toBe(true);

    const userQuery = queryLog.find((query) => query.table === "users");
    expect(userQuery?.filters).toEqual(
      expect.arrayContaining([
        ["id", "user-99"],
        ["organization_id", "org-1"],
      ])
    );

    const leaderboardQuery = queryLog.find(
      (query) => query.table === "leaderboard_snapshots"
    );
    expect(leaderboardQuery?.filters).toEqual(
      expect.arrayContaining([
        ["user_id", "user-99"],
        ["organization_id", "org-1"],
      ])
    );
  });
});
