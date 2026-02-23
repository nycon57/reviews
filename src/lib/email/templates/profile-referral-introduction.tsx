/**
 * Profile Referral Introduction Email Template
 *
 * Sent when someone refers a friend via a professional's public profile page.
 * Includes a personalized message, an embedded profile snippet (photo, rating,
 * reviews, "View Profile" CTA), and recent review excerpts.
 */

import * as React from "react";
import { Section, Text, Img, Row, Column } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailParagraph,
  PrimaryButton,
  EmailCard,
  Spacer,
  Testimonial,
  colors,
  typography,
  spacing,
  layout,
} from "../components";
import type { ProfileReferralIntroductionEmailData } from "../types";

interface ProfileReferralIntroductionEmailProps {
  data: ProfileReferralIntroductionEmailData;
}

function StarRatingInline({ rating }: { rating: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          color: i <= Math.round(rating) ? "#facc15" : colors.border.default,
          fontSize: "18px",
          marginRight: "2px",
        }}
      >
        &#9733;
      </span>
    );
  }
  return <>{stars}</>;
}

export function ProfileReferralIntroductionEmail({
  data,
}: ProfileReferralIntroductionEmailProps) {
  const {
    referredName,
    referrerName,
    message,
    professionalName,
    professionalTitle,
    professionalPhotoUrl,
    organizationName,
    averageRating,
    totalReviews,
    phone,
    profileUrl,
    recentReviews,
    toEmail,
  } = data;

  return (
    <EmailLayout
      preview={`${referrerName || "Someone"} wants to introduce you to ${professionalName}`}
    >
      <RepwellHeader />

      <SingleColumnLayout>
        {/* Greeting */}
        <EmailParagraph>
          Hi {referredName},
        </EmailParagraph>

        {/* Personal message from referrer */}
        <EmailCard showAccentBar accentColor={colors.repwell.sage[200]}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.base,
              color: colors.text.secondary,
              fontStyle: "italic",
              lineHeight: typography.lineHeight.relaxed,
              marginBottom: spacing[3],
            }}
          >
            &ldquo;{message}&rdquo;
          </Text>
          {referrerName && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
              }}
            >
              &mdash; {referrerName}
            </Text>
          )}
        </EmailCard>

        <Spacer size="lg" />

        {/* Profile Snippet Card */}
        <Section
          style={{
            backgroundColor: colors.background.white,
            border: `1px solid ${colors.border.default}`,
            borderRadius: layout.borderRadius.lg,
            padding: spacing[6],
          }}
        >
          {/* Photo + Name + Title + Org */}
          <Row>
            {professionalPhotoUrl && (
              <Column
                style={{
                  width: "96px",
                  verticalAlign: "top",
                  paddingRight: spacing[4],
                }}
              >
                <Img
                  src={professionalPhotoUrl}
                  alt={professionalName}
                  width="80"
                  height="80"
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: `3px solid ${colors.repwell.sage[100]}`,
                  }}
                />
              </Column>
            )}
            <Column style={{ verticalAlign: "top" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.repwell.teal[500],
                  lineHeight: typography.lineHeight.tight,
                }}
              >
                {professionalName}
              </Text>
              {(professionalTitle || organizationName) && (
                <Text
                  style={{
                    margin: `${spacing[1]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.secondary,
                  }}
                >
                  {professionalTitle}
                  {professionalTitle && organizationName && " · "}
                  {organizationName}
                </Text>
              )}

              {/* Star rating + review count */}
              {averageRating && totalReviews ? (
                <Section style={{ marginTop: spacing[3] }}>
                  <StarRatingInline rating={averageRating} />
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.repwell.teal[400],
                    }}
                  >
                    {averageRating.toFixed(1)} &middot; {totalReviews}{" "}
                    {totalReviews === 1 ? "Review" : "Reviews"}
                  </Text>
                </Section>
              ) : null}

              {/* Phone */}
              {phone && (
                <Text
                  style={{
                    margin: `${spacing[2]} 0 0 0`,
                    fontFamily: typography.fontFamily.body,
                    fontSize: typography.fontSize.sm,
                    color: colors.text.muted,
                  }}
                >
                  {phone}
                </Text>
              )}
            </Column>
          </Row>
        </Section>

        <Spacer size="md" />

        {/* View Full Profile CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={profileUrl}>View Full Profile</PrimaryButton>
        </Section>

        {/* Recent Reviews */}
        {recentReviews && recentReviews.length > 0 && (
          <>
            <Spacer size="lg" />
            <Text
              style={{
                margin: `0 0 ${spacing[3]} 0`,
                fontFamily: typography.fontFamily.display,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.semibold,
                color: colors.repwell.teal[500],
              }}
            >
              What Others Are Saying
            </Text>
            {recentReviews.map((review, index) => (
              <React.Fragment key={index}>
                <Testimonial
                  variant="compact"
                  quote={review.text}
                  authorName={review.customerName}
                  rating={review.rating}
                />
                {index < recentReviews.length - 1 && <Spacer size="sm" />}
              </React.Fragment>
            ))}
          </>
        )}
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
