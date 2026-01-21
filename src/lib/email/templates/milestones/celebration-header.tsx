/**
 * Celebration Header Component
 *
 * Shared celebratory header for milestone emails with confetti-style design.
 * Uses emoji and styled text to create a festive, congratulatory feel.
 */

import * as React from "react";
import { Section, Text } from "@react-email/components";
import { colors, typography, spacing } from "../../components";

interface CelebrationHeaderProps {
  title: string;
  subtitle?: string;
  emoji?: string;
  badgeTier?: "bronze" | "silver" | "gold" | "platinum";
}

// Badge tier colors for visual distinction
const tierColors = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

export function CelebrationHeader({
  title,
  subtitle,
  emoji = "🎉",
  badgeTier,
}: CelebrationHeaderProps) {
  const accentColor = badgeTier ? tierColors[badgeTier] : colors.primary;

  return (
    <Section
      style={{
        textAlign: "center",
        padding: `${spacing[8]} ${spacing[4]}`,
        background: `linear-gradient(135deg, ${colors.background.subtle} 0%, ${colors.background.white} 100%)`,
        borderBottom: `3px solid ${accentColor}`,
      }}
    >
      {/* Celebration emoji */}
      <Text
        style={{
          margin: 0,
          fontSize: "48px",
          lineHeight: "1",
          marginBottom: spacing[4],
        }}
      >
        {emoji}
      </Text>

      {/* Title */}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize["3xl"],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          lineHeight: typography.lineHeight.tight,
          marginBottom: subtitle ? spacing[2] : 0,
        }}
      >
        {title}
      </Text>

      {/* Subtitle */}
      {subtitle && (
        <Text
          style={{
            margin: 0,
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
            lineHeight: typography.lineHeight.normal,
          }}
        >
          {subtitle}
        </Text>
      )}
    </Section>
  );
}
