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
  };

  // Every method returns the chain
  for (const key of Object.keys(chain) as (keyof MockChain)[]) {
    chain[key].mockReturnValue(chain);
  }

  // Terminal methods return the final result
  chain.single.mockResolvedValue(finalResult);
  chain.maybeSingle.mockResolvedValue(finalResult);

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
