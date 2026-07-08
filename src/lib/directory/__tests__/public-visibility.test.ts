import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableIndustries, searchProfessionals } from "../actions";

type MockChain = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  is: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  range: ReturnType<typeof vi.fn>;
  filter: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
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
  chain.range = vi.fn().mockImplementation(returnChain);
  chain.filter = vi.fn().mockImplementation(returnChain);
  chain.gte = vi.fn().mockImplementation(returnChain);
  chain.limit = vi.fn().mockImplementation(returnChain);
  chain.then = vi.fn().mockImplementation((resolve: (value: unknown) => unknown) =>
    Promise.resolve(finalResult).then(resolve)
  );

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public visibility queries in directory actions", () => {
  it("applies public visibility filters to search results and facets", async () => {
    const searchChain = createMockQueryChain({ data: [], error: null, count: 0 });
    const facetsChain = createMockQueryChain({ data: [], error: null });
    let userCallCount = 0;

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== "users") throw new Error(`Unexpected table: ${table}`);
        userCallCount += 1;
        return userCallCount === 1 ? searchChain : facetsChain;
      }),
    });

    await searchProfessionals({});

    for (const chain of [searchChain, facetsChain]) {
      expect(chain.eq).toHaveBeenCalledWith("is_active", true);
      expect(chain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
      expect(chain.neq).toHaveBeenCalledWith("role", "manager");
      expect(chain.neq).toHaveBeenCalledWith("role", "enterprise");
      expect(chain.neq).not.toHaveBeenCalledWith("role", "admin");
      expect(chain.is).toHaveBeenCalledWith("is_public_professional", true);
    }
  });

  it("applies public visibility filters to available industries", async () => {
    const industriesChain = createMockQueryChain({ data: [], error: null });

    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table !== "users") throw new Error(`Unexpected table: ${table}`);
        return industriesChain;
      }),
    });

    await getAvailableIndustries();

    expect(industriesChain.eq).toHaveBeenCalledWith("is_active", true);
    expect(industriesChain.eq).toHaveBeenCalledWith("accepts_public_reviews", true);
    expect(industriesChain.neq).toHaveBeenCalledWith("role", "manager");
    expect(industriesChain.neq).toHaveBeenCalledWith("role", "enterprise");
    expect(industriesChain.neq).not.toHaveBeenCalledWith("role", "admin");
    expect(industriesChain.is).toHaveBeenCalledWith("is_public_professional", true);
  });
});
