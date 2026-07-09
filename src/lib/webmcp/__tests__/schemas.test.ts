import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { webMcpToolSchemas } from "../schemas";

describe("webMcpToolSchemas", () => {
  it("has valid JSON Schemas for tool inputs and outputs", () => {
    const ajv = new Ajv();

    for (const tool of webMcpToolSchemas) {
      expect(() => ajv.compile(tool.inputSchema)).not.toThrow();
      expect(() => ajv.compile(tool.outputSchema)).not.toThrow();
    }
  });

  it("declares one input and one output schema for every tool", () => {
    expect(webMcpToolSchemas.map((tool) => tool.name)).toEqual([
      "searchProfessionals",
      "getProfessionalProfile",
      "getProfessionalReviews",
      "getCompanyProfile",
    ]);

    for (const tool of webMcpToolSchemas) {
      expect(tool.inputSchema).toMatchObject({ type: "object" });
      expect(tool.outputSchema).toMatchObject({ type: "object" });
    }
  });
});
