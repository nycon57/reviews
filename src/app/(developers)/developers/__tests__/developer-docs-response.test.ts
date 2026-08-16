import { describe, expect, it } from "vitest";
import { apiV2Paginated } from "@/lib/api-v2/response";
import { responseExample } from "../page";

describe("developer response example", () => {
  it("matches the apiV2Paginated envelope keys", async () => {
    const example = JSON.parse(responseExample) as Record<string, unknown>;
    const response = apiV2Paginated([{ id: "pro_123" }], {
      total: 1,
      page: 1,
      perPage: 20,
    });
    const actual = (await response.json()) as Record<string, unknown>;

    expect(Object.keys(example).sort()).toEqual(Object.keys(actual).sort());
    expect(example).not.toHaveProperty("pagination");
  });
});
