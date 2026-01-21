/**
 * ReportSummary Composition
 *
 * Animated report video featuring:
 * - Key metrics with counter animations
 * - Animated pie chart for sentiment
 * - Top performer highlight
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  Img,
  interpolate,
  spring,
} from "remotion";
import type { ReportSummaryProps } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, lightenColor } from "../utils/colors";
import { CounterAnimation, LabeledCounter } from "../components/CounterAnimation";

export const ReportSummary: React.FC<ReportSummaryProps> = ({
  period,
  organization,
  metrics,
  sentimentBreakdown,
  topPerformer,
  teamHighlights,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Animation timings
  const titleStart = fps * 0.3;
  const npsStart = fps * 1.5;
  const metricsStart = fps * 4;
  const sentimentStart = fps * 7;
  const performerStart = fps * 10;
  const outroStart = durationInFrames - fps * 2;

  // Background
  const bgColor = lightenColor(REPWELL_COLORS.sage[100], 30);

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      {/* Header with period */}
      <Sequence from={0} durationInFrames={outroStart} name="Header">
        <ReportHeader
          period={period}
          organization={organization}
          startFrame={titleStart}
          frame={frame}
          fps={fps}
        />
      </Sequence>

      {/* NPS Score Section */}
      <Sequence from={npsStart} durationInFrames={fps * 4} name="NPS">
        <MetricSection title="NPS Score">
          <CounterAnimation
            value={metrics.npsScore}
            startFrame={0}
            durationFrames={fps * 2}
            fontSize={120}
            color={getNpsColor(metrics.npsScore)}
            fontFamily="display"
            showChange={true}
            previousValue={metrics.npsPrevious}
          />
        </MetricSection>
      </Sequence>

      {/* Metrics Grid Section */}
      <Sequence from={metricsStart} durationInFrames={fps * 3} name="Metrics">
        <MetricsGridSection metrics={metrics} fps={fps} />
      </Sequence>

      {/* Sentiment Breakdown */}
      <Sequence from={sentimentStart} durationInFrames={fps * 3} name="Sentiment">
        <SentimentSection breakdown={sentimentBreakdown} fps={fps} />
      </Sequence>

      {/* Top Performer */}
      <Sequence from={performerStart} durationInFrames={fps * 3} name="TopPerformer">
        <TopPerformerSection performer={topPerformer} fps={fps} />
      </Sequence>

      {/* Powered by badge */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          right: 24,
          opacity: 0.4,
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 12,
          color: REPWELL_COLORS.teal[400],
        }}
      >
        Powered by <span style={{ fontWeight: 600 }}>RepWell</span>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Report header with title and organization
 */
const ReportHeader: React.FC<{
  period: string;
  organization: { name: string; logoUrl: string | null };
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ period, organization, startFrame, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top: 40,
        left: 60,
        right: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: "'Erstoria', Georgia, serif",
            fontSize: 36,
            fontWeight: 700,
            color: REPWELL_COLORS.teal[500],
          }}
        >
          Performance Report
        </div>
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 18,
            color: REPWELL_COLORS.teal[400],
            marginTop: 4,
          }}
        >
          {period}
        </div>
      </div>

      {organization.logoUrl ? (
        <Img
          src={organization.logoUrl}
          style={{ height: 48, width: "auto", objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: REPWELL_COLORS.teal[400],
          }}
        >
          {organization.name}
        </div>
      )}
    </div>
  );
};

/**
 * Generic metric section wrapper
 */
const MetricSection: React.FC<{
  title?: string;
  children: React.ReactNode;
}> = ({ title, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 60px 60px",
        opacity,
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: REPWELL_COLORS.teal[400],
            marginBottom: 16,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </AbsoluteFill>
  );
};

/**
 * Metrics grid section
 */
const MetricsGridSection: React.FC<{
  metrics: ReportSummaryProps["metrics"];
  fps: number;
}> = ({ metrics, fps }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 60px 60px",
        opacity,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 60,
          maxWidth: 900,
        }}
      >
        <LabeledCounter
          value={metrics.totalReviews}
          startFrame={fps * 0.2}
          durationFrames={fps * 1.5}
          fontSize={56}
          color={REPWELL_COLORS.teal[300]}
          label="Total Reviews"
          showChange={true}
          previousValue={metrics.reviewsPrevious}
        />
        <LabeledCounter
          value={metrics.averageRating}
          startFrame={fps * 0.4}
          durationFrames={fps * 1.5}
          decimals={1}
          fontSize={56}
          color={REPWELL_COLORS.teal[300]}
          label="Average Rating"
          suffix="★"
          showChange={true}
          previousValue={metrics.ratingPrevious}
        />
        <LabeledCounter
          value={metrics.responseRate}
          startFrame={fps * 0.6}
          durationFrames={fps * 1.5}
          fontSize={56}
          color={REPWELL_COLORS.teal[300]}
          label="Response Rate"
          suffix="%"
          showChange={true}
          previousValue={metrics.responseRatePrevious}
        />
      </div>
    </AbsoluteFill>
  );
};

/**
 * Sentiment breakdown section with animated pie chart
 */
const SentimentSection: React.FC<{
  breakdown: ReportSummaryProps["sentimentBreakdown"];
  fps: number;
}> = ({ breakdown, fps }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Pie chart animation
  const pieProgress = interpolate(frame, [fps * 0.3, fps * 1.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const total = breakdown.positive + breakdown.neutral + breakdown.negative;
  const positiveAngle = (breakdown.positive / total) * 360 * pieProgress;
  const neutralAngle = (breakdown.neutral / total) * 360 * pieProgress;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 80,
        padding: "120px 60px 60px",
        opacity,
      }}
    >
      {/* Pie chart */}
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          {/* Positive segment */}
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={REPWELL_COLORS.sage[200]}
            strokeWidth={40}
            strokeDasharray={`${(positiveAngle / 360) * 502.65} 502.65`}
            transform="rotate(-90 100 100)"
          />
          {/* Neutral segment */}
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={REPWELL_COLORS.teal[300]}
            strokeWidth={40}
            strokeDasharray={`${(neutralAngle / 360) * 502.65} 502.65`}
            strokeDashoffset={`-${(positiveAngle / 360) * 502.65}`}
            transform="rotate(-90 100 100)"
          />
          {/* Negative segment */}
          <circle
            cx={100}
            cy={100}
            r={80}
            fill="none"
            stroke={REPWELL_COLORS.accent.error}
            strokeWidth={40}
            strokeDasharray={`${((360 - positiveAngle - neutralAngle) / 360) * 502.65} 502.65`}
            strokeDashoffset={`-${((positiveAngle + neutralAngle) / 360) * 502.65}`}
            transform="rotate(-90 100 100)"
          />
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <SentimentLegendItem
          label="Positive"
          value={breakdown.positive}
          color={REPWELL_COLORS.sage[200]}
          frame={frame}
          fps={fps}
          delay={0}
        />
        <SentimentLegendItem
          label="Neutral"
          value={breakdown.neutral}
          color={REPWELL_COLORS.teal[300]}
          frame={frame}
          fps={fps}
          delay={0.15}
        />
        <SentimentLegendItem
          label="Negative"
          value={breakdown.negative}
          color={REPWELL_COLORS.accent.error}
          frame={frame}
          fps={fps}
          delay={0.3}
        />
      </div>
    </AbsoluteFill>
  );
};

const SentimentLegendItem: React.FC<{
  label: string;
  value: number;
  color: string;
  frame: number;
  fps: number;
  delay: number;
}> = ({ label, value, color, frame, fps, delay }) => {
  const progress = spring({
    frame: frame - fps * (0.5 + delay),
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateX = interpolate(progress, [0, 1], [20, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
        transform: `translateX(${translateX}px)`,
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: color,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 14,
            color: REPWELL_COLORS.teal[400],
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color: REPWELL_COLORS.teal[500],
          }}
        >
          {value}%
        </div>
      </div>
    </div>
  );
};

/**
 * Top performer section
 */
const TopPerformerSection: React.FC<{
  performer: ReportSummaryProps["topPerformer"];
  fps: number;
}> = ({ performer, fps }) => {
  const frame = useCurrentFrame();

  const progress = spring({
    frame: frame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.6,
  });

  const scale = interpolate(progress, [0, 1], [0.9, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 60px 60px",
      }}
    >
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: REPWELL_COLORS.teal[400],
          marginBottom: 24,
          opacity,
        }}
      >
        🏆 Top Performer
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {performer.photoUrl ? (
          <Img
            src={performer.photoUrl}
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              objectFit: "cover",
              border: `4px solid ${REPWELL_COLORS.sage[200]}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: REPWELL_COLORS.sage[100],
              border: `4px solid ${REPWELL_COLORS.sage[200]}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width={50} height={50} viewBox="0 0 24 24" fill="none">
              <path
                d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                stroke={REPWELL_COLORS.teal[300]}
                strokeWidth="2"
              />
              <circle cx="12" cy="7" r="4" stroke={REPWELL_COLORS.teal[300]} strokeWidth="2" />
            </svg>
          </div>
        )}

        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 28,
            fontWeight: 600,
            color: REPWELL_COLORS.teal[500],
          }}
        >
          {performer.name}
        </div>

        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 18,
            color: REPWELL_COLORS.teal[400],
          }}
        >
          Score: <span style={{ fontWeight: 700 }}>{performer.score}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Get color based on NPS score
 */
function getNpsColor(score: number): string {
  if (score >= 70) return REPWELL_COLORS.sage[200];
  if (score >= 30) return REPWELL_COLORS.teal[300];
  return REPWELL_COLORS.accent.warning;
}

export default ReportSummary;
