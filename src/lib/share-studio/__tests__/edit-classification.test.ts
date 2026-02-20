import { describe, expect, it } from "vitest";
import { classifyProofItemEdit } from "@/lib/share-studio/edit-classification";

describe("classifyProofItemEdit", () => {
  it("classifies typo/case edits as minor", () => {
    const result = classifyProofItemEdit({
      sourceType: "review",
      originalPayload: {
        quote: "Amazing service and fast communication.",
        summary: "Amazing service",
      },
      editedPayload: {
        quote: "amazing service and fast communication",
        summary: "Amazing service",
      },
    });

    expect(result.classification).toBe("minor");
    expect(result.lexicalDeltaPercent).toBeLessThanOrEqual(8);
  });

  it("classifies moderate rewrite as material", () => {
    const result = classifyProofItemEdit({
      sourceType: "review",
      originalPayload: {
        quote: "Great communication and quick close. Highly recommend this team.",
      },
      editedPayload: {
        quote: "Great communication and quick closing. I highly recommend the team.",
      },
    });

    expect(result.classification).toBe("material");
    expect(result.lexicalDeltaPercent).toBeGreaterThan(8);
    expect(result.lexicalDeltaPercent).toBeLessThanOrEqual(30);
  });

  it("blocks manipulative rewrites above 30% lexical delta", () => {
    const result = classifyProofItemEdit({
      sourceType: "review",
      originalPayload: {
        quote: "Great lender and smooth closing process.",
      },
      editedPayload: {
        quote: "Worst experience ever. The entire process was broken and a scam.",
      },
    });

    expect(result.classification).toBe("blocked");
    expect(result.lexicalDeltaPercent).toBeGreaterThan(30);
  });

  it("blocks sentiment-flip edits", () => {
    const result = classifyProofItemEdit({
      sourceType: "review",
      originalPayload: {
        quote: "Great and excellent experience. Friendly and professional team.",
      },
      editedPayload: {
        quote: "Terrible and horrible experience. Slow and rude team.",
      },
    });

    expect(result.classification).toBe("blocked");
    expect(result.sentimentFlipDetected).toBe(true);
  });

  it("blocks protected source field edits for sourced items", () => {
    const result = classifyProofItemEdit({
      sourceType: "review",
      originalPayload: {
        rating: 5,
        source_platform: "google",
        source_review_date: "2026-02-01T00:00:00.000Z",
      },
      editedPayload: {
        rating: 3,
        source_platform: "google",
        source_review_date: "2026-02-01T00:00:00.000Z",
      },
    });

    expect(result.classification).toBe("blocked");
    expect(result.protectedFieldChanged).toBe(true);
  });

  it("allows protected-style fields for manual_json source", () => {
    const result = classifyProofItemEdit({
      sourceType: "manual_json",
      originalPayload: {
        rating: 5,
        quote: "Great service",
      },
      editedPayload: {
        rating: 4,
        quote: "Great service",
      },
    });

    expect(result.classification).not.toBe("blocked");
  });
});
