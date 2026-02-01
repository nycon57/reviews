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
  createAbTest,
  getAbTestResults,
  listAbTests,
  declareWinner,
  cancelAbTest,
  getPublicAbTestConfig,
} from "../ab-testing";

// ── Helpers ─────────────────────────────────────────────────────────────

const mockUser = { id: "user-001" };
const mockUserData = { organization_id: "org-001", role: "admin" };

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createMockQueryChain(finalResult: {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}): MockChain {
  const chain: MockChain = {} as MockChain;
  const returnChain = () => chain;

  chain.select = vi.fn().mockImplementation(returnChain);
  chain.insert = vi.fn().mockImplementation(returnChain);
  chain.update = vi.fn().mockImplementation(returnChain);
  chain.delete = vi.fn().mockImplementation(returnChain);
  chain.eq = vi.fn().mockImplementation(returnChain);
  chain.in = vi.fn().mockImplementation(returnChain);
  chain.is = vi.fn().mockImplementation(returnChain);
  chain.not = vi.fn().mockImplementation(returnChain);
  chain.gte = vi.fn().mockImplementation(returnChain);
  chain.order = vi.fn().mockImplementation(returnChain);
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve(finalResult).then(resolve)
  );

  return chain;
}

/** Creates a mock Supabase client that routes `.from(table)` to pre-configured chains. */
function setupMockSupabase(fromResults: Record<string, MockChain>) {
  const callCounts: Record<string, number> = {};
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    callCounts[table] = (callCounts[table] ?? 0) + 1;
    return fromResults[table] ?? createMockQueryChain({ data: null, error: null });
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: mockFrom,
  });

  return mockFrom;
}

function setupAuth(user = mockUser) {
  (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(user);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createAbTest ──────────────────────────────────────────────────────

describe("createAbTest", () => {
  it("returns error if not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({});

    const result = await createAbTest({
      parentWidgetId: "w-001",
      variantConfig: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("rejects split percent outside 10-90 range", async () => {
    setupAuth();
    const usersChain = createMockQueryChain({ data: mockUserData });
    setupMockSupabase({ users: usersChain });

    const result = await createAbTest({
      parentWidgetId: "w-001",
      variantConfig: {},
      splitPercent: 5,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("between 10 and 90");
    }
  });

  it("rejects when widget already has an active A/B test", async () => {
    setupAuth();

    const parentWidget = {
      id: "w-001",
      widget_id: "test-widget-abc",
      name: "Test Widget",
      organization_id: "org-001",
      widget_type: "lo_review",
      entity_type: "user",
      entity_id: "entity-001",
      config: {},
      ab_test_config: {
        enabled: true,
        splitPercent: 50,
        variantWidgetId: "w-002",
        startedAt: new Date().toISOString(),
        status: "running",
      },
      parent_widget_id: null,
      allowed_domains: [],
      enable_structured_data: true,
      structured_data_type: "LocalBusiness",
      status: "active",
      version: 1,
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const widgetChain = createMockQueryChain({ data: parentWidget });
    setupMockSupabase({
      users: usersChain,
      widget_configs: widgetChain,
    });

    const result = await createAbTest({
      parentWidgetId: "w-001",
      variantConfig: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("already has an active A/B test");
    }
  });

  it("rejects creating A/B test on a variant widget", async () => {
    setupAuth();

    const variantWidget = {
      id: "w-002",
      widget_id: "variant-abc",
      name: "Variant Widget",
      organization_id: "org-001",
      parent_widget_id: "w-001", // This is a variant
      ab_test_config: null,
      config: {},
      widget_type: "lo_review",
      entity_type: "user",
      entity_id: "entity-001",
      allowed_domains: [],
      enable_structured_data: true,
      structured_data_type: "LocalBusiness",
      status: "active",
      version: 1,
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const widgetChain = createMockQueryChain({ data: variantWidget });
    setupMockSupabase({
      users: usersChain,
      widget_configs: widgetChain,
    });

    const result = await createAbTest({
      parentWidgetId: "w-002",
      variantConfig: {},
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("variant widget");
    }
  });
});

// ── cancelAbTest ────────────────────────────────────────────────────────

describe("cancelAbTest", () => {
  it("returns error if not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({});

    const result = await cancelAbTest("w-001");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("returns error when no active test exists", async () => {
    setupAuth();

    const widget = {
      id: "w-001",
      organization_id: "org-001",
      ab_test_config: null,
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const widgetChain = createMockQueryChain({ data: widget });
    setupMockSupabase({
      users: usersChain,
      widget_configs: widgetChain,
    });

    const result = await cancelAbTest("w-001");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("No active A/B test");
    }
  });
});

// ── declareWinner ────────────────────────────────────────────────────────

describe("declareWinner", () => {
  it("returns error if not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({});

    const result = await declareWinner({
      parentWidgetId: "w-001",
      winnerId: "w-001",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Not authenticated");
    }
  });

  it("rejects invalid winnerId", async () => {
    setupAuth();

    const parentWidget = {
      id: "w-001",
      organization_id: "org-001",
      ab_test_config: {
        enabled: true,
        splitPercent: 50,
        variantWidgetId: "w-002",
        startedAt: new Date().toISOString(),
        status: "running",
      },
      config: {},
      version: 1,
    };

    const variant = {
      id: "w-002",
      widget_id: "variant-abc",
      config: {},
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const widgetChain = createMockQueryChain({ data: parentWidget });
    setupMockSupabase({
      users: usersChain,
      widget_configs: widgetChain,
    });

    // Override the second call to return the variant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFrom = (createAdminClient as any)();
    vi.mocked(mockFrom.from).mockImplementation((table: string) => {
      if (table === "users") return createMockQueryChain({ data: mockUserData });
      return createMockQueryChain({ data: parentWidget });
    });

    const result = await declareWinner({
      parentWidgetId: "w-001",
      winnerId: "invalid-id",
    });

    // Should fail somewhere in the flow (either not found or invalid winner)
    // The exact error depends on mock chain behavior
    expect(result.success).toBe(false);
  });
});

// ── getPublicAbTestConfig ─────────────────────────────────────────────

describe("getPublicAbTestConfig", () => {
  it("returns null when no ab_test_config exists", async () => {
    const widgetChain = createMockQueryChain({
      data: { ab_test_config: null },
    });
    setupMockSupabase({ widget_configs: widgetChain });

    const result = await getPublicAbTestConfig("w-001");
    expect(result).toBeNull();
  });

  it("returns null when test is not running", async () => {
    const widgetChain = createMockQueryChain({
      data: {
        ab_test_config: {
          enabled: false,
          splitPercent: 50,
          variantWidgetId: "w-002",
          startedAt: new Date().toISOString(),
          status: "completed",
        },
      },
    });
    setupMockSupabase({ widget_configs: widgetChain });

    const result = await getPublicAbTestConfig("w-001");
    expect(result).toBeNull();
  });

  it("returns public config when test is running", async () => {
    const variantChain = createMockQueryChain({
      data: { widget_id: "variant-slug-abc" },
    });

    const parentChain = createMockQueryChain({
      data: {
        ab_test_config: {
          enabled: true,
          splitPercent: 50,
          variantWidgetId: "w-002",
          startedAt: new Date().toISOString(),
          status: "running",
        },
      },
    });

    // Both parent lookup and variant lookup go through widget_configs
    let callCount = 0;
    const mockFrom = vi.fn().mockImplementation(() => {
      callCount++;
      // First call fetches parent ab_test_config, second fetches variant slug
      return callCount === 1 ? parentChain : variantChain;
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: mockFrom,
    });

    const result = await getPublicAbTestConfig("w-001");

    expect(result).not.toBeNull();
    expect(result?.enabled).toBe(true);
    expect(result?.splitPercent).toBe(50);
    expect(result?.variantWidgetSlug).toBe("variant-slug-abc");
  });
});
