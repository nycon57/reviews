/**
 * StarRating Component
 *
 * Animated star rating display with sequential fill animation.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { REPWELL_COLORS } from "../types";

interface StarRatingProps {
  /** Rating value (1-5) */
  rating: number;
  /** Frame to start the animation */
  startFrame: number;
  /** Size of each star in pixels */
  size?: number;
  /** Filled star color */
  filledColor?: string;
  /** Empty star color */
  emptyColor?: string;
  /** Gap between stars in pixels */
  gap?: number;
  /** Animation style */
  animationStyle?: "sequential" | "simultaneous" | "pop";
  /** Delay between each star in frames (for sequential) */
  staggerDelay?: number;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  startFrame,
  size = 48,
  filledColor = "#FFD700",
  emptyColor = REPWELL_COLORS.sage[100],
  gap = 8,
  animationStyle = "sequential",
  staggerDelay = 6, // 0.2 seconds at 30fps
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stars = [1, 2, 3, 4, 5];

  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: `${gap}px`,
  };

  return (
    <div style={containerStyles}>
      {stars.map((starIndex) => (
        <AnimatedStar
          key={starIndex}
          index={starIndex}
          isFilled={starIndex <= rating}
          currentFrame={frame}
          startFrame={startFrame}
          fps={fps}
          size={size}
          filledColor={filledColor}
          emptyColor={emptyColor}
          animationStyle={animationStyle}
          staggerDelay={staggerDelay}
        />
      ))}
    </div>
  );
};

interface AnimatedStarProps {
  index: number;
  isFilled: boolean;
  currentFrame: number;
  startFrame: number;
  fps: number;
  size: number;
  filledColor: string;
  emptyColor: string;
  animationStyle: "sequential" | "simultaneous" | "pop";
  staggerDelay: number;
}

const AnimatedStar: React.FC<AnimatedStarProps> = ({
  index,
  isFilled,
  currentFrame,
  startFrame,
  fps,
  size,
  filledColor,
  emptyColor,
  animationStyle,
  staggerDelay,
}) => {
  // Calculate this star's animation start frame
  const starStartFrame =
    animationStyle === "simultaneous" ? startFrame : startFrame + (index - 1) * staggerDelay;

  // Calculate animation progress
  const progress = spring({
    frame: currentFrame - starStartFrame,
    fps,
    config: {
      stiffness: animationStyle === "pop" ? 500 : 300,
      damping: animationStyle === "pop" ? 15 : 25,
    },
    durationInFrames: fps * 0.4,
  });

  // Scale animation for pop effect
  const scale =
    animationStyle === "pop"
      ? interpolate(progress, [0, 0.5, 1], [0, 1.3, 1])
      : interpolate(progress, [0, 1], [0.5, 1]);

  // Opacity
  const opacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateRight: "clamp" });

  // Rotation for pop effect
  const rotation = animationStyle === "pop" ? interpolate(progress, [0, 1], [-30, 0]) : 0;

  // Fill progress (for color transition)
  const fillProgress = isFilled ? progress : 0;

  const starStyles: React.CSSProperties = {
    width: size,
    height: size,
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    opacity,
    filter: isFilled ? `drop-shadow(0 2px 4px ${filledColor}40)` : "none",
  };

  return (
    <div style={starStyles}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id={`starGradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={filledColor} />
            <stop offset="100%" stopColor={darkenColor(filledColor, 15)} />
          </linearGradient>
        </defs>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={isFilled ? `url(#starGradient-${index})` : emptyColor}
          stroke={isFilled ? filledColor : emptyColor}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: "fill 0.2s ease-out",
          }}
        />
      </svg>
    </div>
  );
};

/**
 * Darken a color by percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

/**
 * Compact star rating for smaller displays
 */
interface CompactStarRatingProps {
  rating: number;
  startFrame: number;
  size?: number;
  color?: string;
}

export const CompactStarRating: React.FC<CompactStarRatingProps> = ({
  rating,
  startFrame,
  size = 24,
  color = "#FFD700",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame - startFrame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  const containerStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    opacity,
  };

  const numberStyles: React.CSSProperties = {
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${size * 0.8}px`,
    fontWeight: 700,
    color: REPWELL_COLORS.teal[500],
  };

  return (
    <div style={containerStyles}>
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <path
          d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
          fill={color}
        />
      </svg>
      <span style={numberStyles}>{rating.toFixed(1)}</span>
    </div>
  );
};

export default StarRating;
