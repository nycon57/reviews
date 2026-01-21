/**
 * NPS Improvement Milestone Email Template
 *
 * Celebratory email sent when a user's Net Promoter Score improves significantly.
 * Shows score change, category, and comparison to industry benchmark.
 */

import * as React from "react";
import { Section, Text, Row, Column } from "@react-email/components";
import {
  EmailLayout,
  SingleColumnLayout,
  RepwellHeader,
  RepwellFooter,
  EmailParagraph,
  PrimaryButton,
  EmailCard,
  Spacer,
  StatsRow,
  colors,
  typography,
  spacing,
} from "../../components";
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";
import type { NpsImprovementMilestoneEmailData } from "../../types";

interface NpsImprovementMilestoneEmailProps {
  data: NpsImprovementMilestoneEmailData;
}

function getNpsColor(nps: number): string {
  if (nps >= 50) return colors.accent.success;
  if (nps >= 0) return colors.accent.warning;
  return colors.accent.error;
}

function getNpsCategoryLabel(category: "promoter" | "passive" | "detractor"): string {
  switch (category) {
    case "promoter":
      return "Promoter Zone";
    case "passive":
      return "Passive Zone";
    case "detractor":
      return "Needs Improvement";
  }
}

function getNpsCategoryEmoji(category: "promoter" | "passive" | "detractor"): string {
  switch (category) {
    case "promoter":
      return "🚀";
    case "passive":
      return "📊";
    case "detractor":
      return "📈";
  }
}

export function NpsImprovementMilestoneEmail({ data }: NpsImprovementMilestoneEmailProps) {
  const {
    firstName,
    previousNps,
    currentNps,
    improvementAmount,
    totalResponses,
    npsCategory,
    industryBenchmark,
    viewAnalyticsUrl,
    socialShareLinks,
    toEmail,
  } = data;

  const npsColor = getNpsColor(currentNps);
  const isAboveBenchmark = industryBenchmark !== undefined && currentNps > industryBenchmark;

  return (
    <EmailLayout
      preview={`${firstName}, your NPS improved by +${improvementAmount} points!`}
    >
      <RepwellHeader />

      <CelebrationHeader
        emoji={getNpsCategoryEmoji(npsCategory)}
        title="NPS Score Improved!"
        subtitle={`+${improvementAmount} Point Increase`}
      />

      <SingleColumnLayout>
        <EmailParagraph>
          Great news, {firstName}! Your Net Promoter Score has improved significantly.
          This means more of your customers are becoming promoters of your services.
        </EmailParagraph>

        {/* NPS Score Card */}
        <EmailCard showAccentBar accentColor={npsColor}>
          <Section style={{ textAlign: "center" }}>
            {/* Current NPS */}
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.display,
                fontSize: "72px",
                fontWeight: typography.fontWeight.bold,
                color: npsColor,
                lineHeight: "1",
              }}
            >
              {currentNps > 0 ? `+${currentNps}` : currentNps}
            </Text>
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                color: colors.text.muted,
                marginTop: spacing[2],
              }}
            >
              Current NPS Score
            </Text>

            <Spacer size="sm" />

            {/* Category Badge */}
            <Section
              style={{
                display: "inline-block",
                padding: `${spacing[2]} ${spacing[4]}`,
                backgroundColor: npsColor + "15",
                borderRadius: "20px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.semibold,
                  color: npsColor,
                }}
              >
                {getNpsCategoryLabel(npsCategory)}
              </Text>
            </Section>
          </Section>

          <Spacer size="md" />

          {/* Before/After - using Row/Column for email client compatibility */}
          <Row>
            <Column style={{ width: "40%", textAlign: "center", verticalAlign: "middle" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                Previous
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.text.secondary,
                }}
              >
                {previousNps > 0 ? `+${previousNps}` : previousNps}
              </Text>
            </Column>

            <Column style={{ width: "20%", textAlign: "center", verticalAlign: "middle" }}>
              <Text
                style={{
                  margin: 0,
                  fontSize: "24px",
                }}
              >
                →
              </Text>
            </Column>

            <Column style={{ width: "40%", textAlign: "center", verticalAlign: "middle" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.muted,
                }}
              >
                Current
              </Text>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.display,
                  fontSize: typography.fontSize["2xl"],
                  fontWeight: typography.fontWeight.bold,
                  color: npsColor,
                }}
              >
                {currentNps > 0 ? `+${currentNps}` : currentNps}
              </Text>
            </Column>
          </Row>

          <Spacer size="md" />

          {/* Improvement Badge */}
          <Section
            style={{
              padding: spacing[3],
              backgroundColor: colors.accent.success + "15",
              borderRadius: "8px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.accent.success,
              }}
            >
              +{improvementAmount} Points Improvement
            </Text>
          </Section>
        </EmailCard>

        <Spacer size="md" />

        {/* Stats */}
        <StatsRow
          stats={[
            {
              label: "Total Responses",
              value: totalResponses.toString(),
            },
            ...(industryBenchmark !== undefined
              ? [
                  {
                    label: "Industry Benchmark",
                    value: `${industryBenchmark > 0 ? "+" : ""}${industryBenchmark}`,
                  },
                ]
              : []),
            ...(isAboveBenchmark
              ? [
                  {
                    label: "Status",
                    value: "Above Benchmark",
                  },
                ]
              : []),
          ]}
        />

        <Spacer size="md" />

        {/* NPS Explanation */}
        <EmailCard>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}
          >
            What does NPS mean?
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
            }}
          >
            Net Promoter Score measures customer loyalty. Scores range from -100 to +100:
            <br />
            • <strong>70+</strong>: World-class
            <br />
            • <strong>50-69</strong>: Excellent
            <br />
            • <strong>0-49</strong>: Good
            <br />
            • <strong>Below 0</strong>: Needs improvement
          </Text>
        </EmailCard>

        <Spacer size="md" />

        {/* CTA */}
        <Section style={{ textAlign: "center" }}>
          <PrimaryButton href={viewAnalyticsUrl}>View NPS Analytics</PrimaryButton>
        </Section>

        {/* Social Share */}
        <SocialShareCta
          message="Share your NPS improvement with your network!"
          socialShareLinks={socialShareLinks}
        />
      </SingleColumnLayout>

      <Spacer size="lg" />

      <RepwellFooter email={toEmail} />
    </EmailLayout>
  );
}
