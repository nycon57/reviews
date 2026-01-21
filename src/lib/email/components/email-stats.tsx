import * as React from "react";
import { Section, Text, Row, Column, Img } from "@react-email/components";
import { colors, typography, spacing, layout } from "../theme";

// =============================================================================
// STAT ITEM COMPONENT
// =============================================================================

export interface StatItemProps {
  /** Stat value (number or formatted string) */
  value: string | number;
  /** Stat label */
  label: string;
  /** Trend indicator */
  trend?: {
    direction: "up" | "down" | "neutral";
    value: string;
  };
  /** Icon URL */
  iconUrl?: string;
  /** Value color */
  valueColor?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Single stat item with value, label, and optional trend.
 */
export function StatItem({
  value,
  label,
  trend,
  iconUrl,
  valueColor = colors.repwell.teal[400],
  size = "md",
}: StatItemProps) {
  const sizeConfig = {
    sm: {
      valueFontSize: typography.fontSize.xl,
      labelFontSize: typography.fontSize.xs,
      trendFontSize: typography.fontSize.xs,
      iconSize: "20px",
    },
    md: {
      valueFontSize: typography.fontSize["2xl"],
      labelFontSize: typography.fontSize.sm,
      trendFontSize: typography.fontSize.xs,
      iconSize: "24px",
    },
    lg: {
      valueFontSize: typography.fontSize["4xl"],
      labelFontSize: typography.fontSize.base,
      trendFontSize: typography.fontSize.sm,
      iconSize: "32px",
    },
  };

  const config = sizeConfig[size];

  const trendColors = {
    up: colors.accent.success,
    down: colors.accent.error,
    neutral: colors.text.muted,
  };

  const trendIcons = {
    up: "↑",
    down: "↓",
    neutral: "→",
  };

  return (
    <Section style={{ textAlign: "center" }}>
      {iconUrl && (
        <Img
          src={iconUrl}
          alt=""
          width={config.iconSize}
          height={config.iconSize}
          style={{
            width: config.iconSize,
            height: config.iconSize,
            margin: `0 auto ${spacing[2]}`,
            display: "block",
          }}
        />
      )}
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.display,
          fontSize: config.valueFontSize,
          fontWeight: typography.fontWeight.bold,
          color: valueColor,
          lineHeight: typography.lineHeight.tight,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          margin: `${spacing[1]} 0 0 0`,
          fontFamily: typography.fontFamily.body,
          fontSize: config.labelFontSize,
          color: colors.text.muted,
        }}
      >
        {label}
      </Text>
      {trend && (
        <Text
          style={{
            margin: `${spacing[1]} 0 0 0`,
            fontFamily: typography.fontFamily.body,
            fontSize: config.trendFontSize,
            fontWeight: typography.fontWeight.medium,
            color: trendColors[trend.direction],
          }}
        >
          {trendIcons[trend.direction]} {trend.value}
        </Text>
      )}
    </Section>
  );
}

// =============================================================================
// STATS ROW COMPONENT
// =============================================================================

export interface StatsRowProps {
  /** Array of stats to display */
  stats: Array<{
    value: string | number;
    label: string;
    trend?: { direction: "up" | "down" | "neutral"; value: string };
    valueColor?: string;
  }>;
  /** Number of columns */
  columns?: 2 | 3 | 4;
  /** Background color */
  backgroundColor?: string;
  /** Show dividers between stats */
  showDividers?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Row of stats displayed in columns.
 * Useful for dashboard summaries and metrics displays.
 */
export function StatsRow({
  stats,
  columns = 3,
  backgroundColor = colors.background.subtle,
  showDividers = true,
  size = "md",
}: StatsRowProps) {
  const columnWidth = `${100 / columns}%`;

  return (
    <Section
      style={{
        padding: spacing[6],
        backgroundColor,
        borderRadius: layout.borderRadius.lg,
      }}
    >
      <Row>
        {stats.slice(0, columns).map((stat, index) => (
          <React.Fragment key={index}>
            <Column
              style={{
                width: columnWidth,
                verticalAlign: "top",
              }}
            >
              <StatItem
                value={stat.value}
                label={stat.label}
                trend={stat.trend}
                valueColor={stat.valueColor}
                size={size}
              />
            </Column>
            {showDividers && index < stats.length - 1 && index < columns - 1 && (
              <Column
                style={{
                  width: "1px",
                  backgroundColor: colors.border.default,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </Row>
    </Section>
  );
}

// =============================================================================
// STATS CARD COMPONENT
// =============================================================================

export interface StatsCardProps {
  /** Card title */
  title?: string;
  /** Array of stats */
  stats: Array<{
    value: string | number;
    label: string;
    trend?: { direction: "up" | "down" | "neutral"; value: string };
    valueColor?: string;
  }>;
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Show accent bar */
  showAccentBar?: boolean;
}

/**
 * Card containing stats with optional title.
 * Can display stats horizontally or vertically.
 */
export function StatsCard({
  title,
  stats,
  layout: layoutDirection = "horizontal",
  showAccentBar = true,
}: StatsCardProps) {
  return (
    <Section
      style={{
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.lg,
        overflow: "hidden",
      }}
    >
      {/* Accent bar */}
      {showAccentBar && (
        <Section
          style={{
            height: "4px",
            background: `linear-gradient(to right, ${colors.repwell.teal[300]}, ${colors.repwell.sage[200]})`,
          }}
        />
      )}

      {/* Content */}
      <Section style={{ padding: spacing[6] }}>
        {title && (
          <Text
            style={{
              margin: `0 0 ${spacing[4]} 0`,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.repwell.teal[400],
            }}
          >
            {title}
          </Text>
        )}

        {layoutDirection === "horizontal" ? (
          <Row>
            {stats.map((stat, index) => (
              <Column
                key={index}
                style={{
                  width: `${100 / stats.length}%`,
                  textAlign: "center",
                  borderRight:
                    index < stats.length - 1
                      ? `1px solid ${colors.border.subtle}`
                      : undefined,
                }}
              >
                <StatItem
                  value={stat.value}
                  label={stat.label}
                  trend={stat.trend}
                  valueColor={stat.valueColor}
                  size="sm"
                />
              </Column>
            ))}
          </Row>
        ) : (
          <>
            {stats.map((stat, index) => (
              <Section
                key={index}
                style={{
                  paddingTop: index > 0 ? spacing[3] : 0,
                  paddingBottom: index < stats.length - 1 ? spacing[3] : 0,
                  borderBottom:
                    index < stats.length - 1
                      ? `1px solid ${colors.border.subtle}`
                      : undefined,
                }}
              >
                <Row>
                  <Column style={{ width: "60%" }}>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.sm,
                        color: colors.text.muted,
                      }}
                    >
                      {stat.label}
                    </Text>
                  </Column>
                  <Column style={{ width: "40%", textAlign: "right" }}>
                    <Text
                      style={{
                        margin: 0,
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.fontSize.base,
                        fontWeight: typography.fontWeight.semibold,
                        color: stat.valueColor || colors.repwell.teal[400],
                      }}
                    >
                      {stat.value}
                    </Text>
                    {stat.trend && (
                      <Text
                        style={{
                          margin: 0,
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.fontSize.xs,
                          color:
                            stat.trend.direction === "up"
                              ? colors.accent.success
                              : stat.trend.direction === "down"
                              ? colors.accent.error
                              : colors.text.muted,
                        }}
                      >
                        {stat.trend.direction === "up" ? "↑" : stat.trend.direction === "down" ? "↓" : "→"} {stat.trend.value}
                      </Text>
                    )}
                  </Column>
                </Row>
              </Section>
            ))}
          </>
        )}
      </Section>
    </Section>
  );
}

// =============================================================================
// PROGRESS BAR COMPONENT
// =============================================================================

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Label text */
  label?: string;
  /** Show percentage value */
  showValue?: boolean;
  /** Bar color */
  color?: string;
  /** Background color */
  backgroundColor?: string;
  /** Height of the bar */
  height?: string;
}

/**
 * Progress bar component for showing completion or metrics.
 */
export function ProgressBar({
  value,
  label,
  showValue = true,
  color = colors.primary,
  backgroundColor = colors.background.muted,
  height = "8px",
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <Section>
      {(label || showValue) && (
        <Row style={{ marginBottom: spacing[2] }}>
          {label && (
            <Column>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                }}
              >
                {label}
              </Text>
            </Column>
          )}
          {showValue && (
            <Column style={{ textAlign: "right" }}>
              <Text
                style={{
                  margin: 0,
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.fontSize.sm,
                  fontWeight: typography.fontWeight.medium,
                  color: colors.text.primary,
                }}
              >
                {clampedValue}%
              </Text>
            </Column>
          )}
        </Row>
      )}
      {/* Progress bar container */}
      <Section
        style={{
          backgroundColor,
          borderRadius: layout.borderRadius.full,
          overflow: "hidden",
          height,
        }}
      >
        {/* Progress bar fill */}
        <Section
          style={{
            backgroundColor: color,
            width: `${clampedValue}%`,
            height,
            borderRadius: layout.borderRadius.full,
          }}
        />
      </Section>
    </Section>
  );
}

// =============================================================================
// METRIC COMPARISON COMPONENT
// =============================================================================

export interface MetricComparisonProps {
  /** Metric label */
  label: string;
  /** Current value */
  current: string | number;
  /** Previous value */
  previous: string | number;
  /** Change value */
  change?: string;
  /** Change direction */
  changeDirection?: "up" | "down" | "neutral";
  /** Is increase positive? */
  positiveIsGood?: boolean;
}

/**
 * Metric comparison showing current vs previous values.
 */
export function MetricComparison({
  label,
  current,
  previous,
  change,
  changeDirection = "neutral",
  positiveIsGood = true,
}: MetricComparisonProps) {
  const isPositive = changeDirection === "up";
  const changeColor = positiveIsGood
    ? isPositive
      ? colors.accent.success
      : changeDirection === "down"
      ? colors.accent.error
      : colors.text.muted
    : isPositive
    ? colors.accent.error
    : changeDirection === "down"
    ? colors.accent.success
    : colors.text.muted;

  return (
    <Section
      style={{
        padding: spacing[4],
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.md,
      }}
    >
      <Text
        style={{
          margin: 0,
          fontFamily: typography.fontFamily.body,
          fontSize: typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
          color: colors.text.muted,
          textTransform: "uppercase",
          letterSpacing: typography.letterSpacing.wide,
        }}
      >
        {label}
      </Text>

      <Row style={{ marginTop: spacing[2] }}>
        <Column style={{ width: "50%" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize["2xl"],
              fontWeight: typography.fontWeight.bold,
              color: colors.repwell.teal[400],
            }}
          >
            {current}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xs,
              color: colors.text.subtle,
            }}
          >
            Current
          </Text>
        </Column>
        <Column style={{ width: "50%", textAlign: "right" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.lg,
              color: colors.text.muted,
            }}
          >
            {previous}
          </Text>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.xs,
              color: colors.text.subtle,
            }}
          >
            Previous
          </Text>
        </Column>
      </Row>

      {change && (
        <Section
          style={{
            marginTop: spacing[3],
            paddingTop: spacing[2],
            borderTop: `1px solid ${colors.border.subtle}`,
          }}
        >
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.medium,
              color: changeColor,
            }}
          >
            {changeDirection === "up" ? "↑" : changeDirection === "down" ? "↓" : "→"} {change}
          </Text>
        </Section>
      )}
    </Section>
  );
}

// =============================================================================
// LEADERBOARD ITEM COMPONENT
// =============================================================================

export interface LeaderboardItemProps {
  /** Rank position */
  rank: number;
  /** Name */
  name: string;
  /** Score or value */
  value: string | number;
  /** Photo URL */
  photoUrl?: string;
  /** Change from previous rank */
  rankChange?: number;
  /** Highlight this item */
  highlight?: boolean;
}

/**
 * Single leaderboard item with rank, name, and score.
 */
export function LeaderboardItem({
  rank,
  name,
  value,
  photoUrl,
  rankChange,
  highlight = false,
}: LeaderboardItemProps) {
  const getRankColor = (r: number) => {
    if (r === 1) return "#ffd700"; // Gold
    if (r === 2) return "#c0c0c0"; // Silver
    if (r === 3) return "#cd7f32"; // Bronze
    return colors.text.muted;
  };

  return (
    <Section
      style={{
        padding: spacing[3],
        backgroundColor: highlight ? colors.repwell.sage[100] : "transparent",
        borderRadius: layout.borderRadius.md,
      }}
    >
      <Row>
        {/* Rank */}
        <Column style={{ width: "40px", verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.display,
              fontSize: rank <= 3 ? typography.fontSize.lg : typography.fontSize.base,
              fontWeight: typography.fontWeight.bold,
              color: getRankColor(rank),
              textAlign: "center",
            }}
          >
            {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
          </Text>
        </Column>

        {/* Photo */}
        {photoUrl && (
          <Column style={{ width: "40px", verticalAlign: "middle", paddingRight: spacing[2] }}>
            <Img
              src={photoUrl}
              alt={name}
              width="32"
              height="32"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          </Column>
        )}

        {/* Name */}
        <Column style={{ verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: highlight ? typography.fontWeight.semibold : typography.fontWeight.medium,
              color: colors.text.primary,
            }}
          >
            {name}
          </Text>
        </Column>

        {/* Value and rank change */}
        <Column style={{ textAlign: "right", verticalAlign: "middle" }}>
          <Text
            style={{
              margin: 0,
              fontFamily: typography.fontFamily.body,
              fontSize: typography.fontSize.sm,
              fontWeight: typography.fontWeight.semibold,
              color: colors.repwell.teal[400],
            }}
          >
            {value}
          </Text>
          {rankChange !== undefined && rankChange !== 0 && (
            <Text
              style={{
                margin: 0,
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.xs,
                color: rankChange > 0 ? colors.accent.success : colors.accent.error,
              }}
            >
              {rankChange > 0 ? `↑${rankChange}` : `↓${Math.abs(rankChange)}`}
            </Text>
          )}
        </Column>
      </Row>
    </Section>
  );
}

// =============================================================================
// LEADERBOARD COMPONENT
// =============================================================================

export interface LeaderboardProps {
  /** Leaderboard title */
  title?: string;
  /** Array of leaderboard entries */
  entries: Array<{
    rank: number;
    name: string;
    value: string | number;
    photoUrl?: string;
    rankChange?: number;
    highlight?: boolean;
  }>;
  /** Show accent bar */
  showAccentBar?: boolean;
}

/**
 * Full leaderboard component with multiple entries.
 */
export function Leaderboard({ title, entries, showAccentBar = true }: LeaderboardProps) {
  return (
    <Section
      style={{
        backgroundColor: colors.background.white,
        border: `1px solid ${colors.border.default}`,
        borderRadius: layout.borderRadius.lg,
        overflow: "hidden",
      }}
    >
      {showAccentBar && (
        <Section
          style={{
            height: "4px",
            background: `linear-gradient(to right, ${colors.repwell.teal[300]}, ${colors.repwell.sage[200]})`,
          }}
        />
      )}

      <Section style={{ padding: spacing[4] }}>
        {title && (
          <Text
            style={{
              margin: `0 0 ${spacing[3]} 0`,
              fontFamily: typography.fontFamily.display,
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.repwell.teal[400],
            }}
          >
            {title}
          </Text>
        )}

        {entries.map((entry, index) => (
          <Section
            key={index}
            style={{
              borderTop: index > 0 ? `1px solid ${colors.border.subtle}` : undefined,
            }}
          >
            <LeaderboardItem {...entry} />
          </Section>
        ))}
      </Section>
    </Section>
  );
}
