import { describe, expect, it } from "vitest";
import { isNavHrefActive } from "../active";

const hrefs = [
  "/dashboard",
  "/dashboard/reviews",
  "/dashboard/reviews?tab=contacts",
  "/dashboard/analytics",
  "/dashboard/analytics/trends",
];

describe("isNavHrefActive", () => {
  it("selects the query-specific reviews item when its tab is active", () => {
    const params = new URLSearchParams("tab=contacts");

    expect(
      isNavHrefActive("/dashboard/reviews?tab=contacts", "/dashboard/reviews", params, hrefs)
    ).toBe(true);
    expect(isNavHrefActive("/dashboard/reviews", "/dashboard/reviews", params, hrefs)).toBe(
      false
    );
  });

  it("keeps the base reviews item active for unpromoted tabs", () => {
    const params = new URLSearchParams("tab=requests");

    expect(isNavHrefActive("/dashboard/reviews", "/dashboard/reviews", params, hrefs)).toBe(
      true
    );
  });

  it("prefers the more specific nested route", () => {
    const params = new URLSearchParams();

    expect(
      isNavHrefActive("/dashboard/analytics/trends", "/dashboard/analytics/trends", params, hrefs)
    ).toBe(true);
    expect(
      isNavHrefActive("/dashboard/analytics", "/dashboard/analytics/trends", params, hrefs)
    ).toBe(false);
  });
});
