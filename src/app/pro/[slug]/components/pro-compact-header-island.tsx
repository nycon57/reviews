"use client";

import { useState } from "react";
import { AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";

import { useIsDesktop } from "@/hooks/use-is-desktop";
import { CompactProfileCard } from "./compact-profile-card";

const SCROLL_THRESHOLD = 200;

interface ProCompactHeaderIslandProps {
  fullName: string;
  photoUrl: string | null;
  title: string | null;
  averageRating: string | number | null;
  totalReviews: number | null;
}

export function ProCompactHeaderIsland({
  fullName,
  photoUrl,
  title,
  averageRating,
  totalReviews,
}: ProCompactHeaderIslandProps) {
  const [isCompact, setIsCompact] = useState(false);
  const isDesktop = useIsDesktop();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCompact((previous) => {
      if (!previous && latest > SCROLL_THRESHOLD) return true;
      if (previous && latest < SCROLL_THRESHOLD - 100) return false;
      return previous;
    });
  });

  return (
    <AnimatePresence>
      {isDesktop && isCompact && (
        <CompactProfileCard
          fullName={fullName}
          photoUrl={photoUrl}
          title={title}
          averageRating={averageRating}
          totalReviews={totalReviews}
        />
      )}
    </AnimatePresence>
  );
}
