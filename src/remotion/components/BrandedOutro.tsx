/**
 * BrandedOutro Component
 *
 * Animated outro sequence with organization branding and call-to-action.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring, Img } from "remotion";
import type { OrganizationBranding, VideoFormat } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";

interface BrandedOutroProps {
  /** Organization branding info */
  organization: OrganizationBranding;
  /** Call to action text */
  ctaText?: string;
  /** Call to action URL (displayed, not clickable) */
  ctaUrl?: string;
  /** Optional contact info */
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  /** Output format */
  format: VideoFormat;
  /** Start frame of the outro */
  startFrame: number;
  /** Duration of outro in frames */
  durationFrames: number;
}

export const BrandedOutro: React.FC<BrandedOutroProps> = ({
  organization,
  ctaText = "Ready to start your journey?",
  ctaUrl,
  contactInfo,
  format,
  startFrame,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Relative frame within outro
  const relativeFrame = frame - startFrame;

  // Animation timings
  const fadeInStartFrame = 0;
  const fadeInDuration = fps * 0.5;
  const logoStartFrame = fps * 0.3;
  const ctaStartFrame = fps * 0.7;
  const contactStartFrame = fps * 1.2;
  const poweredByStartFrame = fps * 1.5;

  // Background gradient
  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  // Fade in animation
  const fadeIn = interpolate(
    relativeFrame,
    [fadeInStartFrame, fadeInStartFrame + fadeInDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Layout adjustments based on format
  const isVertical = format === "9:16";
  const isSquare = format === "1:1";

  const containerStyles: React.CSSProperties = {
    width: "100%",
    height: "100%",
    background: bgGradient,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: isVertical ? "80px 40px" : "60px",
    opacity: fadeIn,
    position: "relative",
    overflow: "hidden",
  };

  // Decorative background elements
  const decorativeElements = (
    <>
      <div
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.05),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          right: "-20%",
          width: "80%",
          height: "80%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.03),
        }}
      />
    </>
  );

  return (
    <div style={containerStyles}>
      {decorativeElements}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: isVertical ? "40px" : "32px",
          zIndex: 1,
          textAlign: "center",
        }}
      >
        {/* Organization Logo */}
        <AnimatedOutroLogo
          logoUrl={organization.logoUrl}
          orgName={organization.name}
          startFrame={logoStartFrame}
          relativeFrame={relativeFrame}
          fps={fps}
          size={isVertical ? 100 : 80}
        />

        {/* CTA Text */}
        <AnimatedCTA
          text={ctaText}
          url={ctaUrl}
          startFrame={ctaStartFrame}
          relativeFrame={relativeFrame}
          fps={fps}
          isVertical={isVertical}
        />

        {/* Contact Info */}
        {contactInfo && (
          <AnimatedContactInfo
            contactInfo={contactInfo}
            startFrame={contactStartFrame}
            relativeFrame={relativeFrame}
            fps={fps}
            isVertical={isVertical}
          />
        )}

        {/* Powered by RepWell */}
        <PoweredByRepWell
          startFrame={poweredByStartFrame}
          relativeFrame={relativeFrame}
          fps={fps}
        />
      </div>
    </div>
  );
};

/**
 * Animated logo for outro
 */
const AnimatedOutroLogo: React.FC<{
  logoUrl: string | null;
  orgName: string;
  startFrame: number;
  relativeFrame: number;
  fps: number;
  size: number;
}> = ({ logoUrl, orgName, startFrame, relativeFrame, fps, size }) => {
  const progress = spring({
    frame: relativeFrame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.6,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const styles: React.CSSProperties = {
    transform: `scale(${scale})`,
    opacity,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (logoUrl) {
    return (
      <div style={styles}>
        <Img
          src={logoUrl}
          style={{
            height: size,
            width: "auto",
            maxWidth: size * 2.5,
            objectFit: "contain",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...styles,
        fontFamily: "'Erstoria', Georgia, serif",
        fontSize: size * 0.5,
        fontWeight: 700,
        color: REPWELL_COLORS.white,
        textShadow: "0 2px 8px rgba(0,0,0,0.2)",
      }}
    >
      {orgName}
    </div>
  );
};

/**
 * Animated CTA section
 */
const AnimatedCTA: React.FC<{
  text: string;
  url?: string;
  startFrame: number;
  relativeFrame: number;
  fps: number;
  isVertical: boolean;
}> = ({ text, url, startFrame, relativeFrame, fps, isVertical }) => {
  const progress = spring({
    frame: relativeFrame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div
        style={{
          fontFamily: "'Erstoria', Georgia, serif",
          fontSize: isVertical ? 32 : 28,
          fontWeight: 600,
          color: REPWELL_COLORS.white,
          textShadow: "0 2px 8px rgba(0,0,0,0.2)",
          maxWidth: isVertical ? "90%" : "600px",
        }}
      >
        {text}
      </div>

      {url && (
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: isVertical ? 20 : 18,
            fontWeight: 500,
            color: REPWELL_COLORS.white,
            background: withOpacity(REPWELL_COLORS.white, 0.2),
            padding: "12px 24px",
            borderRadius: "8px",
            backdropFilter: "blur(4px)",
          }}
        >
          {url}
        </div>
      )}
    </div>
  );
};

/**
 * Animated contact information
 */
const AnimatedContactInfo: React.FC<{
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
  startFrame: number;
  relativeFrame: number;
  fps: number;
  isVertical: boolean;
}> = ({ contactInfo, startFrame, relativeFrame, fps, isVertical }) => {
  const progress = spring({
    frame: relativeFrame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [15, 0]);

  const items = [
    contactInfo.phone && { icon: "📞", value: contactInfo.phone },
    contactInfo.email && { icon: "✉️", value: contactInfo.email },
    contactInfo.website && { icon: "🌐", value: contactInfo.website },
  ].filter(Boolean) as Array<{ icon: string; value: string }>;

  if (items.length === 0) return null;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        gap: isVertical ? "12px" : "24px",
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: isVertical ? 16 : 14,
            color: withOpacity(REPWELL_COLORS.white, 0.9),
          }}
        >
          <span>{item.icon}</span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Powered by RepWell badge
 */
const PoweredByRepWell: React.FC<{
  startFrame: number;
  relativeFrame: number;
  fps: number;
}> = ({ startFrame, relativeFrame, fps }) => {
  const progress = spring({
    frame: relativeFrame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  const opacity = interpolate(progress, [0, 1], [0, 0.7]);
  const translateY = interpolate(progress, [0, 1], [10, 0]);

  return (
    <div
      style={{
        opacity,
        position: "absolute",
        bottom: "32px",
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: 12,
        color: withOpacity(REPWELL_COLORS.white, 0.6),
      }}
    >
      <span>Powered by</span>
      <span style={{ fontWeight: 600 }}>RepWell</span>
    </div>
  );
};

export default BrandedOutro;
