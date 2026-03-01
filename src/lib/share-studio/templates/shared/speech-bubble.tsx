/**
 * Speech bubble shape — a rounded rectangle with a triangular tail.
 * The tail points downward by default.
 */

interface SpeechBubbleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius?: number;
  tailWidth?: number;
  tailHeight?: number;
  /** Horizontal offset from center for the tail tip (0 = centered) */
  tailOffset?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export function SpeechBubble({
  x,
  y,
  width,
  height,
  cornerRadius = 20,
  tailWidth = 30,
  tailHeight = 20,
  tailOffset = 0,
  fill = "#ffffff",
  stroke,
  strokeWidth = 0,
}: SpeechBubbleProps) {
  const r = Math.min(cornerRadius, width / 2, height / 2);
  const bx = x + width / 2 + tailOffset; // Tail base center x

  // Rounded rectangle body + triangular tail at bottom
  const d = [
    // Start at top-left, after corner
    `M ${x + r} ${y}`,
    // Top edge
    `L ${x + width - r} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + r}`,
    // Right edge
    `L ${x + width} ${y + height - r}`,
    `Q ${x + width} ${y + height} ${x + width - r} ${y + height}`,
    // Bottom edge → tail
    `L ${bx + tailWidth / 2} ${y + height}`,
    `L ${bx} ${y + height + tailHeight}`,
    `L ${bx - tailWidth / 2} ${y + height}`,
    // Continue bottom edge
    `L ${x + r} ${y + height}`,
    `Q ${x} ${y + height} ${x} ${y + height - r}`,
    // Left edge
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    "Z",
  ].join(" ");

  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
}
