/**
 * CTA button — rounded rectangle with centered text.
 */

interface CtaButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fillColor: string;
  textColor?: string;
  fontSize?: number;
  cornerRadius?: number;
}

export function CtaButton({
  x,
  y,
  width,
  height,
  label,
  fillColor,
  textColor = "#ffffff",
  fontSize = 16,
  cornerRadius = 8,
}: CtaButtonProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={cornerRadius}
        ry={cornerRadius}
        fill={fillColor}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={textColor}
        fontSize={fontSize}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
      >
        {label}
      </text>
    </g>
  );
}
