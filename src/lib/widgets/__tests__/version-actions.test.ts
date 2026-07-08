import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  unifiedGetUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import {
  createVersionSnapshot,
  listWidgetVersions,
  getWidgetVersion,
  rollbackToVersion,
} from "../version-actions";

// ── Helpers ─────────────────────────────────────────────────────────────

const mockUser = { id: "user-001" };
const mockUserData = { organization_id: "org-001", role: "admin" };

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createMockQueryChain(finalResult: {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}): MockChain {
  const chain: MockChain = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    in: vi.fn(),
    then: vi.fn(),
  };

  // Every method returns the chain
  for (const key of Object.keys(chain) as (keyof MockChain)[]) {
    chain[key].mockReturnValue(chain);
  }

  // Terminal methods return the final result
  chain.single.mockResolvedValue(finalResult);
  chain.maybeSingle.mockResolvedValue(finalResult);
  chain.then.mockImplementation((resolve: (value: unknown) => unknown) =>
    Promise.resolve(finalResult).then(resolve)
  );

  // For non-terminal calls that need to resolve
  const resolvedChain = { ...chain, ...finalResult };
  chain.limit.mockResolvedValue(resolvedChain);
  chain.order.mockReturnValue(chain);

  return chain;
}

function setupMockSupabase(tableChains: Record<string, MockChain>) {
  const fromFn = vi.fn((table: string) => {
    return tableChains[table] ?? createMockQueryChain({ data: null, error: null });
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: fromFn,
  });

  return fromFn;
}

beforeEach(() => {
  vi.clearAllMocks();
  (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
});

// ── Tests ───────────────────────────────────────────────────────────────

describe("createVersionSnapshot", () => {
  it("returns error when not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({
      users: createMockQueryChain({ data: mockUserData, error: null }),
    });

    const result = await createVersionSnapshot("widget-001");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("returns error when widget not found", async () => {
    const userChain = createMockQueryChain({ data: mockUserData, error: null });
    const widgetChain = createMockQueryChain({ data: null, error: { message: "Not found" } });

    setupMockSupabase({
      users: userChain,
      widget_configs: widgetChain,
    });

    const result = await createVersionSnapshot("widget-001");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Widget not found");
    }
  });
});

describe("listWidgetVersions", () => {
  it("returns error when not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({
      users: createMockQueryChain({ data: mockUserData, error: null }),
    });

    const result = await listWidgetVersions("widget-001");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("allows individual accounts via organizations.account_type", async () => {
    const individualUserData = {
      organization_id: "org-individual-001",
      role: "user",
      organizations: { account_type: "individual" },
    };
    const userChain = createMockQueryChain({ data: individualUserData, error: null });
    const widgetChain = createMockQueryChain({ data: { id: "widget-001" }, error: null });
    const versionsChain = createMockQueryChain({
      data: [
        {
          id: "version-001",
          widget_config_id: "widget-001",
          version: 2,
          config: { content: { showHeader: false } },
          name: "Widget",
          status: "active",
          allowed_domains: [],
          enable_structured_data: true,
          structured_data_type: "LocalBusiness",
          entity_id: null,
          changed_by: "user-001",
          change_note: null,
          change_summary: "Updated content",
          created_at: "2026-03-07T00:00:00.000Z",
        },
      ],
      error: null,
      count: 1,
    });
    const namesChain = createMockQueryChain({
      data: [{ id: "user-001", full_name: "Taylor User" }],
      error: null,
    });

    let usersCallCount = 0;
    const fromFn = vi.fn((table: string) => {
      if (table === "users") {
        usersCallCount += 1;
        return usersCallCount === 1 ? userChain : namesChain;
      }
      if (table === "widget_configs") return widgetChain;
      if (table === "widget_config_versions") return versionsChain;
      return createMockQueryChain({ data: null, error: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: fromFn,
    });

    const result = await listWidgetVersions("widget-001");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(1);
      expect(result.data.versions[0]?.changed_by_name).toBe("Taylor User");
    }
  });

  it("backfills the current widget state when no version history exists", async () => {
    const userChain = createMockQueryChain({ data: mockUserData, error: null });
    const widgetRecord = {
      id: "widget-001",
      name: "Widget",
      status: "active",
      config: { content: { showHeader: true } },
      allowed_domains: [],
      enable_structured_data: true,
      structured_data_type: "LocalBusiness",
      entity_id: null,
      version: 3,
    };
    const widgetChain = createMockQueryChain({ data: widgetRecord, error: null });
    const emptyVersionsChain = createMockQueryChain({
      data: [],
      error: null,
      count: 0,
    });
    const insertSnapshotChain = createMockQueryChain({ data: null, error: null });
    const filledVersionsChain = createMockQueryChain({
      data: [
        {
          id: "version-003",
          widget_config_id: "widget-001",
          version: 3,
          config: { content: { showHeader: true } },
          name: "Widget",
          status: "active",
          allowed_domains: [],
          enable_structured_data: true,
          structured_data_type: "LocalBusiness",
          entity_id: null,
          changed_by: "user-001",
          change_note: "Backfilled current widget state; earlier history unavailable",
          change_summary: "Current state imported; earlier history unavailable",
          created_at: "2026-03-08T00:00:00.000Z",
        },
      ],
      error: null,
      count: 1,
    });
    const namesChain = createMockQueryChain({
      data: [{ id: "user-001", full_name: "Taylor User" }],
      error: null,
    });

    let usersCallCount = 0;
    let versionTableCallCount = 0;
    const fromFn = vi.fn((table: string) => {
      if (table === "users") {
        usersCallCount += 1;
        return usersCallCount === 1 ? userChain : namesChain;
      }
      if (table === "widget_configs") return widgetChain;
      if (table === "widget_config_versions") {
        versionTableCallCount += 1;
        if (versionTableCallCount === 1) return emptyVersionsChain;
        if (versionTableCallCount === 2) return insertSnapshotChain;
        return filledVersionsChain;
      }
      return createMockQueryChain({ data: null, error: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: fromFn,
    });

    const result = await listWidgetVersions("widget-001");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(1);
      expect(result.data.versions[0]?.version).toBe(3);
      expect(result.data.versions[0]?.change_note).toContain("Backfilled");
    }
  });
});

describe("getWidgetVersion", () => {
  it("returns error when not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({
      users: createMockQueryChain({ data: mockUserData, error: null }),
    });

    const result = await getWidgetVersion("widget-001", 1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });
});

describe("rollbackToVersion", () => {
  it("returns error when not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({
      users: createMockQueryChain({ data: mockUserData, error: null }),
    });

    const result = await rollbackToVersion("widget-001", 1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("returns error when widget not found", async () => {
    const userChain = createMockQueryChain({ data: mockUserData, error: null });
    const widgetChain = createMockQueryChain({ data: null, error: { message: "Not found" } });

    setupMockSupabase({
      users: userChain,
      widget_configs: widgetChain,
    });

    const result = await rollbackToVersion("widget-001", 1);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Widget not found");
    }
  });
});
