import { ImageResponse } from "next/og";
import { getProofLinkBySlug } from "@/lib/share-studio/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

async function loadFonts() {
  const fontUrls = [
    { url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2", weight: 400 as const },
    { url: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hiA.woff2", weight: 700 as const },
  ];

  const results = await Promise.all(
    fontUrls.map(async ({ url, weight }) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.error(`Failed to load Inter font (weight ${weight}, url ${url}): HTTP ${res.status}`);
          return null;
        }
        const data = await res.arrayBuffer();
        return { name: "Inter", data, weight, style: "normal" as const };
      } catch (err) {
        console.error(`Failed to load Inter font (weight ${weight}, url ${url}):`, err);
        return null;
      }
    })
  );

  const fonts = results.filter((f): f is NonNullable<typeof f> => f !== null);
  return fonts.length > 0 ? fonts : [];
}

export default async function OpenGraphImage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const data = await getProofLinkBySlug(slug);

  if (!data || !data.link.published) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f172a",
            color: "white",
            fontSize: 44,
            fontWeight: 700,
          }}
        >
          Smart Link
        </div>
      ),
      size
    );
  }

  const item = data.item;
  const organization = data.organization;
  const brand = data.brandTokens;
  const sourceType = (item.source_type as string | null) || "review";

  const quote = (item.quote as string | null) || "Customer feedback shared via Share Studio";
  const customer = (item.customer_name as string | null) || "Verified Customer";
  const orgName = (typeof organization.name === "string" && organization.name.trim()) ? organization.name : "Untitled";

  const rawRating = Math.min(5, Math.round((item.rating as number | null) ?? 5));
  const filledStars = Math.max(0, rawRating);
  const emptyStars = Math.max(0, 5 - filledStars);

  const secondaryColor = brand.secondaryColor || brand.primaryColor || "#0f172a";

  const sourcePlatform = (item.source_platform as string | null) || "";
  const platformLabel = sourcePlatform.toLowerCase() === "google" ? "Google" :
    sourcePlatform.toLowerCase() === "zillow" ? "Zillow" :
    sourcePlatform.toLowerCase() === "facebook" ? "Facebook" :
    sourcePlatform.toLowerCase() === "yelp" ? "Yelp" :
    sourcePlatform ? sourcePlatform.charAt(0).toUpperCase() + sourcePlatform.slice(1) : null;

  if (sourceType === "video_testimonial") {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: `linear-gradient(135deg, ${brand.primaryColor}, ${secondaryColor})`,
            color: "#fff",
            fontFamily: "Inter",
            padding: 56,
            boxSizing: "border-box",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 24,
                fontWeight: 700,
                background: "rgba(0,0,0,0.20)",
                letterSpacing: "-0.01em",
              }}
            >
              {orgName}
            </div>
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.30)",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 22,
                fontWeight: 600,
                background: "rgba(255,255,255,0.12)",
              }}
            >
              Video Testimonial
            </div>
          </div>

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.22)",
              background: "rgba(0,0,0,0.18)",
              borderRadius: 24,
              padding: "40px",
              margin: "28px 0",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 600,
                opacity: 0.95,
              }}
            >
              Watch {customer} share their experience
            </div>
            <div
              style={{
                fontSize: 34,
                lineHeight: 1.3,
                fontWeight: 400,
              }}
            >
              {quote}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 24,
              opacity: 0.95,
            }}
          >
            <span>{customer}</span>
            <span style={{ fontWeight: 700 }}>Play Video</span>
          </div>
        </div>
      ),
      {
        ...size,
        fonts: await loadFonts(),
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: `linear-gradient(135deg, ${brand.primaryColor}, ${secondaryColor})`,
          color: "#fff",
          fontFamily: "Inter",
          padding: 56,
          boxSizing: "border-box",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top row: org name badge + platform badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 999,
              padding: "10px 22px",
              fontSize: 24,
              fontWeight: 700,
              background: "rgba(0,0,0,0.20)",
              letterSpacing: "-0.01em",
            }}
          >
            {orgName}
          </div>
          {platformLabel ? (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.30)",
                borderRadius: 999,
                padding: "10px 22px",
                fontSize: 22,
                fontWeight: 600,
                background: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ opacity: 0.7 }}>&#10003;</span>
              {platformLabel} Verified
            </div>
          ) : null}
        </div>

        {/* Quote block */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.22)",
            background: "rgba(0,0,0,0.18)",
            borderRadius: 24,
            padding: "36px 40px",
            fontSize: 34,
            lineHeight: 1.3,
            fontWeight: 400,
            flex: 1,
            display: "flex",
            alignItems: "center",
            margin: "32px 0",
          }}
        >
          <span style={{ opacity: 0.5, fontSize: 52, lineHeight: 0, marginRight: 10, fontFamily: "serif" }}>&ldquo;</span>
          <span style={{ flex: 1 }}>{quote}</span>
          <span style={{ opacity: 0.5, fontSize: 52, lineHeight: 0, marginLeft: 10, alignSelf: "flex-end", fontFamily: "serif" }}>&rdquo;</span>
        </div>

        {/* Bottom row: customer name + stars */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            opacity: 0.95,
          }}
        >
          <span style={{ fontWeight: 600 }}>{customer}</span>
          <span style={{ letterSpacing: 2, fontSize: 32 }}>
            <span style={{ color: "#FBBF24" }}>{"★".repeat(filledStars)}</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>{"★".repeat(emptyStars)}</span>
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: await loadFonts(),
    }
  );
}
