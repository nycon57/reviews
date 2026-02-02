import { useState } from "react";
import type { PublicReview, WidgetContent } from "../types";
import { Stars } from "./Stars";
import {
  getInitials,
  truncateText,
  formatRelativeDate,
  formatAbsoluteDate,
} from "./helpers";

interface ReviewCardProps {
  review: PublicReview;
  content?: WidgetContent;
  starFilled: string;
  starEmpty: string;
  cardStyle?: "bordered" | "shadow" | "flat";
  onClickReview?: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  content,
  starFilled,
  starEmpty,
  cardStyle = "bordered",
  onClickReview,
}: ReviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const truncLen = content?.truncateLength ?? 300;
  const reviewText = review.text ?? "";
  const { text: displayText, truncated } =
    truncLen > 0 && !expanded ? truncateText(reviewText, truncLen) : { text: reviewText, truncated: false };

  const dateFormat = content?.dateFormat ?? "relative";
  const dateText =
    review.review_date &&
    (dateFormat === "relative"
      ? formatRelativeDate(review.review_date)
      : formatAbsoluteDate(review.review_date));

  return (
    <article
      className={`rw-review-card rw-review-card--${cardStyle}`}
      aria-label={`Review by ${review.reviewer_name ?? "Anonymous"}`}
    >
      <div className="rw-review-card__header">
        {content?.showAvatar !== false && (
          <div className="rw-review-card__avatar">
            {getInitials(review.reviewer_name)}
          </div>
        )}
        <div className="rw-review-card__meta">
          {review.reviewer_name && (
            <span className="rw-review-card__name">{review.reviewer_name}</span>
          )}
          {content?.showDate !== false && dateText && (
            <span className="rw-review-card__date">{dateText}</span>
          )}
        </div>
      </div>

      <Stars rating={review.rating} filledColor={starFilled} emptyColor={starEmpty} />

      {reviewText && (
        <p className="rw-review-card__text">
          {displayText}
          {truncated && (
            <button
              type="button"
              className="rw-review-card__expand"
              onClick={() => {
                setExpanded(true);
                onClickReview?.(review.id);
              }}
              aria-expanded={expanded}
            >
              Read more
            </button>
          )}
        </p>
      )}

      <div className="rw-review-card__tags">
        {content?.showSource !== false && review.source && (
          <span className="rw-review-card__source">via {review.source}</span>
        )}
        {review.loan_type && (
          <span className="rw-review-card__loan-type">{review.loan_type}</span>
        )}
        {review.first_time_homebuyer && (
          <span className="rw-review-card__fthb">First-time buyer</span>
        )}
        {review.loan_officer_name && (
          <span className="rw-review-card__lo">LO: {review.loan_officer_name}</span>
        )}
      </div>
    </article>
  );
}
