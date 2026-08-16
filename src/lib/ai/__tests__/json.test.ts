import { describe, expect, it } from "vitest";
import { parseAIJsonResponse } from "../json";

describe("parseAIJsonResponse", () => {
  it("parses strict JSON", () => {
    expect(parseAIJsonResponse<{ summary: string }>('{"summary":"Good"}')).toEqual({
      summary: "Good",
    });
  });

  it("parses JSON wrapped in a markdown fence", () => {
    const response = `\`\`\`json
{"summary":"Good","highlights":["Fast communication"]}
\`\`\``;

    expect(parseAIJsonResponse<{ highlights: string[] }>(response).highlights).toEqual([
      "Fast communication",
    ]);
  });

  it("parses a JSON object with surrounding model text", () => {
    const response = `Here is the summary:
{"summary":"Good","areasOfImprovement":["Follow up sooner"]}
Thanks.`;

    expect(
      parseAIJsonResponse<{ areasOfImprovement: string[] }>(response).areasOfImprovement
    ).toEqual(["Follow up sooner"]);
  });

  it("throws when no parseable JSON is present", () => {
    expect(() => parseAIJsonResponse("summary: Good")).toThrow();
  });
});
