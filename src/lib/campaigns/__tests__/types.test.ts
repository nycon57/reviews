import { describe, expect, it } from "vitest";
import {
  CampaignStatusSchema,
  CreateCampaignInputSchema,
  UpdateCampaignInputSchema,
} from "@/lib/campaigns/types";

describe("campaign schemas", () => {
  it("accepts a valid create campaign payload", () => {
    const parsed = CreateCampaignInputSchema.parse({
      name: "Review Request Flow",
      description: "Collect reviews post-close",
    });

    expect(parsed.name).toBe("Review Request Flow");
    expect(parsed.description).toBe("Collect reviews post-close");
  });

  it("rejects empty campaign names", () => {
    const parsed = CreateCampaignInputSchema.safeParse({
      name: "   ",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts partial update payloads", () => {
    const parsed = UpdateCampaignInputSchema.parse({
      sequenceDefinition: {
        triggers: [{ type: "event", event: "user_signup" }],
      },
      canvasMetadata: {
        viewport: { x: 0, y: 0, zoom: 1 },
      },
    });

    expect(parsed.sequenceDefinition).toBeDefined();
    expect(parsed.canvasMetadata).toBeDefined();
  });

  it("rejects invalid campaign statuses", () => {
    const parsed = CampaignStatusSchema.safeParse("live");

    expect(parsed.success).toBe(false);
  });
});
