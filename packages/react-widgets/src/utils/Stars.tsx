interface StarsProps {
  rating: number;
  filledColor?: string;
  emptyColor?: string;
  className?: string;
  /** Use partial star rendering (clip-path) for fractional ratings. */
  partial?: boolean;
}

function StarSVG({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function PartialStar({
  fraction,
  filledColor,
  emptyColor,
}: {
  fraction: number;
  filledColor: string;
  emptyColor: string;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 16, height: 16 }}>
      <StarSVG filled={false} color={emptyColor} />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          overflow: "hidden",
          width: `${(fraction * 100).toFixed(1)}%`,
        }}
      >
        <StarSVG filled={true} color={filledColor} />
      </span>
    </span>
  );
}

export function Stars({
  rating,
  filledColor = "#f59e0b",
  emptyColor = "#d1d5db",
  className,
  partial = false,
}: StarsProps) {
  const fullCount = Math.floor(rating);
  const fraction = rating - fullCount;

  return (
    <span
      className={className}
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      style={{ display: "inline-flex", gap: 2, alignItems: "center" }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        if (i < fullCount) {
          return <StarSVG key={i} filled color={filledColor} />;
        }
        if (partial && i === fullCount && fraction > 0.05) {
          return (
            <PartialStar
              key={i}
              fraction={fraction}
              filledColor={filledColor}
              emptyColor={emptyColor}
            />
          );
        }
        return <StarSVG key={i} filled={false} color={emptyColor} />;
      })}
    </span>
  );
}
