"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/reviews/rating-stars";
import { getInitials } from "@/lib/utils";

interface CompactProfileCardProps {
  fullName: string;
  photoUrl: string | null;
  title: string | null;
  averageRating: string | number | null;
  totalReviews: number | null;
}

export function CompactProfileCard({
  fullName,
  photoUrl,
  title,
  averageRating,
  totalReviews,
}: CompactProfileCardProps) {
  const rating = averageRating ? Number(averageRating) : 0;

  return (
    <motion.div
      key="compact-card"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow-md p-4 mb-4"
    >
      <div className="flex items-start gap-3">
        {/* Compact Avatar */}
        <div>
          <Avatar className="h-12 w-12 border-2 border-white shadow">
            <AvatarImage src={photoUrl || undefined} alt={fullName} />
            <AvatarFallback className="text-sm font-semibold bg-repwell-sage-100 text-repwell-teal-400">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Compact Info */}
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-display font-bold text-repwell-teal-500 truncate">
            {fullName}
          </h2>

          <div className="flex items-center gap-1 text-sm text-repwell-teal-400">
            <span className="truncate">
              {title || "Professional"}
            </span>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {averageRating && totalReviews ? (
              <div className="flex items-center gap-1.5">
                <RatingStars rating={rating} size="sm" />
                <span className="text-sm font-medium text-repwell-teal-500">
                  {rating.toFixed(1)} ({totalReviews})
                </span>
              </div>
            ) : null}

          </div>
        </div>
      </div>
    </motion.div>
  );
}
