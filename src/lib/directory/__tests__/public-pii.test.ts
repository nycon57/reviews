import { describe, expect, it } from "vitest";

import { sanitizePublicAddress } from "../actions";

describe("sanitizePublicAddress", () => {
  it("returns null when the address has no public city or state", () => {
    expect(
      sanitizePublicAddress({
        street: "123 Main St",
        zip: "78701",
      })
    ).toBeNull();
  });

  it("preserves city and state only when present", () => {
    expect(
      sanitizePublicAddress({
        street: "123 Main St",
        city: "Austin",
        state: "TX",
        zip: "78701",
      })
    ).toEqual({
      city: "Austin",
      state: "TX",
    });
  });
});
