/**
 * TextTestimonial Composition
 *
 * Animated text-based testimonial video with:
 * - Typewriter quote reveal
 * - Star rating animation
 * - Author attribution
 * - Organization branding
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Img,
  interpolate,
  spring,
} from "remotion";
import type { TextTestimonialProps } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient, lightenColor } from "../utils/colors";
import { QuoteReveal } from "../components/QuoteReveal";
import { StarRating } from "../components/StarRating";

export const TextTestimonial: React.FC<TextTestimonialProps> = ({
  text,
  author,
  rating,
  organization,
  template,
  format,
  authorSubtitle,
  authorPhotoUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Animation timings
  const logoStartFrame = fps * 0.3;
  const quoteStartFrame = fps * 1;
  const starsStartFrame = fps * 2.5;
  const authorStartFrame = fps * 3.5;

  // Layout based on format
  const isVertical = format === "9:16";
  const isSquare = format === "1:1";

  // Get template-specific styles
  const templateStyles = getTemplateStyles(template, organization);

  return (
    <AbsoluteFill style={templateStyles.container}>
      {/* Background decorations */}
      <BackgroundDecorations template={template} organization={organization} />

      {/* Content container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          padding: isVertical ? "80px 40px" : "60px 80px",
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
          size={isVertical ? 80 : 60}
          template={template}
        />

        {/* Spacer */}
        <div style={{ height: isVertical ? 48 : 40 }} />

        {/* Quote Text */}
        <div style={{ maxWidth: isVertical ? "95%" : "80%", textAlign: "center" }}>
          <QuoteReveal
            text={text}
            startFrame={quoteStartFrame}
            style={template === "bold" ? "fade-words" : "typewriter"}
            fontSize={isVertical ? 28 : 36}
            color={templateStyles.textColor}
            showQuoteMarks={true}
            quoteMarkColor={
              template === "minimal"
                ? withOpacity(templateStyles.textColor, 0.3)
                : organization.secondaryColor || REPWELL_COLORS.sage[200]
            }
            textAlign="center"
            fontFamily="display"
            fontWeight={400}
            italic={true}
            lineHeight={1.5}
          />
        </div>

        {/* Spacer */}
        <div style={{ height: isVertical ? 40 : 32 }} />

        {/* Star Rating */}
        <StarRating
          rating={rating}
          startFrame={starsStartFrame}
          size={isVertical ? 40 : 36}
          animationStyle={template === "bold" ? "pop" : "sequential"}
          staggerDelay={8}
        />

        {/* Spacer */}
        <div style={{ height: isVertical ? 32 : 28 }} />

        {/* Author Attribution */}
        <AuthorAttribution
          name={author}
          subtitle={authorSubtitle}
          photoUrl={authorPhotoUrl}
          startFrame={authorStartFrame}
          frame={frame}
          fps={fps}
          textColor={templateStyles.textColor}
          isVertical={isVertical}
        />
      </div>

      {/* Powered by badge */}
      <PoweredByBadge
        frame={frame}
        fps={fps}
        startFrame={authorStartFrame + fps * 0.5}
        textColor={templateStyles.textColor}
      />
    </AbsoluteFill>
  );
};

/**
 * Get template-specific styles
 */
function getTemplateStyles(
  template: "modern" | "minimal" | "bold",
  organization: { primaryColor: string; secondaryColor: string }
) {
  switch (template) {
    case "minimal":
      return {
        container: {
          backgroundColor: REPWELL_COLORS.white,
        } as React.CSSProperties,
        textColor: REPWELL_COLORS.teal[500],
      };

    case "bold":
      return {
        container: {
          background: generateGradient(
            organization.primaryColor || REPWELL_COLORS.teal[400],
            organization.secondaryColor || REPWELL_COLORS.sage[200],
            135
          ),
        } as React.CSSProperties,
        textColor: REPWELL_COLORS.white,
      };

    case "modern":
    default:
      return {
        container: {
          background: `linear-gradient(180deg, ${lightenColor(REPWELL_COLORS.sage[100], 30)} 0%, ${REPWELL_COLORS.white} 100%)`,
        } as React.CSSProperties,
        textColor: REPWELL_COLORS.teal[500],
      };
  }
}

/**
 * Background decorations based on template
 */
const BackgroundDecorations: React.FC<{
  template: "modern" | "minimal" | "bold";
  organization: { primaryColor: string; secondaryColor: string };
}> = ({ template, organization }) => {
  if (template === "minimal") {
    return null;
  }

  if (template === "bold") {
    return (
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
  }

  // Modern template
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: withOpacity(organization.primaryColor || REPWELL_COLORS.teal[300], 0.2),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "8%",
          width: 16,
          height: 16,
          borderRadius: 4,
          transform: "rotate(45deg)",
          background: withOpacity(organization.secondaryColor || REPWELL_COLORS.sage[200], 0.3),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "5%",
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: withOpacity(organization.secondaryColor || REPWELL_COLORS.sage[200], 0.2),
        }}
      />
    </>
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
  template: "modern" | "minimal" | "bold";
}> = ({ logoUrl, orgName, startFrame, frame, fps, size, template }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
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

  // Fallback: Organization name
  return (
    <div
      style={{
        ...styles,
        fontFamily: "'Erstoria', Georgia, serif",
        fontSize: size * 0.4,
        fontWeight: 700,
        color: template === "bold" ? REPWELL_COLORS.white : REPWELL_COLORS.teal[500],
      }}
    >
      {orgName}
    </div>
  );
};

/**
 * Author attribution component
 */
const AuthorAttribution: React.FC<{
  name: string;
  subtitle?: string;
  photoUrl?: string | null;
  startFrame: number;
  frame: number;
  fps: number;
  textColor: string;
  isVertical: boolean;
}> = ({ name, subtitle, photoUrl, startFrame, frame, fps, textColor, isVertical }) => {
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      {/* Photo (if provided) */}
      {photoUrl && (
        <Img
          src={photoUrl}
          style={{
            width: isVertical ? 60 : 56,
            height: isVertical ? 60 : 56,
            borderRadius: "50%",
            objectFit: "cover",
            marginBottom: "8px",
          }}
        />
      )}

      {/* Name */}
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: isVertical ? 20 : 18,
          fontWeight: 600,
          color: textColor,
        }}
      >
        {name}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: isVertical ? 14 : 13,
            fontWeight: 400,
            color: withOpacity(textColor, 0.7),
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

/**
 * Powered by badge
 */
const PoweredByBadge: React.FC<{
  frame: number;
  fps: number;
  startFrame: number;
  textColor: string;
}> = ({ frame, fps, startFrame, textColor }) => {
  const opacity = interpolate(frame - startFrame, [0, fps * 0.3], [0, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        opacity,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: 11,
        color: withOpacity(textColor, 0.5),
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      <span>Powered by</span>
      <span style={{ fontWeight: 600 }}>RepWell</span>
    </div>
  );
};

export default TextTestimonial;
