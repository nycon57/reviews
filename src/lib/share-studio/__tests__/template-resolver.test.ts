import { describe, expect, it } from "vitest";
import {
  resolveBrandTokens,
  resolveTemplateDsl,
} from "@/lib/share-studio/template-resolver";
import type { ShareStudioTemplateDsl } from "@/lib/share-studio/template-types";

describe("resolveBrandTokens", () => {
  it("uses organization settings with fallback defaults", () => {
    const tokens = resolveBrandTokens({
      primary_color: "#123456",
      logo_url: "https://example.com/logo.png",
      settings: {
        secondary_color: "#abcdef",
        font_family: "DM Sans",
      },
    });

    expect(tokens.primaryColor).toBe("#123456");
    expect(tokens.secondaryColor).toBe("#abcdef");
    expect(tokens.fontFamily).toBe("DM Sans");
    expect(tokens.logoUrl).toBe("https://example.com/logo.png");
    expect(tokens.textColor).toBeTruthy();
  });
});

describe("resolveTemplateDsl", () => {
  it("binds proof item fields and brand token placeholders", () => {
    const dsl: ShareStudioTemplateDsl = {
      version: 1,
      canvas: { width: 1200, height: 630 },
      background: {
        type: "gradient",
        gradientColors: ["{brand.primaryColor}", "{brand.secondaryColor}"],
      },
      layers: [
        {
          id: "quote",
          type: "text",
          x: 0.1,
          y: 0.1,
          width: 0.8,
          height: 0.3,
          rotation: 0,
          zIndex: 2,
          opacity: 1,
          locked: false,
          visible: true,
          color: "{brand.textColor}",
          fontFamily: "{brand.fontFamily}",
          binding: {
            path: "quote",
          },
        },
        {
          id: "bg-shape",
          type: "shape",
          x: 0,
          y: 0,
          width: 1,
          height: 1,
          rotation: 0,
          zIndex: 1,
          opacity: 1,
          locked: false,
          visible: true,
          backgroundColor: "{brand.primaryColor}",
        },
      ],
    };

    const resolved = resolveTemplateDsl(
      dsl,
      { quote: "The process was smooth and fast." },
      {
        primaryColor: "#111111",
        secondaryColor: "#222222",
        textColor: "#fafafa",
        accentColor: "#10B981",
        fontFamily: "Manrope",
        logoUrl: null,
      }
    );

    const textLayer = resolved.layers.find((layer) => layer.id === "quote");
    const shapeLayer = resolved.layers.find((layer) => layer.id === "bg-shape");

    expect(textLayer?.type).toBe("text");
    expect((textLayer as { text?: string }).text).toBe("The process was smooth and fast.");
    expect((textLayer as { color?: string }).color).toBe("#fafafa");
    expect((textLayer as { fontFamily?: string }).fontFamily).toBe("Manrope");

    expect(shapeLayer?.type).toBe("shape");
    expect((shapeLayer as { backgroundColor?: string }).backgroundColor).toBe("#111111");

    expect(resolved.background?.gradientColors?.[0]).toBe("#111111");
    expect(resolved.background?.gradientColors?.[1]).toBe("#222222");
  });
});
