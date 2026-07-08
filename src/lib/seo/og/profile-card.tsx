import { ImageResponse } from "next/og";
import { getInitials } from "@/lib/utils";
import { loadOgFonts } from "./fonts";

export const PROFILE_OG_SIZE = {
  width: 1200,
  height: 630,
};

export type ProfileOgVariant = "professional" | "organization" | "branch" | "generic";

export interface ProfileOpenGraphCardData {
  variant: ProfileOgVariant;
  name: string;
  affiliation?: string | null;
  descriptor?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  imageUrl?: string | null;
  imageAlt?: string;
  monogramSource?: string | null;
}

const BRAND = {
  deepTeal: "#2f3e46",
  teal: "#354f52",
  midTeal: "#52796f",
  sage: "#84a98c",
  paleSage: "#cad2c5",
  cream: "#f8faf8",
  inkOnDark: "#f8faf8",
};

async function resolveImageSource(imageUrl?: string | null): Promise<string | null> {
  if (!imageUrl) return null;

  try {
    const res = await fetch(imageUrl);
    if (!res.ok) {
      console.error(`Failed to load profile OG image asset: HTTP ${res.status}`);
      return null;
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString("base64")}`;
  } catch (err) {
    console.error("Failed to load profile OG image asset:", err);
    return null;
  }
}

function formatReviewCount(count?: number | null): string {
  const safeCount = count || 0;
  if (safeCount === 1) return "1 review";
  return `${safeCount.toLocaleString("en-US")} reviews`;
}

function formatRating(rating?: number | null): string {
  if (!rating || rating <= 0) return "Verified reviews";
  return `${Number(rating).toFixed(1)} average rating`;
}

function variantLabel(variant: ProfileOgVariant): string {
  switch (variant) {
    case "professional":
      return "Professional profile";
    case "organization":
      return "Organization profile";
    case "branch":
      return "Branch profile";
    default:
      return "Review management";
  }
}

function renderStars(rating?: number | null) {
  const filledStars = rating && rating > 0 ? Math.max(0, Math.min(5, Math.round(rating))) : 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <svg
          key={index}
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill={index < filledStars ? BRAND.paleSage : "rgba(202, 210, 197, 0.28)"}
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 2.6L14.9 8.5L21.4 9.4L16.7 14L17.8 20.5L12 17.4L6.2 20.5L7.3 14L2.6 9.4L9.1 8.5L12 2.6Z" />
        </svg>
      ))}
    </div>
  );
}

export async function buildProfileOpenGraphImage(input: ProfileOpenGraphCardData) {
  const imageSource = await resolveImageSource(input.imageUrl);
  const initials = getInitials(input.monogramSource || input.name) || "RW";
  const descriptor = input.descriptor || variantLabel(input.variant);
  const affiliation = input.affiliation || "Verified customer reviews";
  const fonts = await loadOgFonts({ includeErstoria: true, excludeWoff2: true });
  const hasInter = fonts.some((font) => font.name === "Inter");
  const hasErstoria = fonts.some((font) => font.name === "Erstoria");
  const bodyFontFamily = hasInter ? "Inter" : "Arial";
  const displayFontFamily = hasErstoria ? "Erstoria" : "Georgia";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${BRAND.deepTeal} 0%, ${BRAND.teal} 54%, ${BRAND.midTeal} 100%)`,
          color: BRAND.inkOnDark,
          fontFamily: bodyFontFamily,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 520,
            height: 760,
            right: -130,
            top: -70,
            background: "rgba(202, 210, 197, 0.14)",
            transform: "rotate(14deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 760,
            right: 132,
            top: -62,
            background: "rgba(132, 169, 140, 0.16)",
            transform: "rotate(14deg)",
          }}
        />

        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            padding: "54px 60px 50px 62px",
            boxSizing: "border-box",
            position: "relative",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              paddingRight: 42,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  lineHeight: 1,
                  fontWeight: 700,
                  letterSpacing: 0,
                }}
              >
                <span style={{ color: BRAND.cream }}>Rep</span>
                <span style={{ color: BRAND.paleSage }}>Well</span>
              </div>
              <div
                style={{
                  width: 1,
                  height: 30,
                  background: "rgba(248, 250, 248, 0.34)",
                }}
              />
              <div
                style={{
                  fontSize: 21,
                  color: "rgba(248, 250, 248, 0.78)",
                }}
              >
                {descriptor}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  alignSelf: "flex-start",
                  border: "1px solid rgba(202, 210, 197, 0.45)",
                  borderRadius: 999,
                  padding: "10px 19px",
                  color: BRAND.paleSage,
                  background: "rgba(47, 62, 70, 0.44)",
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                Verified customer feedback
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  maxWidth: 760,
                }}
              >
                <div
                  style={{
                    fontFamily: displayFontFamily,
                    fontSize: input.name.length > 42 ? 66 : 78,
                    lineHeight: 0.98,
                    color: BRAND.cream,
                    letterSpacing: 0,
                  }}
                >
                  {input.name}
                </div>
                <div
                  style={{
                    fontSize: 30,
                    lineHeight: 1.25,
                    color: "rgba(248, 250, 248, 0.82)",
                    maxWidth: 710,
                  }}
                >
                  {affiliation}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              {renderStars(input.rating)}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  color: BRAND.cream,
                }}
              >
                <div style={{ fontSize: 27, fontWeight: 700 }}>{formatRating(input.rating)}</div>
                <div style={{ fontSize: 23, color: "rgba(248, 250, 248, 0.72)" }}>
                  {formatReviewCount(input.reviewCount)}
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              width: 330,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 264,
                height: 264,
                borderRadius: input.variant === "branch" ? 34 : 999,
                border: `8px solid ${BRAND.paleSage}`,
                background: imageSource
                  ? BRAND.cream
                  : `linear-gradient(135deg, ${BRAND.sage}, ${BRAND.paleSage})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {imageSource ? (
                <img
                  src={imageSource}
                  alt={input.imageAlt || input.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: input.variant === "organization" ? "contain" : "cover",
                    padding: input.variant === "organization" ? 24 : 0,
                    boxSizing: "border-box",
                  }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: displayFontFamily,
                    fontSize: 90,
                    lineHeight: 1,
                    color: BRAND.deepTeal,
                  }}
                >
                  {initials}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...PROFILE_OG_SIZE,
      fonts,
    }
  );
}
