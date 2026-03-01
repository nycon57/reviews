/**
 * Hexagonal avatar with optional border.
 * Falls back to initials on a colored hexagon when no image is provided.
 */

/** Generate hexagon points string centered at (cx, cy) with given radius. */
function hexagonPoints(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2; // Start from top
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
  }
  return points.join(" ");
}

interface AvatarHexagonProps {
  cx: number;
  cy: number;
  radius: number;
  imageBase64: string | null;
  name: string;
  borderColor?: string;
  borderWidth?: number;
  fallbackBg?: string;
  fallbackTextColor?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (name[0] || "?").toUpperCase();
}

export function AvatarHexagon({
  cx,
  cy,
  radius,
  imageBase64,
  name,
  borderColor = "#ffffff",
  borderWidth = 4,
  fallbackBg = "#52796f",
  fallbackTextColor = "#ffffff",
}: AvatarHexagonProps) {
  const clipId = `avatar-hex-${cx}-${cy}`;
  const initials = getInitials(name);
  const clipPoints = hexagonPoints(cx, cy, radius);
  const borderPoints = hexagonPoints(cx, cy, radius + borderWidth / 2);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <polygon points={clipPoints} />
        </clipPath>
      </defs>

      {/* Border */}
      {borderWidth > 0 && (
        <polygon
          points={borderPoints}
          fill="none"
          stroke={borderColor}
          strokeWidth={borderWidth}
          strokeLinejoin="round"
        />
      )}

      {imageBase64 ? (
        <image
          href={imageBase64}
          x={cx - radius}
          y={cy - radius}
          width={radius * 2}
          height={radius * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <g>
          <polygon points={clipPoints} fill={fallbackBg} />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill={fallbackTextColor}
            fontSize={radius * 0.7}
            fontFamily="Inter, sans-serif"
            fontWeight={600}
          >
            {initials}
          </text>
        </g>
      )}
    </g>
  );
}
