/**
 * Weekly Performance Summary Email Template - Loan Officer (S082)
 *
 * Automated weekly summary email with key metrics, trends, and actionable insights.
 */

import * as React from "react";
import { Section, Text, Row, Column } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailHeading,
  EmailParagraph,
  EmailCard,
  InfoCard,
  StatsCard,
  MetricComparison,
  ReviewCard,
  Spacer,
  Badge,
  EmailButton,
  colors,
  typography,
  spacing,
} from "../components";
import type { WeeklySummaryLOEmailData } from "../types";

interface WeeklySummaryLOEmailProps {
  data: WeeklySummaryLOEmailData;
}

export function WeeklySummaryLOEmail({ data }: WeeklySummaryLOEmailProps) {
  const {
    firstName,
    organizationName,
    weekStartDate,
    weekEndDate,
    dashboardUrl,
    toEmail,

    // Review metrics
    reviewsThisWeek,
    reviewsLastWeek,
    reviewsTrend,
    reviewsTrendValue,

    // Rating metrics
    averageRatingThisWeek,
    averageRatingLastWeek,
    ratingTrend,
    ratingTrendValue,

    // Response metrics
    responseRate,
    averageResponseTime: _averageResponseTime,

    // Pending actions
    pendingReviewResponses,
    pendingSurveys,

    // Leaderboard
    leaderboardRank,
    leaderboardRankChange,
    totalMembers,

    // Top review
    topReview,

    // NPS
    npsScore,

    // Survey metrics
    surveysCompleted,
    surveyResponseRate,
  } = data;

  const hasPendingActions = pendingReviewResponses > 0 || pendingSurveys > 0;
  const hasActivity = reviewsThisWeek > 0 || surveysCompleted > 0;

  // Greeting based on time
  const greeting = "Hi";

  return (
    <EmailLayout
      preview={`Your weekly performance summary: ${reviewsThisWeek} review${reviewsThisWeek !== 1 ? "s" : ""} this week`}
    >
      <RepwellHeader />

      {/* Header Section */}
      <SingleColumnLayout center>
        <Badge variant="info">Weekly Summary</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Your Week in Review</EmailHeading>
        <EmailParagraph muted>
          {weekStartDate} - {weekEndDate}
        </EmailParagraph>
        <EmailParagraph>
          {greeting} {firstName}, here&apos;s how you performed this week at{" "}
          {organizationName}.
        </EmailParagraph>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Key Metrics */}
      <SingleColumnLayout>
        <Text
          style={{
            margin: `0 0 ${spacing[3]} 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          Key Metrics
        </Text>

        <StatsCard
          title="This Week&apos;s Performance"
          stats={[
            {
              value: reviewsThisWeek,
              label: "Reviews",
              trend: {
                direction: reviewsTrend,
                value: reviewsTrendValue,
              },
            },
            {
              value:
                averageRatingThisWeek !== null
                  ? averageRatingThisWeek.toFixed(1)
                  : "-",
              label: "Avg Rating",
              trend:
                averageRatingThisWeek !== null
                  ? {
                      direction: ratingTrend,
                      value: ratingTrendValue,
                    }
                  : undefined,
            },
            {
              value: `${responseRate}%`,
              label: "Response Rate",
            },
          ]}
        />
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Week-over-Week Comparison */}
      <SingleColumnLayout>
        <Text
          style={{
            margin: `0 0 ${spacing[3]} 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.xs,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.muted,
            textTransform: "uppercase",
            letterSpacing: typography.letterSpacing.wider,
          }}
        >
          Week-over-Week
        </Text>

        <Row>
          <Column style={{ width: "48%", paddingRight: spacing[2] }}>
            <MetricComparison
              label="Reviews"
              current={reviewsThisWeek}
              previous={reviewsLastWeek}
              change={reviewsTrendValue}
              changeDirection={reviewsTrend}
              positiveIsGood={true}
            />
          </Column>
          <Column style={{ width: "48%", paddingLeft: spacing[2] }}>
            <MetricComparison
              label="Avg Rating"
              current={
                averageRatingThisWeek !== null
                  ? averageRatingThisWeek.toFixed(1)
                  : "-"
              }
              previous={
                averageRatingLastWeek !== null
                  ? averageRatingLastWeek.toFixed(1)
                  : "-"
              }
              change={
                averageRatingThisWeek !== null && averageRatingLastWeek !== null
                  ? ratingTrendValue
                  : undefined
              }
              changeDirection={ratingTrend}
              positiveIsGood={true}
            />
          </Column>
        </Row>
      </SingleColumnLayout>

      {/* Leaderboard Position */}
      {leaderboardRank !== null && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <EmailCard>
              <Row>
                <Column style={{ width: "60%", verticalAlign: "middle" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.muted,
                    }}
                  >
                    Leaderboard Position
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.display,
                      fontSize: typography.fontSize["3xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.repwell.teal[400],
                    }}
                  >
                    #{leaderboardRank}
                    <Text
                      style={{
                        display: "inline",
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.sm,
                        fontWeight: typography.fontWeight.normal,
                        color: colors.text.muted,
                      }}
                    >
                      {" "}
                      of {totalMembers}
                    </Text>
                  </Text>
                </Column>
                <Column
                  style={{
                    width: "40%",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  {leaderboardRankChange !== null && leaderboardRankChange !== 0 && (
                    <Badge
                      variant={leaderboardRankChange > 0 ? "success" : "warning"}
                    >
                      {leaderboardRankChange > 0
                        ? `Up ${leaderboardRankChange}`
                        : `Down ${Math.abs(leaderboardRankChange)}`}
                    </Badge>
                  )}
                </Column>
              </Row>
            </EmailCard>
          </SingleColumnLayout>
        </>
      )}

      {/* Top Review Highlight */}
      {topReview && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <Text
              style={{
                margin: `0 0 ${spacing[3]} 0`,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text.muted,
                textTransform: "uppercase",
                letterSpacing: typography.letterSpacing.wider,
              }}
            >
              Top Review This Week
            </Text>

            <ReviewCard
              reviewerName={topReview.customerName}
              rating={topReview.rating}
              review={topReview.text}
              truncate={true}
              maxLength={200}
            />

            <Spacer size="sm" />
            <Section style={{ textAlign: "center" }}>
              <EmailButton
                href={`${dashboardUrl}/reviews/${topReview.reviewId}`}
                variant="secondary"
                size="sm"
              >
                View & Share This Review
              </EmailButton>
            </Section>
          </SingleColumnLayout>
        </>
      )}

      {/* Pending Actions */}
      {hasPendingActions && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <InfoCard type="warning" title="Action Required">
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                }}
              >
                You have pending items that need attention:
              </Text>
              <ul
                style={{
                  margin: `${spacing[2]} 0 0 0`,
                  paddingLeft: spacing[4],
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {pendingReviewResponses > 0 && (
                  <li style={{ marginBottom: spacing[1] }}>
                    <strong>{pendingReviewResponses}</strong> review
                    {pendingReviewResponses !== 1 ? "s" : ""} awaiting your
                    response
                  </li>
                )}
                {pendingSurveys > 0 && (
                  <li>
                    <strong>{pendingSurveys}</strong> pending survey
                    {pendingSurveys !== 1 ? "s" : ""} to follow up on
                  </li>
                )}
              </ul>
            </InfoCard>
          </SingleColumnLayout>
        </>
      )}

      {/* NPS Score */}
      {npsScore !== null && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <EmailCard showAccentBar={false}>
              <Row>
                <Column style={{ width: "50%", verticalAlign: "middle" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.fontSize.sm,
                      color: colors.text.muted,
                    }}
                  >
                    Your NPS Score
                  </Text>
                </Column>
                <Column
                  style={{
                    width: "50%",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <Text
                    style={{
                      margin: 0,
                      fontFamily: typography.fontFamily.display,
                      fontSize: typography.fontSize["2xl"],
                      fontWeight: typography.fontWeight.bold,
                      color:
                        npsScore >= 50
                          ? colors.accent.success
                          : npsScore >= 0
                          ? colors.accent.warning
                          : colors.accent.error,
                    }}
                  >
                    {npsScore}
                  </Text>
                </Column>
              </Row>
            </EmailCard>
          </SingleColumnLayout>
        </>
      )}

      {/* Survey Metrics */}
      {surveysCompleted > 0 && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <EmailCard showAccentBar={false}>
              <Row>
                <Column style={{ width: "50%", borderRight: `1px solid ${colors.border.subtle}` }}>
                  <Section style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.display,
                        fontSize: typography.fontSize["2xl"],
                        fontWeight: typography.fontWeight.bold,
                        color: colors.repwell.teal[400],
                      }}
                    >
                      {surveysCompleted}
                    </Text>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.xs,
                        color: colors.text.muted,
                      }}
                    >
                      Surveys Completed
                    </Text>
                  </Section>
                </Column>
                <Column style={{ width: "50%" }}>
                  <Section style={{ textAlign: "center" }}>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.display,
                        fontSize: typography.fontSize["2xl"],
                        fontWeight: typography.fontWeight.bold,
                        color: colors.repwell.teal[400],
                      }}
                    >
                      {surveyResponseRate}%
                    </Text>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.xs,
                        color: colors.text.muted,
                      }}
                    >
                      Response Rate
                    </Text>
                  </Section>
                </Column>
              </Row>
            </EmailCard>
          </SingleColumnLayout>
        </>
      )}

      {/* No Activity Message */}
      {!hasActivity && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <InfoCard type="info" title="No Activity This Week">
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                }}
              >
                You didn&apos;t receive any new reviews this week. Consider
                sending out more surveys to your recent clients to boost your
                feedback.
              </Text>
            </InfoCard>
          </SingleColumnLayout>
        </>
      )}

      <Spacer size="lg" />

      {/* CTA */}
      <SingleColumnLayout center>
        <EmailButton href={dashboardUrl} variant="primary" size="lg">
          View Full Dashboard
        </EmailButton>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default WeeklySummaryLOEmail;
