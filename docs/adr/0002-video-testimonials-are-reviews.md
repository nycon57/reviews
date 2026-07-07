# 0002. Video testimonials are reviews

Date: 2026-06-09

## Status

Accepted

## Context

Video testimonials lived entirely in `video_testimonial_responses` with their
own approval lifecycle, while text reviews live in `reviews`. The two only met
in the dashboard UI (`?type=video` switches data sources). As a result,
approved video testimonials did not count toward a professional's
`average_rating` or `total_reviews`, were invisible to auto-approval rules,
and any future rating-threshold infrastructure (action plans, communications)
would have to be built twice. Adding a customer rating to the video flow
forced the question: extend the parallel system, or unify.

## Decision

There is one Review concept. A video testimonial is a review with media
attached. When AI processing completes and a customer rating exists, the
worker creates a canonical `reviews` row (`source='video_testimonial'`,
`source_review_id` = response id, `rating` = customer rating, `text` = the
AI-generated review draft, sentiment copied) with status `pending`, and the
response stores a `review_id` back-link. Video approval, rejection,
publishing, and AI-text edits sync to the review row. Flow metadata
(passthrough clicks, recapture email, private feedback) stays on the
response, since it describes the collection moment, not the review.

## Consequences

- Video testimonials flow into rating aggregates, widgets, auto-approval
  rules, and threshold-based action plans through the same paths as text
  reviews; nothing rating-related is built twice.
- The sync between `approval_status` on the response and `status` on the
  review is an invariant that approval actions must maintain.
- Legacy responses without a customer rating get no review row (the
  `reviews.rating` column is NOT NULL); they remain video-only records.
- Quarantine needs no second publishing gate: a low-rated video's review
  simply stays `pending` and is skipped by auto-approval until a human
  approves it.
