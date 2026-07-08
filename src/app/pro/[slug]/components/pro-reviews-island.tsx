"use client";

import { useCallback, useState } from "react";

import type { PublicReview } from "@/lib/seo/actions";
import { ReferFriendModal } from "./refer-friend-modal";
import { ReportReviewModal } from "./report-review-modal";
import { ReviewsList } from "./reviews-list";
import { WriteReviewModal } from "./write-review-modal";

interface ProReviewsIslandProps {
  reviews: PublicReview[];
  professionalId: string;
  professionalName: string;
  profileUrl: string;
  zillowUrl?: string | null;
  linkedinUrl?: string | null;
  acceptsPublicReviews?: boolean;
}

export function ProReviewsIsland({
  reviews,
  professionalId,
  professionalName,
  profileUrl,
  zillowUrl,
  linkedinUrl,
  acceptsPublicReviews = true,
}: ProReviewsIslandProps) {
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  return (
    <>
      <ReviewsList
        reviews={reviews}
        loanOfficerName={professionalName}
        profileUrl={profileUrl}
        zillowUrl={zillowUrl}
        linkedinUrl={linkedinUrl}
        acceptsPublicReviews={acceptsPublicReviews}
        onWriteReview={() => setIsReviewModalOpen(true)}
        onReferFriend={() => setIsReferModalOpen(true)}
        onFlagReview={handleFlagReview}
      />

      <ReferFriendModal
        open={isReferModalOpen}
        onOpenChange={setIsReferModalOpen}
        loanOfficerId={professionalId}
        loanOfficerName={professionalName}
      />

      <WriteReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        loanOfficerId={professionalId}
        loanOfficerName={professionalName}
      />

      <ReportReviewModal
        open={reportReviewId !== null}
        onOpenChange={(open) => {
          if (!open) setReportReviewId(null);
        }}
        reviewId={reportReviewId ?? ""}
      />
    </>
  );
}
