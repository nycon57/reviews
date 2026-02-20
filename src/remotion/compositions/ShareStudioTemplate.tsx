import { AbsoluteFill, Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface ShareStudioTemplateProps {
  title: string;
  quote: string;
  customerName?: string | null;
  rating?: number | null;
  organizationName: string;
  organizationLogoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
  animate?: boolean;
}

function buildStars(rating?: number | null): string {
  const rounded = Math.max(1, Math.min(5, Math.round(rating ?? 5)));
  return "*".repeat(rounded);
}

export const ShareStudioTemplate: React.FC<ShareStudioTemplateProps> = ({
  title,
  quote,
  customerName,
  rating,
  organizationName,
  organizationLogoUrl,
  primaryColor,
  secondaryColor,
  fontFamily,
  animate = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const introProgress = animate
    ? spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 180 },
      })
    : 1;

  const quoteOpacity = animate
    ? interpolate(frame, [0, 24], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  const quoteY = animate ? interpolate(frame, [0, 24], [24, 0]) : 0;

  return (
    <AbsoluteFill
      style={{
        fontFamily: fontFamily || "Inter",
        background: `linear-gradient(140deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
        color: "#ffffff",
      }}
    >
      <AbsoluteFill
        style={{
          padding: 64,
          transform: `scale(${introProgress})`,
          transformOrigin: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 40,
          }}
        >
          <div
            style={{
              fontSize: 34,
              fontWeight: 700,
              maxWidth: "76%",
              lineHeight: 1.15,
            }}
          >
            {title}
          </div>

          {organizationLogoUrl ? (
            <Img
              src={organizationLogoUrl}
              style={{
                width: 108,
                height: 108,
                objectFit: "contain",
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.18)",
                padding: 10,
              }}
            />
          ) : (
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              {organizationName.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.14)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 28,
            padding: "40px 46px",
            backdropFilter: "blur(4px)",
            opacity: quoteOpacity,
            transform: `translateY(${quoteY}px)`,
          }}
        >
          <div
            style={{
              fontSize: 52,
              lineHeight: 1,
              marginBottom: 18,
              opacity: 0.7,
            }}
          >
            "
          </div>

          <div
            style={{
              fontSize: 42,
              lineHeight: 1.28,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
            }}
          >
            {quote}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 28,
              gap: 24,
            }}
          >
            <div style={{ fontSize: 30, fontWeight: 600 }}>
              {customerName || "Verified Customer"}
            </div>

            <div
              style={{
                fontSize: 30,
                letterSpacing: 3,
                fontWeight: 700,
                color: "#FDE68A",
              }}
            >
              {buildStars(rating)}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
