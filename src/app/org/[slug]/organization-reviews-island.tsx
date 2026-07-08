"use client";

import { Quotes as Quote } from "@phosphor-icons/react";

import { PublicProfileReviewsCard } from "@/components/public-profile";
import { ReviewItem } from "@/components/shared/review-item";
import { getBranchPublicPath } from "@/lib/branches/utils";
import type { PublicOrgTestimonial } from "@/lib/seo/actions";

interface OrganizationReviewsIslandProps {
  testimonials: PublicOrgTestimonial[];
  organizationName: string;
  profileUrl: string;
}

export function OrganizationReviewsIsland({
  testimonials,
  organizationName,
  profileUrl,
}: OrganizationReviewsIslandProps) {
  return (
    <PublicProfileReviewsCard
      reviews={testimonials}
      title="Customer Testimonials"
      titleIcon={<Quote className="h-5 w-5 text-repwell-teal-300" />}
      hideWhenEmpty
      emptyCopy=""
      filteredEmptyCopy="No testimonials match your filters."
      loadMoreLabel="Load More Testimonials"
      renderReview={(testimonial, onFlag) => (
        <ReviewItem
          key={testimonial.id}
          review={{
            id: testimonial.id,
            customer_name: testimonial.customer_name,
            customer_location: testimonial.customer_location,
            rating: testimonial.rating,
            text: testimonial.text,
            title: testimonial.title,
            review_date: testimonial.review_date,
            source: testimonial.source,
          }}
          attributionLabel="Served by"
          attribution={{
            loanOfficer: {
              name: testimonial.loan_officer.full_name,
              href: testimonial.loan_officer.slug
                ? `/pro/${testimonial.loan_officer.slug}`
                : "#",
              photoUrl: testimonial.loan_officer.photo_url,
            },
            branch: testimonial.branch
              ? {
                  name: testimonial.branch.name,
                  href: getBranchPublicPath(testimonial.branch),
                }
              : undefined,
          }}
          shareConfig={{ profileUrl, subjectName: organizationName }}
          onFlag={onFlag}
        />
      )}
    />
  );
}
