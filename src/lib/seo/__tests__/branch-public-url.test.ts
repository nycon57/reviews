import { describe, expect, it } from "vitest";
import { buildBranchBreadcrumbs } from "@/lib/directory/breadcrumb-utils";
import { generateBranchProfileMetadata } from "../metadata";

describe("branch public URLs", () => {
  it("uses the branch slug instead of the UUID when a global slug is missing", () => {
    const branch = {
      id: "b0000000-0001-4000-8000-000000000000",
      name: "Downtown Austin",
      slug: "downtown-austin",
      global_slug: null,
      description: null,
      photo_url: null,
      cover_image_url: null,
      address: { city: "Austin", state: "TX" },
      average_rating: 4.9,
      total_reviews: 24,
      total_members: 6,
    };

    const breadcrumbs = buildBranchBreadcrumbs(branch, {
      slug: "enterprise-test-corp",
      name: "Enterprise Test Corp",
    });
    const metadata = generateBranchProfileMetadata(
      branch,
      { name: "Enterprise Test Corp" },
      "https://app.repwell.com",
    );

    expect(breadcrumbs.at(-1)?.href).toBe("/branch/downtown-austin");
    expect(metadata.alternates?.canonical).toBe(
      "https://app.repwell.com/branch/downtown-austin",
    );
  });
});
