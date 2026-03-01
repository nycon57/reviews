/**
 * "Powered by RepWell" badge for bottom of templates.
 */

interface PoweredByBadgeProps {
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  opacity?: number;
  anchor?: "middle" | "start" | "end";
}

export function PoweredByBadge({
  x,
  y,
  fontSize = 14,
  color = "#666666",
  opacity = 0.6,
  anchor = "middle",
}: PoweredByBadgeProps) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      fontSize={fontSize}
      fontFamily="Inter, sans-serif"
      opacity={opacity}
    >
      <tspan fontWeight={400}>Powered by </tspan>
      <tspan fontWeight={700}>RepWell</tspan>
    </text>
  );
}
