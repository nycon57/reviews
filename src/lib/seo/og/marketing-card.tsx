import { readFile } from "fs/promises";
import { join } from "path";
import { ImageResponse } from "next/og";
import { BRAND_DOMAIN } from "@/lib/brand";
import { loadOgFonts } from "./fonts";

export const MARKETING_OG_SIZE = {
  width: 1200,
  height: 630,
};

export interface MarketingOpenGraphCardData {
  title: string;
  eyebrow?: string;
  description?: string;
}

const BRAND = {
  deepTeal: "#2f3e46",
  teal: "#354f52",
  midTeal: "#52796f",
  sage: "#84a98c",
  paleSage: "#cad2c5",
  cream: "#f8faf8",
  white: "#ffffff",
};

let logoPromise: Promise<string | null> | null = null;

function fitTitleSize(title: string): number {
  if (title.length > 76) return 58;
  if (title.length > 54) return 66;
  return 76;
}

async function loadBrandLogo(): Promise<string | null> {
  if (logoPromise) return logoPromise;

  logoPromise = readFile(join(process.cwd(), "public/branding/RepWell-Logo-Full-Color.png"))
    .then((data) => `data:image/png;base64,${data.toString("base64")}`)
    .catch((err): null => {
      console.error("Failed to load RepWell logo for OG image:", err);
      return null;
    });

  return logoPromise;
}

export async function buildMarketingOpenGraphImage({
  title,
  eyebrow = "RepWell",
  description = "Review management for client-facing teams.",
}: MarketingOpenGraphCardData) {
  const [fonts, logo] = await Promise.all([
    loadOgFonts({ includeErstoria: true }),
    loadBrandLogo(),
  ]);
  const hasInter = fonts.some((font) => font.name === "Inter");
  const hasErstoria = fonts.some((font) => font.name === "Erstoria");
  const bodyFontFamily = hasInter ? "Inter" : "Arial";
  const displayFontFamily = hasErstoria ? "Erstoria" : "Georgia";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${BRAND.cream} 0%, ${BRAND.white} 42%, ${BRAND.paleSage} 100%)`,
        color: BRAND.deepTeal,
        fontFamily: bodyFontFamily,
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 410,
          height: 790,
          right: -78,
          top: -72,
          background: "rgba(82, 121, 111, 0.18)",
          transform: "rotate(16deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 270,
          height: 760,
          right: 236,
          top: -68,
          background: "rgba(132, 169, 140, 0.18)",
          transform: "rotate(16deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 190,
          height: 760,
          right: 454,
          top: -66,
          background: "rgba(202, 210, 197, 0.42)",
          transform: "rotate(16deg)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "58px 68px 56px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {logo ? (
            <img
              src={logo}
              alt="RepWell"
              style={{
                width: 190,
                height: 44,
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: 34,
                lineHeight: 1,
                fontWeight: 700,
              }}
            >
              <span style={{ color: BRAND.deepTeal }}>Rep</span>
              <span style={{ color: BRAND.sage }}>Well</span>
            </div>
          )}
          <div
            style={{
              height: 36,
              width: 1,
              background: "rgba(47, 62, 70, 0.18)",
            }}
          />
          <div
            style={{
              display: "flex",
              border: `1px solid ${BRAND.paleSage}`,
              borderRadius: 999,
              padding: "9px 17px",
              color: BRAND.teal,
              background: "rgba(255, 255, 255, 0.62)",
              fontSize: 21,
              fontWeight: 700,
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            maxWidth: 825,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              color: BRAND.midTeal,
              fontSize: 24,
              fontWeight: 700,
            }}
          >
            Customer feedback, reviews, and reputation workflows
          </div>
          <div
            style={{
              fontFamily: displayFontFamily,
              color: BRAND.deepTeal,
              fontSize: fitTitleSize(title),
              lineHeight: 0.98,
              maxWidth: 790,
            }}
          >
            {title}
          </div>
          <div
            style={{
              color: "rgba(47, 62, 70, 0.78)",
              fontSize: 31,
              lineHeight: 1.28,
              maxWidth: 780,
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: BRAND.teal,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 56,
              height: 8,
              background: BRAND.sage,
            }}
          />
          {BRAND_DOMAIN}
        </div>
      </div>
    </div>,
    {
      ...MARKETING_OG_SIZE,
      fonts,
    }
  );
}
