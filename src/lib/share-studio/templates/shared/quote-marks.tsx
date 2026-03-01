/**
 * Decorative quotation marks (open/close).
 */

interface QuoteMarkProps {
  x: number;
  y: number;
  size?: number;
  color?: string;
  opacity?: number;
}

/** Large opening quote mark (left double quotation) */
export function OpenQuoteMark({
  x,
  y,
  size = 60,
  color = "#000000",
  opacity = 0.1,
}: QuoteMarkProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontFamily="Georgia, serif"
      fill={color}
      opacity={opacity}
      fontWeight={700}
    >
      {"\u201C"}
    </text>
  );
}

/** Large closing quote mark (right double quotation) */
export function CloseQuoteMark({
  x,
  y,
  size = 60,
  color = "#000000",
  opacity = 0.1,
}: QuoteMarkProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontFamily="Georgia, serif"
      fill={color}
      opacity={opacity}
      fontWeight={700}
      textAnchor="end"
    >
      {"\u201D"}
    </text>
  );
}
