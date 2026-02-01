import { describe, it, expect } from "vitest";
import { OPT_OUT_KEYWORDS, OPT_IN_KEYWORDS, HELP_KEYWORDS } from "../webhook-validation";

/**
 * Standalone keyword classification for unit testing.
 * Mirrors KeywordHandler.classifyKeyword without Supabase dependency.
 */
type KeywordType = "opt_out" | "opt_in" | "double_opt_in_confirm" | "help" | "none";

function classifyKeyword(body: string): KeywordType {
  const normalized = body.trim().toLowerCase();
  if (OPT_OUT_KEYWORDS.has(normalized)) return "opt_out";
  if (HELP_KEYWORDS.has(normalized)) return "help";
  if (normalized === "yes") return "double_opt_in_confirm";
  if (OPT_IN_KEYWORDS.has(normalized)) return "opt_in";
  return "none";
}

/**
 * Unit tests for SMS keyword classification.
 * Tests all TCPA keyword variants: case-insensitive, with whitespace,
 * and edge cases.
 */
describe("KeywordHandler.classifyKeyword", () => {

  // ── Opt-out keywords ──────────────────────────────────────────────

  describe("opt-out keywords", () => {
    const optOutKeywords = ["stop", "stopall", "unsubscribe", "cancel", "end", "quit"];

    it.each(optOutKeywords)("classifies '%s' as opt_out", (keyword) => {
      expect(classifyKeyword(keyword)).toBe("opt_out");
    });

    it.each(optOutKeywords)("classifies uppercase '%s' as opt_out", (keyword) => {
      expect(classifyKeyword(keyword.toUpperCase())).toBe("opt_out");
    });

    it.each(optOutKeywords)("classifies mixed case '%s' as opt_out", (keyword) => {
      const mixed = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      expect(classifyKeyword(mixed)).toBe("opt_out");
    });

    it("handles leading whitespace", () => {
      expect(classifyKeyword("  stop")).toBe("opt_out");
    });

    it("handles trailing whitespace", () => {
      expect(classifyKeyword("stop  ")).toBe("opt_out");
    });

    it("handles whitespace on both sides", () => {
      expect(classifyKeyword("  STOP  ")).toBe("opt_out");
    });

    it("handles tab characters", () => {
      expect(classifyKeyword("\tstop\t")).toBe("opt_out");
    });

    it("handles newline characters", () => {
      expect(classifyKeyword("\nstop\n")).toBe("opt_out");
    });

    it("all expected opt-out keywords are covered", () => {
      for (const keyword of OPT_OUT_KEYWORDS) {
        expect(classifyKeyword(keyword)).toBe("opt_out");
      }
    });
  });

  // ── Opt-in keywords ───────────────────────────────────────────────

  describe("opt-in keywords", () => {
    const optInKeywords = ["start", "unstop"];

    it.each(optInKeywords)("classifies '%s' as opt_in", (keyword) => {
      expect(classifyKeyword(keyword)).toBe("opt_in");
    });

    it.each(optInKeywords)("classifies uppercase '%s' as opt_in", (keyword) => {
      expect(classifyKeyword(keyword.toUpperCase())).toBe("opt_in");
    });

    it("handles leading and trailing whitespace", () => {
      expect(classifyKeyword("  START  ")).toBe("opt_in");
    });

    it("all expected opt-in keywords are covered", () => {
      // "yes" is handled separately as double_opt_in_confirm
      for (const keyword of OPT_IN_KEYWORDS) {
        if (keyword === "yes") continue;
        expect(classifyKeyword(keyword)).toBe("opt_in");
      }
    });
  });

  // ── YES keyword (double opt-in / opt-in) ──────────────────────────

  describe("YES keyword", () => {
    it("classifies 'yes' as double_opt_in_confirm", () => {
      expect(classifyKeyword("yes")).toBe("double_opt_in_confirm");
    });

    it("classifies 'YES' as double_opt_in_confirm", () => {
      expect(classifyKeyword("YES")).toBe("double_opt_in_confirm");
    });

    it("classifies ' Yes ' as double_opt_in_confirm", () => {
      expect(classifyKeyword(" Yes ")).toBe("double_opt_in_confirm");
    });
  });

  // ── Help keywords ─────────────────────────────────────────────────

  describe("help keywords", () => {
    const helpKeywords = ["help", "info"];

    it.each(helpKeywords)("classifies '%s' as help", (keyword) => {
      expect(classifyKeyword(keyword)).toBe("help");
    });

    it.each(helpKeywords)("classifies uppercase '%s' as help", (keyword) => {
      expect(classifyKeyword(keyword.toUpperCase())).toBe("help");
    });

    it("handles whitespace around HELP", () => {
      expect(classifyKeyword("  help  ")).toBe("help");
    });

    it("all expected help keywords are covered", () => {
      for (const keyword of HELP_KEYWORDS) {
        expect(classifyKeyword(keyword)).toBe("help");
      }
    });
  });

  // ── Non-keyword messages ──────────────────────────────────────────

  describe("non-keyword messages", () => {
    it("classifies regular text as none", () => {
      expect(classifyKeyword("Hello there")).toBe("none");
    });

    it("classifies empty string as none", () => {
      expect(classifyKeyword("")).toBe("none");
    });

    it("classifies partial keyword as none (e.g., 'stopping')", () => {
      expect(classifyKeyword("stopping")).toBe("none");
    });

    it("classifies keyword embedded in text as none", () => {
      expect(classifyKeyword("please stop sending")).toBe("none");
    });

    it("classifies number-only messages as none", () => {
      expect(classifyKeyword("12345")).toBe("none");
    });

    it("classifies 'no' as none", () => {
      expect(classifyKeyword("no")).toBe("none");
    });
  });
});
