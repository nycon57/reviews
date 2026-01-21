/**
 * SocialClip Composition
 *
 * Short-form video clips for social media:
 * - Testimonial quotes (9:16, 1:1)
 * - Review highlights
 * - Stat celebrations
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Img,
  interpolate,
  spring,
} from "remotion";
import type { SocialClipProps } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";
import { QuoteReveal } from "../components/QuoteReveal";
import { StarRating } from "../components/StarRating";
import { CounterAnimation } from "../components/CounterAnimation";

export const SocialClip: React.FC<SocialClipProps> = ({
  type,
  quote,
  author,
  rating,
  organization,
  format,
  statValue,
  statLabel,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background gradient
  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  // Layout
  const isVertical = format === "9:16";
  const isSquare = format === "1:1";

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {/* Background decorations */}
      <BackgroundShapes isVertical={isVertical} />

      {/* Content based on type */}
      {(type === "testimonial_quote" || type === "review_highlight") && (
        <QuoteClipContent
          quote={quote}
          author={author}
          rating={rating}
          organization={organization}
          isVertical={isVertical}
          frame={frame}
          fps={fps}
        />
      )}

      {type === "stat_celebration" && statValue && statLabel && (
        <StatClipContent
          value={statValue}
          label={statLabel}
          organization={organization}
          isVertical={isVertical}
          frame={frame}
          fps={fps}
        />
      )}

      {type === "team_shoutout" && (
        <ShoutoutClipContent
          name={author}
          message={quote}
          isVertical={isVertical}
          frame={frame}
          fps={fps}
        />
      )}

      {/* Powered by badge */}
      <PoweredByBadge frame={frame} fps={fps} />
    </AbsoluteFill>
  );
};

/**
 * Background decorative shapes
 */
const BackgroundShapes: React.FC<{ isVertical: boolean }> = ({ isVertical }) => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: isVertical ? "-10%" : "-15%",
          right: isVertical ? "-20%" : "-10%",
          width: isVertical ? "80%" : "50%",
          height: isVertical ? "40%" : "50%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.05),
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "-15%" : "-20%",
          left: isVertical ? "-25%" : "-15%",
          width: isVertical ? "90%" : "60%",
          height: isVertical ? "45%" : "60%",
          borderRadius: "50%",
          background: withOpacity(REPWELL_COLORS.white, 0.03),
        }}
      />
    </>
  );
};

/**
 * Quote/testimonial clip content
 */
const QuoteClipContent: React.FC<{
  quote: string;
  author: string;
  rating: number;
  organization: { logoUrl: string | null; name: string };
  isVertical: boolean;
  frame: number;
  fps: number;
}> = ({ quote, author, rating, organization, isVertical, frame, fps }) => {
  // Animation timings
  const logoStart = fps * 0.2;
  const quoteStart = fps * 0.5;
  const starsStart = fps * 2;
  const authorStart = fps * 2.8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isVertical ? "100px 32px" : "60px 48px",
        zIndex: 1,
      }}
    >
      {/* Logo */}
      <AnimatedLogo
        logoUrl={organization.logoUrl}
        orgName={organization.name}
        startFrame={logoStart}
        frame={frame}
        fps={fps}
        size={isVertical ? 60 : 48}
      />

      <div style={{ height: isVertical ? 48 : 32 }} />

      {/* Quote */}
      <div style={{ maxWidth: isVertical ? "95%" : "85%", textAlign: "center" }}>
        <QuoteReveal
          text={quote}
          startFrame={quoteStart}
          style="fade-words"
          fontSize={isVertical ? 28 : 32}
          color={REPWELL_COLORS.white}
          showQuoteMarks={true}
          quoteMarkColor={withOpacity(REPWELL_COLORS.white, 0.4)}
          textAlign="center"
          fontFamily="display"
          italic={true}
          lineHeight={1.4}
        />
      </div>

      <div style={{ height: isVertical ? 40 : 28 }} />

      {/* Stars */}
      <StarRating
        rating={rating}
        startFrame={starsStart}
        size={isVertical ? 36 : 32}
        animationStyle="pop"
        staggerDelay={4}
      />

      <div style={{ height: isVertical ? 32 : 24 }} />

      {/* Author */}
      <AnimatedAuthor
        name={author}
        startFrame={authorStart}
        frame={frame}
        fps={fps}
      />
    </div>
  );
};

/**
 * Stat celebration clip content
 */
const StatClipContent: React.FC<{
  value: string;
  label: string;
  organization: { logoUrl: string | null; name: string };
  isVertical: boolean;
  frame: number;
  fps: number;
}> = ({ value, label, organization, isVertical, frame, fps }) => {
  const logoStart = fps * 0.2;
  const valueStart = fps * 0.6;
  const labelStart = fps * 2.2;

  // Parse numeric value
  const numericValue = parseFloat(value.replace(/[^0-9.]/g, ""));
  const prefix = value.match(/^[^0-9]*/)?.[0] || "";
  const suffix = value.match(/[^0-9]*$/)?.[0] || "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isVertical ? "100px 32px" : "60px 48px",
        zIndex: 1,
      }}
    >
      {/* Logo */}
      <AnimatedLogo
        logoUrl={organization.logoUrl}
        orgName={organization.name}
        startFrame={logoStart}
        frame={frame}
        fps={fps}
        size={isVertical ? 60 : 48}
      />

      <div style={{ height: isVertical ? 60 : 40 }} />

      {/* Counter */}
      <CounterAnimation
        value={numericValue}
        startFrame={valueStart}
        durationFrames={fps * 1.5}
        prefix={prefix}
        suffix={suffix}
        fontSize={isVertical ? 100 : 80}
        color={REPWELL_COLORS.white}
        fontFamily="display"
      />

      <div style={{ height: 16 }} />

      {/* Label */}
      <AnimatedLabel
        text={label}
        startFrame={labelStart}
        frame={frame}
        fps={fps}
        fontSize={isVertical ? 24 : 20}
      />
    </div>
  );
};

/**
 * Team shoutout clip content
 */
const ShoutoutClipContent: React.FC<{
  name: string;
  message: string;
  isVertical: boolean;
  frame: number;
  fps: number;
}> = ({ name, message, isVertical, frame, fps }) => {
  const titleStart = fps * 0.2;
  const nameStart = fps * 0.6;
  const messageStart = fps * 1.2;

  const titleProgress = spring({
    frame: frame - titleStart,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: isVertical ? "100px 32px" : "60px 48px",
        zIndex: 1,
      }}
    >
      {/* Title */}
      <div
        style={{
          opacity: interpolate(titleProgress, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(titleProgress, [0, 1], [20, 0])}px)`,
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: withOpacity(REPWELL_COLORS.white, 0.8),
        }}
      >
        🌟 Shoutout To
      </div>

      <div style={{ height: 24 }} />

      {/* Name */}
      <AnimatedLabel
        text={name}
        startFrame={nameStart}
        frame={frame}
        fps={fps}
        fontSize={isVertical ? 40 : 36}
        fontWeight={700}
      />

      <div style={{ height: isVertical ? 40 : 28 }} />

      {/* Message */}
      <div style={{ maxWidth: isVertical ? "90%" : "80%", textAlign: "center" }}>
        <QuoteReveal
          text={message}
          startFrame={messageStart}
          style="slide-up"
          fontSize={isVertical ? 22 : 20}
          color={REPWELL_COLORS.white}
          showQuoteMarks={false}
          textAlign="center"
          fontFamily="sans"
          italic={false}
        />
      </div>
    </div>
  );
};

// Helper components

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
    durationInFrames: fps * 0.4,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  if (logoUrl) {
    return (
      <div style={{ transform: `scale(${scale})`, opacity }}>
        <Img
          src={logoUrl}
          style={{ height: size, width: "auto", objectFit: "contain" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        opacity,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: size * 0.4,
        fontWeight: 600,
        color: REPWELL_COLORS.white,
      }}
    >
      {orgName}
    </div>
  );
};

const AnimatedAuthor: React.FC<{
  name: string;
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ name, startFrame, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  return (
    <div
      style={{
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(progress, [0, 1], [15, 0])}px)`,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: 18,
        fontWeight: 600,
        color: REPWELL_COLORS.white,
      }}
    >
      — {name}
    </div>
  );
};

const AnimatedLabel: React.FC<{
  text: string;
  startFrame: number;
  frame: number;
  fps: number;
  fontSize: number;
  fontWeight?: number;
}> = ({ text, startFrame, frame, fps, fontSize, fontWeight = 500 }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  return (
    <div
      style={{
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize,
        fontWeight,
        color: REPWELL_COLORS.white,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {text}
    </div>
  );
};

const PoweredByBadge: React.FC<{
  frame: number;
  fps: number;
}> = ({ frame, fps }) => {
  const opacity = interpolate(frame, [fps * 3, fps * 3.5], [0, 0.5], {
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
        color: withOpacity(REPWELL_COLORS.white, 0.7),
      }}
    >
      Powered by <span style={{ fontWeight: 600 }}>RepWell</span>
    </div>
  );
};

export default SocialClip;
