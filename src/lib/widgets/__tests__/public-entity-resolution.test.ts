import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWidgetEntityContext } from "../public-entity-resolution";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  then: ReturnType<typeof vi.fn>;
};

function createMockQueryChain(finalResult: {
  data?: unknown;
  error?: unknown;
}): MockChain {
  const chain: MockChain = {} as MockChain;
  const returnChain = () => chain;

  chain.select = vi.fn().mockImplementation(returnChain);
  chain.eq = vi.fn().mockImplementation(returnChain);
  chain.or = vi.fn().mockImplementation(returnChain);
  chain.maybeSingle = vi.fn().mockResolvedValue(finalResult);
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

const baseWidget = {
  widget_type: "review_wall",
  entity_type: "organization",
  entity_id: null,
  organization_id: "org-001",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveWidgetEntityContext", () => {
  it("returns stored widget entity when no override params are provided", async () => {
    setupMockSupabase({});

    const result = await resolveWidgetEntityContext(
      baseWidget,
      new URLSearchParams()
    );

    expect(result).toEqual({
      entityType: "organization",
      entityId: null,
      overrideApplied: false,
    });
  });

  it("accepts a valid user override for entity-aware widget types", async () => {
    const userChain = createMockQueryChain({
      data: { id: "123e4567-e89b-12d3-a456-426614174000" },
      error: null,
    });
    setupMockSupabase({ users: userChain });

    const result = await resolveWidgetEntityContext(
      baseWidget,
      new URLSearchParams({
        entityType: "user",
        entityId: "123e4567-e89b-12d3-a456-426614174000",
      })
    );

    expect(result).toEqual({
      entityType: "user",
      entityId: "123e4567-e89b-12d3-a456-426614174000",
      overrideApplied: true,
    });
  });

  it("accepts an organization override without an entity id", async () => {
    setupMockSupabase({});

    const result = await resolveWidgetEntityContext(
      baseWidget,
      new URLSearchParams({ entityType: "organization" })
    );

    expect(result).toEqual({
      entityType: "organization",
      entityId: null,
      overrideApplied: true,
    });
  });

  it("rejects user overrides without an entity id", async () => {
    setupMockSupabase({});

    await expect(
      resolveWidgetEntityContext(
        baseWidget,
        new URLSearchParams({ entityType: "user" })
      )
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_ENTITY_OVERRIDE",
    });
  });

  it("rejects organization overrides with a mismatched entity id", async () => {
    setupMockSupabase({});

    await expect(
      resolveWidgetEntityContext(
        baseWidget,
        new URLSearchParams({
          entityType: "organization",
          entityId: "123e4567-e89b-12d3-a456-426614174099",
        })
      )
    ).rejects.toMatchObject({
      status: 403,
      code: "ENTITY_OVERRIDE_FORBIDDEN",
    });
  });

  it("accepts organization overrides with matching entity id", async () => {
    setupMockSupabase({});

    const result = await resolveWidgetEntityContext(
      { ...baseWidget, organization_id: "123e4567-e89b-12d3-a456-426614174099" },
      new URLSearchParams({
        entityType: "organization",
        entityId: "123e4567-e89b-12d3-a456-426614174099",
      })
    );

    expect(result).toEqual({
      entityType: "organization",
      entityId: null,
      overrideApplied: true,
    });
  });

  it("rejects unsupported widget and entity combinations", async () => {
    setupMockSupabase({});

    await expect(
      resolveWidgetEntityContext(
        {
          ...baseWidget,
          widget_type: "company_review",
        },
        new URLSearchParams({
          entityType: "user",
          entityId: "123e4567-e89b-12d3-a456-426614174055",
        })
      )
    ).rejects.toMatchObject({
      status: 400,
      code: "UNSUPPORTED_ENTITY_OVERRIDE",
    });
  });

  it("rejects overrides for entities outside the widget organization", async () => {
    const userChain = createMockQueryChain({
      data: null,
      error: null,
    });
    setupMockSupabase({ users: userChain });

    await expect(
      resolveWidgetEntityContext(
        baseWidget,
        new URLSearchParams({
          entityType: "user",
          entityId: "123e4567-e89b-12d3-a456-426614174000",
        })
      )
    ).rejects.toMatchObject({
      status: 404,
      code: "ENTITY_OVERRIDE_NOT_FOUND",
    });
  });
});
