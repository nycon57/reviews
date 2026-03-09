import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { MultiSchemaStructuredData, StructuredData } from "@/components/seo/structured-data";

describe("StructuredData", () => {
  it("escapes script-breaking characters in JSON-LD payloads", () => {
    const html = renderToStaticMarkup(
      <StructuredData data={{ reviewBody: '</script><script>alert("xss")</script>' }} />,
    );

    expect(html).toContain("\\u003c/script\\u003e\\u003cscript\\u003ealert(\\\"xss\\\")\\u003c/script\\u003e");
    expect(html).not.toContain("</script><script>");
  });
});

describe("MultiSchemaStructuredData", () => {
  it("escapes every rendered schema payload", () => {
    const html = renderToStaticMarkup(
      <MultiSchemaStructuredData
        schemas={[
          { name: "safe" },
          { reviewBody: '</script><script>console.log("owned")</script>' },
        ]}
      />,
    );

    expect(html).toContain("\\u003c/script\\u003e\\u003cscript\\u003econsole.log(\\\"owned\\\")\\u003c/script\\u003e");
    expect(html).not.toContain("</script><script>");
  });
});
