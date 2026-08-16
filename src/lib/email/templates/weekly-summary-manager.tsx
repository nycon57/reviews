/**
 * Weekly Performance Summary Email Template - Manager (S082)
 *
 * Automated weekly summary email with team metrics, performers, and alerts.
 */

import * as React from "react";
import { Section, Text, Row, Column, Img } from "@react-email/components";
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
  Leaderboard,
  Spacer,
  Badge,
  EmailButton,
  colors,
  typography,
  spacing,
} from "../components";
import type { WeeklySummaryManagerEmailData } from "../types";

interface WeeklySummaryManagerEmailProps {
  data: WeeklySummaryManagerEmailData;
}

export function WeeklySummaryManagerEmail({
  data,
}: WeeklySummaryManagerEmailProps) {
  const {
    firstName,
    organizationName,
    weekStartDate,
    weekEndDate,
    dashboardUrl,
    toEmail,

    // Team size
    teamSize,

    // Team review metrics
    teamReviewsThisWeek,
    teamReviewsLastWeek,
    teamReviewsTrend,
    teamReviewsTrendValue,

    // Team rating metrics
    teamAverageRating,
    teamAverageRatingLastWeek,
    teamRatingTrend,
    teamRatingTrendValue,

    // Team response metrics
    teamResponseRate,
    teamAverageResponseTime,

    // Performers
    topPerformers,
    needsAttention,

    // Pending approvals
    pendingApprovals,

    // Alerts
    alerts,

    // Team NPS
    teamNpsScore,
  } = data;

  const hasAlerts = alerts.length > 0;
  const hasNeedsAttention = needsAttention.length > 0;

  return (
    <EmailLayout
      preview={`Team weekly summary: ${teamReviewsThisWeek} reviews, ${teamSize} team members`}
    >
      <RepwellHeader />

      {/* Header Section */}
      <SingleColumnLayout center>
        <Badge variant="info">Team Weekly Summary</Badge>
        <Spacer size="sm" />
        <EmailHeading as="h1">Your Team&apos;s Week in Review</EmailHeading>
        <EmailParagraph muted>
          {weekStartDate} - {weekEndDate}
        </EmailParagraph>
        <EmailParagraph>
          Hi {firstName}, here&apos;s how your team of {teamSize} performed this
          week at {organizationName}.
        </EmailParagraph>
      </SingleColumnLayout>

      <Spacer size="md" />

      {/* Team Overview Stats */}
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
          Team Overview
        </Text>

        <StatsCard
          title="Team Performance"
          stats={[
            {
              value: teamReviewsThisWeek,
              label: "Total Reviews",
              trend: {
                direction: teamReviewsTrend,
                value: teamReviewsTrendValue,
              },
            },
            {
              value:
                teamAverageRating !== null
                  ? teamAverageRating.toFixed(1)
                  : "-",
              label: "Avg Rating",
              trend:
                teamAverageRating !== null
                  ? {
                      direction: teamRatingTrend,
                      value: teamRatingTrendValue,
                    }
                  : undefined,
            },
            {
              value: `${teamResponseRate}%`,
              label: "Response Rate",
            },
            ...(teamAverageResponseTime
              ? [
                  {
                    value: teamAverageResponseTime,
                    label: "Avg Response Time",
                  },
                ]
              : []),
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
              label="Team Reviews"
              current={teamReviewsThisWeek}
              previous={teamReviewsLastWeek}
              change={teamReviewsTrendValue}
              changeDirection={teamReviewsTrend}
              positiveIsGood={true}
            />
          </Column>
          <Column style={{ width: "48%", paddingLeft: spacing[2] }}>
            <MetricComparison
              label="Avg Rating"
              current={
                teamAverageRating !== null ? teamAverageRating.toFixed(1) : "-"
              }
              previous={
                teamAverageRatingLastWeek !== null
                  ? teamAverageRatingLastWeek.toFixed(1)
                  : "-"
              }
              change={
                teamAverageRating !== null && teamAverageRatingLastWeek !== null
                  ? teamRatingTrendValue
                  : undefined
              }
              changeDirection={teamRatingTrend}
              positiveIsGood={true}
            />
          </Column>
        </Row>
      </SingleColumnLayout>

      {/* Alerts Section */}
      {hasAlerts && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <InfoCard type="warning" title="Alerts">
              <ul
                style={{
                  margin: 0,
                  paddingLeft: spacing[4],
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                }}
              >
                {alerts.map((alert, index) => (
                  <li key={index} style={{ marginBottom: spacing[1] }}>
                    {alert.message}
                  </li>
                ))}
              </ul>
            </InfoCard>
          </SingleColumnLayout>
        </>
      )}

      {/* Pending Approvals */}
      {pendingApprovals > 0 && (
        <>
          <Spacer size="md" />
          <SingleColumnLayout>
            <EmailCard accentColor="warning">
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
                    Reviews Pending Approval
                  </Text>
                  <Text
                    style={{
                      margin: `${spacing[1]} 0 0 0`,
                      fontFamily: typography.fontFamily.display,
                      fontSize: typography.fontSize["3xl"],
                      fontWeight: typography.fontWeight.bold,
                      color: colors.accent.warning,
                    }}
                  >
                    {pendingApprovals}
                  </Text>
                </Column>
                <Column
                  style={{
                    width: "40%",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <EmailButton
                    href={`${dashboardUrl}/approvals`}
                    variant="warning"
                    size="sm"
                  >
                    Review Now
                  </EmailButton>
                </Column>
              </Row>
            </EmailCard>
          </SingleColumnLayout>
        </>
      )}

      <Spacer size="md" />

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <>
          <SingleColumnLayout>
            <Leaderboard
              title="Top Performers This Week"
              entries={topPerformers.map((p) => ({
                rank: p.rank,
                name: p.name,
                value: `${p.reviewsCount} reviews`,
                photoUrl: p.photoUrl,
              }))}
            />
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Needs Attention */}
      {hasNeedsAttention && (
        <>
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
              Needs Attention
            </Text>

            <EmailCard accentColor="error" showAccentBar={true}>
              {needsAttention.map((member, index) => (
                <Section
                  key={index}
                  style={{
                    padding: `${spacing[3]} 0`,
                    borderBottom:
                      index < needsAttention.length - 1
                        ? `1px solid ${colors.border.subtle}`
                        : undefined,
                  }}
                >
                  <Row>
                    <Column style={{ width: "48px", verticalAlign: "middle" }}>
                      {member.photoUrl ? (
                        <Img
                          src={member.photoUrl}
                          alt={member.name}
                          width={40}
                          height={40}
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Section
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            backgroundColor: colors.background.muted,
                            textAlign: "center",
                            lineHeight: "40px",
                          }}
                        >
                          <Text
                            style={{
                              margin: 0,
                              fontFamily: typography.fontFamily.body,
                              fontSize: typography.fontSize.lg,
                              fontWeight: typography.fontWeight.semibold,
                              color: colors.text.muted,
                              lineHeight: "40px",
                            }}
                          >
                            {member.name.charAt(0).toUpperCase()}
                          </Text>
                        </Section>
                      )}
                    </Column>
                    <Column style={{ verticalAlign: "middle" }}>
                      <Text
                        style={{
                          margin: 0,
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.medium,
                          color: colors.text.primary,
                        }}
                      >
                        {member.name}
                      </Text>
                      <Text
                        style={{
                          margin: 0,
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.xs,
                          color: colors.text.muted,
                        }}
                      >
                        {member.reviewsCount} reviews this week
                        {member.daysWithoutActivity > 14 && (
                          <> &bull; {member.daysWithoutActivity} days inactive</>
                        )}
                      </Text>
                    </Column>
                    <Column
                      style={{
                        width: "80px",
                        textAlign: "right",
                        verticalAlign: "middle",
                      }}
                    >
                      <Badge variant="error">Low Activity</Badge>
                    </Column>
                  </Row>
                </Section>
              ))}
            </EmailCard>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Team NPS */}
      {teamNpsScore !== null && (
        <>
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
                    Team NPS Score
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
                        teamNpsScore >= 50
                          ? colors.accent.success
                          : teamNpsScore >= 0
                          ? colors.accent.warning
                          : colors.accent.error,
                    }}
                  >
                    {teamNpsScore}
                  </Text>
                </Column>
              </Row>
            </EmailCard>
          </SingleColumnLayout>
          <Spacer size="md" />
        </>
      )}

      {/* Tips Section */}
      <SingleColumnLayout>
        <InfoCard type="tip" title="Manager Tips">
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
            }}
          >
            {hasNeedsAttention ? (
              <>
                Consider reaching out to team members with low activity.
                Personal check-ins can help identify blockers and boost
                engagement.
              </>
            ) : pendingApprovals > 0 ? (
              <>
                You have pending approvals. Quick review turnaround helps
                maintain team momentum and customer engagement.
              </>
            ) : (
              <>
                Great job keeping the team on track! Consider sharing the top
                performers&apos; strategies with the rest of the team.
              </>
            )}
          </Text>
        </InfoCard>
      </SingleColumnLayout>

      <Spacer size="lg" />

      {/* CTA */}
      <SingleColumnLayout center>
        <EmailButton href={`${dashboardUrl}/team`} variant="primary" size="lg">
          View Team Dashboard
        </EmailButton>
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}

export default WeeklySummaryManagerEmail;
