import { Star } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

const STAR_SIZE_CLASSES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export function RatingStars({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: keyof typeof STAR_SIZE_CLASSES;
  className?: string;
}) {
  const filledStars = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          weight={index < filledStars ? "fill" : "regular"}
          className={cn(
            STAR_SIZE_CLASSES[size],
            index < filledStars
              ? "fill-yellow-400 text-yellow-400"
              : "text-repwell-sage-200"
          )}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
