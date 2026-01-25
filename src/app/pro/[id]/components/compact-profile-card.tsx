"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  BuildingOffice as Building2,
  Medal as Award,
} from "@phosphor-icons/react";
import { morphSpring } from "@/lib/motion";

interface CompactProfileCardProps {
  fullName: string;
  photoUrl: string | null;
  title: string | null;
  organizationName: string | null;
  averageRating: string | number | null;
  totalReviews: number | null;
  npsScore: number | null;
  nmlsId: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function CompactStarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3].map((star) => (
        <Star
          key={star}
          weight="fill"
          className={`h-3 w-3 ${
            star <= rating ? "text-amber-500" : "text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function CompactProfileCard({
  fullName,
  photoUrl,
  title,
  organizationName,
  averageRating,
  totalReviews,
  npsScore,
  nmlsId,
}: CompactProfileCardProps) {
  const rating = averageRating ? Number(averageRating) : 0;

  return (
    <motion.div
      layoutId="profile-card"
      className="bg-white rounded-xl shadow-md p-4 mb-4"
      transition={morphSpring}
    >
      <div className="flex items-start gap-3">
        {/* Compact Avatar */}
        <motion.div layoutId="profile-avatar" transition={morphSpring}>
          <Avatar className="h-12 w-12 border-2 border-white shadow">
            <AvatarImage src={photoUrl || undefined} alt={fullName} />
            <AvatarFallback className="text-sm font-semibold bg-repwell-sage-100 text-repwell-teal-400">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Compact Info */}
        <div className="flex-1 min-w-0">
          <motion.h2
            layoutId="profile-name"
            className="text-base font-display font-bold text-repwell-teal-500 truncate"
            transition={morphSpring}
          >
            {fullName}
          </motion.h2>

          <div className="flex items-center gap-1 text-sm text-repwell-teal-400">
            <motion.span
              layoutId="profile-title"
              className="truncate"
              transition={morphSpring}
            >
              {title || "Professional"}
            </motion.span>
            {organizationName && (
              <>
                <span className="text-repwell-teal-300">@</span>
                <motion.span
                  layoutId="profile-org"
                  className="truncate flex items-center gap-1"
                  transition={morphSpring}
                >
                  <Building2 className="h-3 w-3 shrink-0" />
                  {organizationName}
                </motion.span>
              </>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {averageRating && totalReviews ? (
              <motion.div
                layoutId="profile-rating"
                className="flex items-center gap-1.5"
                transition={morphSpring}
              >
                <CompactStarRating rating={Math.round(rating)} />
                <span className="text-sm font-medium text-repwell-teal-500">
                  {rating.toFixed(1)}
                </span>
              </motion.div>
            ) : null}

            {totalReviews ? (
              <motion.div layoutId="profile-review-badge" transition={morphSpring}>
                <Badge
                  variant="secondary"
                  className="bg-repwell-sage-100 text-repwell-teal-400 text-xs px-1.5 py-0"
                >
                  {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
                </Badge>
              </motion.div>
            ) : null}

            {npsScore !== null && (
              <motion.div layoutId="profile-nps-badge" transition={morphSpring}>
                <Badge
                  variant="outline"
                  className="border-repwell-sage-200 text-repwell-teal-400 text-xs px-1.5 py-0"
                >
                  NPS: {npsScore}
                </Badge>
              </motion.div>
            )}

            {nmlsId && (
              <motion.div
                layoutId="profile-nmls"
                className="flex items-center gap-1 text-xs text-repwell-teal-300"
                transition={morphSpring}
              >
                <Award className="h-3 w-3" />
                NMLS# {nmlsId}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
