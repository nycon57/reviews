/**
 * Circular avatar with optional border ring.
 * Falls back to initials on a colored circle when no image is provided.
 */

interface AvatarCircleProps {
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

export function AvatarCircle({
  cx,
  cy,
  radius,
  imageBase64,
  name,
  borderColor = "#ffffff",
  borderWidth = 4,
  fallbackBg = "#52796f",
  fallbackTextColor = "#ffffff",
}: AvatarCircleProps) {
  const clipId = `avatar-circle-${cx}-${cy}`;
  const initials = getInitials(name);

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={radius} />
        </clipPath>
      </defs>

      {/* Border ring */}
      {borderWidth > 0 && (
        <circle
          cx={cx}
          cy={cy}
          r={radius + borderWidth / 2}
          fill="none"
          stroke={borderColor}
          strokeWidth={borderWidth}
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
          <circle cx={cx} cy={cy} r={radius} fill={fallbackBg} />
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            fill={fallbackTextColor}
            fontSize={radius * 0.8}
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
