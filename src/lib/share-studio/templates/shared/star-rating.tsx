/**
 * SVG star rating component.
 * Renders 5 stars at given position, filled/unfilled based on rating.
 */

// Standard 5-pointed star path in a 24×24 viewBox (center at 12,12)
const STAR_PATH =
  "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

interface StarRatingProps {
  x: number;
  y: number;
  rating: number; // 1-5
  starSize?: number;
  filledColor?: string;
  emptyColor?: string;
  gap?: number;
}

export function StarRating({
  x,
  y,
  rating,
  starSize = 24,
  filledColor = "#FBBF24",
  emptyColor = "#D1D5DB",
  gap = 4,
}: StarRatingProps) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  const scale = starSize / 24; // Star path is 24x24 viewBox

  return (
    <g transform={`translate(${x}, ${y})`}>
      {Array.from({ length: 5 }, (_, i) => (
        <g
          key={i}
          transform={`translate(${i * (starSize + gap)}, 0) scale(${scale})`}
        >
          <path d={STAR_PATH} fill={i < filled ? filledColor : emptyColor} />
        </g>
      ))}
    </g>
  );
}

/** Total width of the star rating group */
export function starRatingWidth(starSize = 24, gap = 4): number {
  return starSize * 5 + gap * 4;
}
