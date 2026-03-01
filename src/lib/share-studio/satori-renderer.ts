import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { ShareStudioRenderInput, ShareStudioVideoFormat } from "./remotion-renderer";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SatoriStillOptions {
  input: ShareStudioRenderInput;
  format: "og" | ShareStudioVideoFormat;
  template: "modern" | "minimal" | "bold";
}

export interface SatoriStillResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// RepWell design tokens (mirrored from remotion/types.ts)
// ---------------------------------------------------------------------------

const COLORS = {
  sage: { 100: "#cad2c5", 200: "#84a98c" },
  teal: { 300: "#52796f", 400: "#354f52", 500: "#2f3e46" },
  white: "#ffffff",
} as const;

// ---------------------------------------------------------------------------
// Color utilities (mirrors remotion/utils/colors.ts)
// ---------------------------------------------------------------------------

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function withOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  return rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : hex;
}

function lightenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = percent / 100;
  const r = Math.round(rgb.r + (255 - rgb.r) * f);
  const g = Math.round(rgb.g + (255 - rgb.g) * f);
  const b = Math.round(rgb.b + (255 - rgb.b) * f);
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

function getDimensions(format: "og" | ShareStudioVideoFormat): { width: number; height: number } {
  switch (format) {
    case "og":
      return { width: 1200, height: 630 };
    case "16:9":
      return { width: 1920, height: 1080 };
    case "1:1":
      return { width: 1080, height: 1080 };
    case "9:16":
      return { width: 1080, height: 1920 };
  }
}

// ---------------------------------------------------------------------------
// Template styles (mirrors TextTestimonial.tsx getTemplateStyles)
// ---------------------------------------------------------------------------

function getTemplateStyles(
  template: "modern" | "minimal" | "bold",
  primaryColor: string,
  secondaryColor: string,
) {
  switch (template) {
    case "minimal":
      return {
        background: COLORS.white,
        textColor: COLORS.teal[500],
      };
    case "bold":
      return {
        background: `linear-gradient(135deg, ${primaryColor || COLORS.teal[400]}, ${secondaryColor || COLORS.sage[200]})`,
        textColor: COLORS.white,
      };
    case "modern":
    default:
      return {
        background: `linear-gradient(180deg, ${lightenColor(COLORS.sage[100], 30)} 0%, ${COLORS.white} 100%)`,
        textColor: COLORS.teal[500],
      };
  }
}

// ---------------------------------------------------------------------------
// Font loading (cached)
// ---------------------------------------------------------------------------

let fontCache: Array<{ name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }> | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;

  // Satori requires TTF/OTF/WOFF — does NOT support WOFF2
  const fontUrls = [
    { url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf", weight: 400 as const },
    { url: "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf", weight: 700 as const },
  ];

  const results = await Promise.all(
    fontUrls.map(async ({ url, weight }) => {
      try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.arrayBuffer();
        return { name: "Inter", data, weight, style: "normal" as const };
      } catch {
        return null;
      }
    }),
  );

  const fonts = results.filter((f): f is NonNullable<typeof f> => f !== null);
  fontCache = fonts;
  return fonts;
}

// ---------------------------------------------------------------------------
// Build JSX for Satori
//
// IMPORTANT: Satori's flexbox is NOT browser flexbox. Key differences:
//   - `flex: 1` on text nodes collapses to min-content (one word per line)
//   - `alignItems: "center"` shrinks children to min-content width
//   - Text MUST be inside a div with explicit `width` to wrap properly
//   - Use `justifyContent: "space-between"` on full-width containers
//
// This layout follows the proven pattern from opengraph-image.tsx.
// ---------------------------------------------------------------------------

function buildStillJsx(
  input: ShareStudioRenderInput,
  template: "modern" | "minimal" | "bold",
  dims: { width: number; height: number },
) {
  const styles = getTemplateStyles(template, input.primaryColor, input.secondaryColor);
  const isVertical = dims.height > dims.width;
  const isLandscape = dims.width > dims.height;
  const padding = isVertical ? 60 : isLandscape ? 56 : 56;
  const quoteFontSize = isVertical ? 32 : isLandscape ? 30 : 34;
  const starSize = isVertical ? 36 : 32;
  const authorFontSize = isVertical ? 22 : 20;
  const orgFontSize = isVertical ? 20 : isLandscape ? 20 : 18;

  const quote = input.quote || input.title || "Customer feedback shared via Share Studio";
  const author = input.customerName || "Verified Customer";
  const rating = Math.max(1, Math.min(5, Math.round(input.rating ?? 5)));
  const orgName = input.organizationName || "Organization";
  const filled = Math.max(0, Math.min(5, rating));

  // Stars as a single string (Satori handles unicode fine in a single text node)
  const filledStars = "\u2605".repeat(filled);
  const emptyStars = "\u2605".repeat(5 - filled);

  // Full-width column layout with space-between (proven Satori pattern)
  return {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column" as const,
        justifyContent: "space-between",
        background: styles.background,
        padding,
        fontFamily: "Inter",
        color: styles.textColor,
      },
      children: [
        // Top: organization name badge
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "flex-start",
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontSize: orgFontSize,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                },
                children: orgName,
              },
            },
          },
        },

        // Middle: quote block (takes up available space)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              flex: 1,
              paddingLeft: isVertical ? 20 : 40,
              paddingRight: isVertical ? 20 : 40,
            },
            children: [
              // Quote text with decorative marks — single child (concatenated string)
              // Satori requires display:flex on any element with multiple children,
              // so we bake the marks into a single text node to keep natural wrapping.
              {
                type: "div",
                props: {
                  style: {
                    width: "100%",
                    textAlign: "center" as const,
                    fontSize: quoteFontSize,
                    fontWeight: 400,
                    fontStyle: "italic" as const,
                    lineHeight: 1.5,
                  },
                  children: `\u201C${quote}\u201D`,
                },
              },
            ],
          },
        },

        // Bottom: stars + author + powered by
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 12,
            },
            children: [
              // Stars
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: starSize,
                    letterSpacing: 4,
                    lineHeight: 1,
                  },
                  children: [
                    {
                      type: "span",
                      props: { style: { color: "#FBBF24" }, children: filledStars },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: withOpacity(styles.textColor, 0.2) },
                        children: emptyStars,
                      },
                    },
                  ],
                },
              },
              // Author
              {
                type: "div",
                props: {
                  style: { fontSize: authorFontSize, fontWeight: 600 },
                  children: author,
                },
              },
              // Powered by
              {
                type: "div",
                props: {
                  style: {
                    fontSize: 12,
                    opacity: 0.4,
                    marginTop: 8,
                    display: "flex",
                    gap: 4,
                  },
                  children: [
                    { type: "span", props: { children: "Powered by" } },
                    { type: "span", props: { style: { fontWeight: 600 }, children: "RepWell" } },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function renderStillWithSatori(options: SatoriStillOptions): Promise<SatoriStillResult> {
  const dims = getDimensions(options.format);
  const fonts = await loadFonts();
  const jsx = buildStillJsx(options.input, options.template, dims);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svg = await satori(jsx as any, {
    width: dims.width,
    height: dims.height,
    fonts: fonts.map((f) => ({
      name: f.name,
      data: f.data,
      weight: f.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
      style: f.style,
    })),
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: dims.width },
  });
  const pngData = resvg.render();
  const buffer = Buffer.from(pngData.asPng());

  return { buffer, width: dims.width, height: dims.height };
}
