import { describe, expect, it } from "vitest";
import {
  AI_CRAWLER_BOT_NAMES,
  classifyAgentUserAgent,
} from "@/lib/agents/detection";

describe("classifyAgentUserAgent", () => {
  it.each([
    ["Googlebot", "search"],
    ["Bingbot", "search"],
    ["Applebot", "search"],
    ["DuckDuckBot", "search"],
    ["GPTBot", "llm"],
    ["ClaudeBot", "llm"],
    ["PerplexityBot", "llm"],
    ["CCBot", "llm"],
    ["cohere-ai", "llm"],
    ["Google-Extended", "llm"],
    ["Applebot-Extended", "llm"],
    ["Bytespider", "llm"],
    ["anthropic-ai", "llm"],
    ["ChatGPT-User", "agent"],
    ["Claude-Web", "agent"],
    ["OAI-SearchBot", "agent"],
  ] as const)("classifies %s as %s", (botName, category) => {
    expect(
      classifyAgentUserAgent(
        `Mozilla/5.0 compatible; ${botName}/1.0; +https://example.com/bot`
      )
    ).toEqual({
      botName,
      category,
    });
  });

  it.each([
    "FriendlyCrawler/1.0",
    "Some Spider (+https://example.com)",
    "ExampleBot/2.1",
    "facebookexternalhit/1.1",
    "WhatsApp/2.0",
  ])("classifies generic bot traffic as unknown: %s", (userAgent) => {
    expect(classifyAgentUserAgent(userAgent)).toEqual({
      botName: "UnknownBot",
      category: "unknown",
    });
  });

  it.each([
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
  ])("does not classify regular browser traffic: %s", (userAgent) => {
    expect(classifyAgentUserAgent(userAgent)).toBeNull();
  });

  it("prioritizes Applebot-Extended over Applebot", () => {
    expect(classifyAgentUserAgent("Applebot-Extended/1.0")).toEqual({
      botName: "Applebot-Extended",
      category: "llm",
    });
  });

  it("exports the AI crawler allow-list from the detection registry", () => {
    expect(AI_CRAWLER_BOT_NAMES).toEqual(
      expect.arrayContaining([
        "GPTBot",
        "OAI-SearchBot",
        "ChatGPT-User",
        "ClaudeBot",
        "Claude-Web",
        "anthropic-ai",
        "PerplexityBot",
        "Google-Extended",
        "CCBot",
      ])
    );
    expect(AI_CRAWLER_BOT_NAMES).not.toContain("Googlebot");
  });
});
