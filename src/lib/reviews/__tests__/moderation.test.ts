import { describe, expect, it, vi, beforeEach } from "vitest";

const generateContent = vi.fn();
let aiEnabled = false;

vi.mock("@/lib/ai/client", () => ({
  getGeminiClient: () => ({ models: { generateContent } }),
  isAIEnabled: () => aiEnabled,
}));

import { screenReviewText } from "@/lib/reviews/moderation";

beforeEach(() => {
  generateContent.mockReset();
  aiEnabled = false;
});

describe("screenReviewText baseline checks", () => {
  it("passes a clean negative review", async () => {
    const result = await screenReviewText(
      "The process was slow and communication was poor. I would not recommend this team."
    );
    expect(result.verdict).toBe("pass");
    expect(result.provider).toBe("baseline");
  });

  it("quarantines profanity", async () => {
    const result = await screenReviewText("This was a fucking nightmare.");
    expect(result.verdict).toBe("quarantine");
    expect(result.reasons).toContain("profanity");
  });

  it("does not false-positive on substrings of clean words", async () => {
    const result = await screenReviewText(
      "The assessment was passable and the class was great."
    );
    expect(result.verdict).toBe("pass");
  });

  it("quarantines email addresses", async () => {
    const result = await screenReviewText("Reach me at jane.doe@example.com for details.");
    expect(result.reasons).toContain("pii_email");
  });

  it("quarantines phone numbers", async () => {
    const result = await screenReviewText("Call me at (555) 123-4567 anytime.");
    expect(result.reasons).toContain("pii_phone");
  });

  it("quarantines SSNs", async () => {
    const result = await screenReviewText("My SSN is 123-45-6789 and they leaked it.");
    expect(result.reasons).toContain("pii_ssn");
  });

  it("quarantines street addresses", async () => {
    const result = await screenReviewText("They showed up at 123 Main Street unannounced.");
    expect(result.reasons).toContain("pii_address");
  });

  it("does not flag ordinary numbers as addresses or phones", async () => {
    const result = await screenReviewText(
      "We closed in 30 days on a 450000 loan with a 6.5 percent rate."
    );
    expect(result.verdict).toBe("pass");
  });

  it("quarantines link spam", async () => {
    const result = await screenReviewText(
      "Visit https://a.com and https://b.com and https://c.com now"
    );
    expect(result.reasons).toContain("spam_links");
  });

  it("quarantines character-run repetition", async () => {
    const result = await screenReviewText("Greaaaaaaaaaaaat service!!!");
    expect(result.reasons).toContain("spam_repetition");
  });

  it("screens the customer name too", async () => {
    const result = await screenReviewText("Lovely experience.", "buy@spam.example.com");
    expect(result.reasons).toContain("pii_email");
  });
});

describe("screenReviewText Gemini layer", () => {
  it("passes when Gemini does not flag", async () => {
    aiEnabled = true;
    generateContent.mockResolvedValue({ text: '{"flagged": false, "categories": []}' });
    const result = await screenReviewText("Everything went smoothly, thanks!");
    expect(result.verdict).toBe("pass");
    expect(result.provider).toBe("gemini");
  });

  it("quarantines when Gemini flags", async () => {
    aiEnabled = true;
    generateContent.mockResolvedValue({
      text: '{"flagged": true, "categories": ["harassment"]}',
    });
    const result = await screenReviewText("Some borderline content");
    expect(result.verdict).toBe("quarantine");
    expect(result.reasons).toContain("ai_flagged");
  });

  it("fails closed when the provider errors", async () => {
    aiEnabled = true;
    generateContent.mockRejectedValue(new Error("network down"));
    const result = await screenReviewText("Perfectly fine review text.");
    expect(result.verdict).toBe("quarantine");
    expect(result.reasons).toContain("screen_error");
    expect(result.provider).toBe("fail_closed");
  });

  it("fails closed on malformed provider output", async () => {
    aiEnabled = true;
    generateContent.mockResolvedValue({ text: "not json" });
    const result = await screenReviewText("Perfectly fine review text.");
    expect(result.verdict).toBe("quarantine");
    expect(result.provider).toBe("fail_closed");
  });

  it("skips Gemini entirely when baseline already quarantined", async () => {
    aiEnabled = true;
    const result = await screenReviewText("This shit was unacceptable.");
    expect(generateContent).not.toHaveBeenCalled();
    expect(result.provider).toBe("baseline");
  });
});
