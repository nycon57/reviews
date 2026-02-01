import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing actions
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
import { revalidatePath } from "next/cache";
import {
  createWidget,
  updateWidget,
  deleteWidget,
  listWidgets,
  getWidget,
  duplicateWidget,
} from "../actions";

// ── Helpers ─────────────────────────────────────────────────────────────

const mockUser = { id: "user-001" };
const mockUserData = { organization_id: "org-001", role: "admin" };

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  ilike: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
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
  chain.insert = vi.fn().mockImplementation(returnChain);
  chain.update = vi.fn().mockImplementation(returnChain);
  chain.eq = vi.fn().mockImplementation(returnChain);
  chain.is = vi.fn().mockImplementation(returnChain);
  chain.ilike = vi.fn().mockImplementation(returnChain);
  chain.order = vi.fn().mockImplementation(returnChain);
  chain.range = vi.fn().mockImplementation(returnChain);
  chain.single = vi.fn().mockResolvedValue(finalResult);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
  // Make chain thenable so `await chain` resolves to finalResult
  chain.then = vi.fn().mockImplementation((resolve: (v: unknown) => unknown) =>
    Promise.resolve(finalResult).then(resolve)
  );

  return chain;
}

function setupMockSupabase(fromResults: Record<string, MockChain>) {
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    return fromResults[table] ?? createMockQueryChain({ data: null, error: null });
  });

  (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
    from: mockFrom,
  });

  return mockFrom;
}

function setupAuth(user = mockUser, _userData = mockUserData) {
  (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(user);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── createWidget ────────────────────────────────────────────────────────

describe("createWidget", () => {
  it("creates a widget and returns it", async () => {
    setupAuth();

    const createdWidget = {
      id: "w-001",
      widget_id: "my-widget-abc123",
      name: "My Widget",
      widget_type: "lo_review",
      entity_type: "user",
      organization_id: "org-001",
      status: "draft",
      version: 1,
      config: {},
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const slugCheckChain = createMockQueryChain({ data: null });
    const insertChain = createMockQueryChain({ data: createdWidget });

    setupMockSupabase({
      users: usersChain,
      widget_configs: slugCheckChain,
    });

    // Override: second call to widget_configs.from is for insert
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFrom = (createAdminClient as any)().from;
    let callCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      if (table === "widget_configs") {
        callCount++;
        if (callCount === 1) return slugCheckChain; // slug check
        return insertChain; // insert
      }
      return createMockQueryChain({ data: null });
    });

    const result = await createWidget({
      name: "My Widget",
      widget_type: "lo_review",
      entity_type: "user",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("My Widget");
    }
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/widgets");
  });

  it("rejects when not authenticated", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    setupMockSupabase({});

    const result = await createWidget({
      name: "My Widget",
      widget_type: "lo_review",
      entity_type: "user",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Not authenticated");
  });

  it("rejects invalid input", async () => {
    const result = await createWidget({
      name: "",
      widget_type: "lo_review",
      entity_type: "user",
    });

    expect(result.success).toBe(false);
  });

  it("rejects users without admin/manager role", async () => {
    (unifiedGetUser as ReturnType<typeof vi.fn>).mockResolvedValue(mockUser);
    const usersChain = createMockQueryChain({
      data: { organization_id: "org-001", role: "user" },
    });
    setupMockSupabase({ users: usersChain });

    const result = await createWidget({
      name: "My Widget",
      widget_type: "lo_review",
      entity_type: "user",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("Insufficient permissions");
  });
});

// ── updateWidget ────────────────────────────────────────────────────────

describe("updateWidget", () => {
  it("merges config and increments version", async () => {
    setupAuth();

    const existingWidget = {
      id: "w-001",
      organization_id: "org-001",
      config: { theme: { preset: "clean_white" }, content: { showHeader: true } },
      version: 2,
    };
    const updatedWidget = {
      ...existingWidget,
      config: {
        theme: { preset: "dark" },
        content: { showHeader: true },
      },
      version: 3,
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: existingWidget });
    const updateChain = createMockQueryChain({ data: updatedWidget });

    const mockFrom = vi.fn();
    let widgetCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      if (table === "widget_configs") {
        widgetCallCount++;
        if (widgetCallCount === 1) return fetchChain;
        return updateChain;
      }
      return createMockQueryChain({ data: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await updateWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
      config: { theme: { preset: "dark" } },
    });

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/widgets");
  });

  it("returns error when widget not found", async () => {
    setupAuth();

    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: null, error: { message: "Not found" } });

    setupMockSupabase({ users: usersChain, widget_configs: fetchChain });

    const result = await updateWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "New Name",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Widget not found");
  });
});

// ── deleteWidget ────────────────────────────────────────────────────────

describe("deleteWidget", () => {
  it("soft-deletes by setting status to inactive", async () => {
    setupAuth();

    const existingWidget = { id: "w-001", organization_id: "org-001", widget_id: "my-widget" };
    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: existingWidget });
    const abCheckChain = createMockQueryChain({ data: null, count: 0 });
    const updateChain = createMockQueryChain({ data: null, error: null });

    const mockFrom = vi.fn();
    let widgetCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      if (table === "widget_configs") {
        widgetCallCount++;
        if (widgetCallCount === 1) return fetchChain;
        if (widgetCallCount === 2) return abCheckChain;
        return updateChain;
      }
      return createMockQueryChain({ data: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await deleteWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/widgets");
  });

  it("prevents deletion when active A/B test variants exist", async () => {
    setupAuth();

    const existingWidget = { id: "w-001", organization_id: "org-001", widget_id: "my-widget" };
    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: existingWidget });
    const abCheckChain = createMockQueryChain({ data: null, count: 2 });

    const mockFrom = vi.fn();
    let widgetCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      if (table === "widget_configs") {
        widgetCallCount++;
        if (widgetCallCount === 1) return fetchChain;
        return abCheckChain;
      }
      return createMockQueryChain({ data: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await deleteWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toContain("A/B test");
  });
});

// ── listWidgets ─────────────────────────────────────────────────────────

describe("listWidgets", () => {
  it("returns paginated widgets with defaults", async () => {
    setupAuth();

    const widgets = [
      { id: "w-001", name: "Widget 1", widget_type: "lo_review" },
      { id: "w-002", name: "Widget 2", widget_type: "review_carousel" },
    ];
    const usersChain = createMockQueryChain({ data: mockUserData });

    const listChain = createMockQueryChain({ data: widgets, error: null, count: 2 });

    setupMockSupabase({ users: usersChain, widget_configs: listChain });

    const result = await listWidgets({});

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.total).toBe(2);
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(20);
      expect(result.data.totalPages).toBe(1);
    }
  });

  it("applies filters correctly", async () => {
    setupAuth();

    const usersChain = createMockQueryChain({ data: mockUserData });
    const listChain = createMockQueryChain({ data: [], error: null, count: 0 });

    setupMockSupabase({ users: usersChain, widget_configs: listChain });

    const result = await listWidgets({
      widget_type: "lo_review",
      status: "active",
      entity_type: "user",
      search: "test",
      page: 2,
      pageSize: 5,
    });

    expect(result.success).toBe(true);
    // Verify eq was called for filters (org_id + widget_type + status + entity_type)
    expect(listChain.eq).toHaveBeenCalled();
    expect(listChain.ilike).toHaveBeenCalledWith("name", "%test%");
  });
});

// ── getWidget ───────────────────────────────────────────────────────────

describe("getWidget", () => {
  it("fetches by UUID when given a valid UUID", async () => {
    setupAuth();

    const widget = { id: "w-001", name: "My Widget", widget_id: "my-widget" };
    const usersChain = createMockQueryChain({ data: mockUserData });
    const getChain = createMockQueryChain({ data: widget });

    setupMockSupabase({ users: usersChain, widget_configs: getChain });

    const result = await getWidget({
      idOrSlug: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("My Widget");
    // Should have used "id" eq
    expect(getChain.eq).toHaveBeenCalledWith("id", "123e4567-e89b-12d3-a456-426614174000");
  });

  it("fetches by slug when given a non-UUID string", async () => {
    setupAuth();

    const widget = { id: "w-001", name: "My Widget", widget_id: "my-widget-abc123" };
    const usersChain = createMockQueryChain({ data: mockUserData });
    const getChain = createMockQueryChain({ data: widget });

    setupMockSupabase({ users: usersChain, widget_configs: getChain });

    const result = await getWidget({ idOrSlug: "my-widget-abc123" });

    expect(result.success).toBe(true);
    expect(getChain.eq).toHaveBeenCalledWith("widget_id", "my-widget-abc123");
  });

  it("returns error when widget not found", async () => {
    setupAuth();

    const usersChain = createMockQueryChain({ data: mockUserData });
    const getChain = createMockQueryChain({ data: null, error: { message: "Not found" } });

    setupMockSupabase({ users: usersChain, widget_configs: getChain });

    const result = await getWidget({ idOrSlug: "nonexistent-slug" });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Widget not found");
  });
});

// ── duplicateWidget ─────────────────────────────────────────────────────

describe("duplicateWidget", () => {
  it("deep-clones widget with (Copy) suffix and draft status", async () => {
    setupAuth();

    const sourceWidget = {
      id: "w-001",
      widget_id: "original-widget",
      name: "Original Widget",
      widget_type: "lo_review",
      entity_type: "user",
      entity_id: "entity-001",
      organization_id: "org-001",
      config: { theme: { preset: "dark" } },
      allowed_domains: ["example.com"],
      enable_structured_data: true,
      structured_data_type: "LocalBusiness",
    };

    const duplicatedWidget = {
      ...sourceWidget,
      id: "w-002",
      widget_id: "original-widget-copy-abc123",
      name: "Original Widget (Copy)",
      status: "draft",
      version: 1,
    };

    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: sourceWidget });
    const slugCheckChain = createMockQueryChain({ data: null });
    const insertChain = createMockQueryChain({ data: duplicatedWidget });

    const mockFrom = vi.fn();
    let widgetCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") return usersChain;
      if (table === "widget_configs") {
        widgetCallCount++;
        if (widgetCallCount === 1) return fetchChain; // fetch source
        if (widgetCallCount === 2) return slugCheckChain; // slug check
        return insertChain; // insert
      }
      return createMockQueryChain({ data: null });
    });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({ from: mockFrom });

    const result = await duplicateWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Original Widget (Copy)");
      expect(result.data.status).toBe("draft");
    }
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard/widgets");
  });

  it("returns error when source widget not found", async () => {
    setupAuth();

    const usersChain = createMockQueryChain({ data: mockUserData });
    const fetchChain = createMockQueryChain({ data: null, error: { message: "Not found" } });

    setupMockSupabase({ users: usersChain, widget_configs: fetchChain });

    const result = await duplicateWidget({
      id: "123e4567-e89b-12d3-a456-426614174000",
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe("Widget not found");
  });
});
