/**
 * BrandedIntro Component
 *
 * Animated intro sequence featuring organization branding,
 * loan officer info, and customer context.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring, Img } from "remotion";
import type { OrganizationBranding, VideoFormat } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";

interface BrandedIntroProps {
  /** Organization branding info */
  organization: OrganizationBranding;
  /** Loan officer name */
  loanOfficerName: string;
  /** Loan officer title */
  loanOfficerTitle?: string | null;
  /** Loan officer photo URL */
  loanOfficerPhotoUrl?: string | null;
  /** Customer name for context */
  customerName?: string;
  /** Output format */
  format: VideoFormat;
  /** Duration of intro in frames */
  durationFrames: number;
}

export const BrandedIntro: React.FC<BrandedIntroProps> = ({
  organization,
  loanOfficerName,
  loanOfficerTitle,
  loanOfficerPhotoUrl,
  customerName,
  format,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation timings
  const logoStartFrame = fps * 0.2;
  const titleStartFrame = fps * 0.5;
  const loStartFrame = fps * 1;
  const customerStartFrame = fps * 1.5;
  const fadeOutStartFrame = durationFrames - fps * 0.5;

  // Background gradient
  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  // Overall fade out
  const fadeOut = interpolate(
    frame,
    [fadeOutStartFrame, durationFrames],
    [1, 0],
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
    opacity: fadeOut,
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
          right: "-10%",
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
          left: "-20%",
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
          gap: isVertical ? "48px" : "36px",
          zIndex: 1,
        }}
      >
        {/* Organization Logo */}
        <AnimatedLogo
          logoUrl={organization.logoUrl}
          orgName={organization.name}
          startFrame={logoStartFrame}
          frame={frame}
          fps={fps}
          size={isVertical ? 120 : 100}
        />

        {/* "Customer Testimonial" Title */}
        <AnimatedTitle
          startFrame={titleStartFrame}
          frame={frame}
          fps={fps}
          fontSize={isVertical ? 24 : 20}
        />

        {/* Loan Officer Info */}
        <AnimatedLoanOfficer
          name={loanOfficerName}
          title={loanOfficerTitle}
          photoUrl={loanOfficerPhotoUrl}
          startFrame={loStartFrame}
          frame={frame}
          fps={fps}
          isVertical={isVertical}
        />

        {/* Customer Name */}
        {customerName && (
          <AnimatedCustomer
            name={customerName}
            startFrame={customerStartFrame}
            frame={frame}
            fps={fps}
            fontSize={isVertical ? 20 : 18}
          />
        )}
      </div>
    </div>
  );
};

/**
 * Animated logo component
 */
const AnimatedLogo: React.FC<{
  logoUrl: string | null;
  orgName: string;
  startFrame: number;
  frame: number;
  fps: number;
  size: number;
}> = ({ logoUrl, orgName, startFrame, frame, fps, size }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.6,
  });

  const scale = interpolate(progress, [0, 1], [0.5, 1]);
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

  // Fallback: Organization name as text
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
 * Animated title component
 */
const AnimatedTitle: React.FC<{
  startFrame: number;
  frame: number;
  fps: number;
  fontSize: number;
}> = ({ startFrame, frame, fps, fontSize }) => {
  const progress = spring({
    frame: frame - startFrame,
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
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize,
        fontWeight: 500,
        color: withOpacity(REPWELL_COLORS.white, 0.9),
        textTransform: "uppercase",
        letterSpacing: "0.2em",
      }}
    >
      Customer Testimonial
    </div>
  );
};

/**
 * Animated loan officer component
 */
const AnimatedLoanOfficer: React.FC<{
  name: string;
  title?: string | null;
  photoUrl?: string | null;
  startFrame: number;
  frame: number;
  fps: number;
  isVertical: boolean;
}> = ({ name, title, photoUrl, startFrame, frame, fps, isVertical }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.6,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const scale = interpolate(progress, [0, 1], [0.9, 1]);

  const containerStyles: React.CSSProperties = {
    opacity,
    transform: `scale(${scale})`,
    display: "flex",
    flexDirection: isVertical ? "column" : "row",
    alignItems: "center",
    gap: isVertical ? "16px" : "20px",
    background: withOpacity(REPWELL_COLORS.white, 0.15),
    padding: isVertical ? "24px 32px" : "16px 28px",
    borderRadius: "16px",
    backdropFilter: "blur(8px)",
  };

  const photoSize = isVertical ? 80 : 64;

  return (
    <div style={containerStyles}>
      {/* Photo */}
      {photoUrl ? (
        <Img
          src={photoUrl}
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: "50%",
            objectFit: "cover",
            border: `3px solid ${withOpacity(REPWELL_COLORS.white, 0.5)}`,
          }}
        />
      ) : (
        <div
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: "50%",
            background: withOpacity(REPWELL_COLORS.white, 0.2),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `3px solid ${withOpacity(REPWELL_COLORS.white, 0.5)}`,
          }}
        >
          <UserIcon size={photoSize * 0.5} />
        </div>
      )}

      {/* Text */}
      <div
        style={{
          textAlign: isVertical ? "center" : "left",
        }}
      >
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: isVertical ? 24 : 22,
            fontWeight: 600,
            color: REPWELL_COLORS.white,
          }}
        >
          {name}
        </div>
        {title && (
          <div
            style={{
              fontFamily: "'Source Sans 3', system-ui, sans-serif",
              fontSize: isVertical ? 16 : 14,
              fontWeight: 400,
              color: withOpacity(REPWELL_COLORS.white, 0.8),
              marginTop: "4px",
            }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Animated customer indicator
 */
const AnimatedCustomer: React.FC<{
  name: string;
  startFrame: number;
  frame: number;
  fps: number;
  fontSize: number;
}> = ({ name, startFrame, frame, fps, fontSize }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [15, 0]);

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize,
          fontWeight: 400,
          color: withOpacity(REPWELL_COLORS.white, 0.8),
        }}
      >
        Featuring
      </div>
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize,
          fontWeight: 600,
          color: REPWELL_COLORS.white,
        }}
      >
        {name}
      </div>
    </div>
  );
};

/**
 * Simple user icon
 */
const UserIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="7"
      r="4"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default BrandedIntro;
