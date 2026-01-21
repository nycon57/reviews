/**
 * CounterAnimation Component
 *
 * Animated number counter that smoothly counts up to a target value.
 * Used for NPS scores, review counts, and other metrics.
 */

import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { REPWELL_COLORS } from "../types";

interface CounterAnimationProps {
  /** Target value to count to */
  value: number;
  /** Frame to start the animation */
  startFrame: number;
  /** Duration of the count animation in frames */
  durationFrames?: number;
  /** Prefix (e.g., "$", "+") */
  prefix?: string;
  /** Suffix (e.g., "%", "K") */
  suffix?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Font size in pixels */
  fontSize?: number;
  /** Text color */
  color?: string;
  /** Whether to show a change indicator */
  showChange?: boolean;
  /** Previous value for change calculation */
  previousValue?: number;
  /** Font family */
  fontFamily?: "display" | "sans";
}

export const CounterAnimation: React.FC<CounterAnimationProps> = ({
  value,
  startFrame,
  durationFrames = 60, // 2 seconds at 30fps
  prefix = "",
  suffix = "",
  decimals = 0,
  fontSize = 72,
  color = REPWELL_COLORS.teal[300],
  showChange = false,
  previousValue,
  fontFamily = "display",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Calculate progress through the animation
  const progress = interpolate(
    frame - startFrame,
    [0, durationFrames],
    [0, 1],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  // Apply easing for smooth deceleration at the end
  const easedProgress = easeOutExpo(progress);

  // Calculate current displayed value
  const currentValue = interpolate(easedProgress, [0, 1], [0, value]);
  const displayValue = decimals > 0 ? currentValue.toFixed(decimals) : Math.round(currentValue);

  // Entry animation
  const entryProgress = spring({
    frame: frame - startFrame,
    fps,
    config: {
      stiffness: 200,
      damping: 25,
    },
    durationInFrames: fps * 0.5,
  });

  const scale = interpolate(entryProgress, [0, 1], [0.8, 1]);
  const opacity = interpolate(entryProgress, [0, 1], [0, 1]);

  // Calculate change if showing
  const change = previousValue !== undefined ? value - previousValue : 0;
  const changePercent = previousValue ? ((change / previousValue) * 100).toFixed(1) : "0";
  const isPositive = change >= 0;

  const containerStyles: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    transform: `scale(${scale})`,
    opacity,
  };

  const numberStyles: React.CSSProperties = {
    fontFamily:
      fontFamily === "display"
        ? "'Erstoria', Georgia, serif"
        : "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${fontSize}px`,
    fontWeight: 700,
    color,
    lineHeight: 1,
    letterSpacing: "-0.02em",
  };

  const changeStyles: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${fontSize * 0.25}px`,
    fontWeight: 600,
    color: isPositive ? REPWELL_COLORS.sage[200] : REPWELL_COLORS.accent.error,
  };

  const changeOpacity = interpolate(
    frame - startFrame - durationFrames * 0.8,
    [0, fps * 0.3],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={containerStyles}>
      <div style={numberStyles}>
        {prefix}
        {displayValue}
        {suffix}
      </div>
      {showChange && previousValue !== undefined && (
        <div style={{ ...changeStyles, opacity: changeOpacity }}>
          <span>{isPositive ? "↑" : "↓"}</span>
          <span>
            {isPositive ? "+" : ""}
            {changePercent}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Exponential ease out function for smooth deceleration
 */
function easeOutExpo(x: number): number {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * Counter with label
 */
interface LabeledCounterProps extends CounterAnimationProps {
  label: string;
  labelColor?: string;
}

export const LabeledCounter: React.FC<LabeledCounterProps> = ({
  label,
  labelColor = REPWELL_COLORS.teal[400],
  ...counterProps
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Label fade in after counter starts
  const labelOpacity = interpolate(
    frame - counterProps.startFrame,
    [fps * 0.3, fps * 0.6],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const labelStyles: React.CSSProperties = {
    fontFamily: "'Source Sans 3', system-ui, sans-serif",
    fontSize: `${(counterProps.fontSize || 72) * 0.28}px`,
    fontWeight: 500,
    color: labelColor,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    marginTop: "8px",
    opacity: labelOpacity,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CounterAnimation {...counterProps} />
      <div style={labelStyles}>{label}</div>
    </div>
  );
};

export default CounterAnimation;
