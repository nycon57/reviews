/**
 * LeaderboardCelebration Composition
 *
 * Animated celebration video for leaderboard achievements:
 * - New #1 ranking with confetti
 * - Weekly highlight reels
 * - Badge earned animations
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  random,
} from "remotion";
import type { LeaderboardCelebrationProps, LeaderboardEntry } from "../types";
import { REPWELL_COLORS } from "../types";
import { withOpacity, generateGradient } from "../utils/colors";
import { CounterAnimation } from "../components/CounterAnimation";

export const LeaderboardCelebration: React.FC<LeaderboardCelebrationProps> = ({
  celebrationType,
  winner,
  organization,
  topFive,
  period,
  badge,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Background gradient
  const bgGradient = generateGradient(
    organization.primaryColor || REPWELL_COLORS.teal[400],
    organization.secondaryColor || REPWELL_COLORS.sage[200],
    135
  );

  return (
    <AbsoluteFill style={{ background: bgGradient }}>
      {/* Confetti for celebrations */}
      {(celebrationType === "new_first_place" || celebrationType === "badge_earned") && (
        <Confetti frame={frame} fps={fps} width={width} height={height} />
      )}

      {/* Content based on celebration type */}
      {celebrationType === "new_first_place" && (
        <NewFirstPlaceContent
          winner={winner}
          period={period}
          frame={frame}
          fps={fps}
        />
      )}

      {celebrationType === "weekly_highlights" && (
        <WeeklyHighlightsContent
          topFive={topFive}
          period={period}
          frame={frame}
          fps={fps}
        />
      )}

      {celebrationType === "badge_earned" && badge && (
        <BadgeEarnedContent
          winner={winner}
          badge={badge}
          frame={frame}
          fps={fps}
        />
      )}

      {/* Powered by badge */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: 0.5,
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 11,
          color: REPWELL_COLORS.white,
        }}
      >
        Powered by <span style={{ fontWeight: 600 }}>RepWell</span>
      </div>
    </AbsoluteFill>
  );
};

/**
 * Confetti animation
 */
const Confetti: React.FC<{
  frame: number;
  fps: number;
  width: number;
  height: number;
}> = ({ frame, fps, width, height }) => {
  const confettiCount = 50;
  const colors = [
    "#FFD700",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    REPWELL_COLORS.sage[200],
    REPWELL_COLORS.teal[300],
  ];

  // Fade in confetti
  const opacity = interpolate(frame, [0, fps * 0.5, fps * 5, fps * 6], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });

  const confetti = Array.from({ length: confettiCount }, (_, i) => {
    const seed = `confetti-${i}`;
    const x = random(seed + "x") * width;
    const startY = -50 - random(seed + "startY") * 100;
    const fallSpeed = 2 + random(seed + "speed") * 3;
    const rotation = random(seed + "rot") * 360;
    const rotationSpeed = (random(seed + "rotSpeed") - 0.5) * 10;
    const color = colors[Math.floor(random(seed + "color") * colors.length)];
    const size = 8 + random(seed + "size") * 8;
    const shape = random(seed + "shape") > 0.5 ? "square" : "circle";

    const y = startY + frame * fallSpeed;
    const currentRotation = rotation + frame * rotationSpeed;

    if (y > height + 50) return null;

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: size,
          height: shape === "square" ? size : size * 0.6,
          backgroundColor: color,
          borderRadius: shape === "circle" ? "50%" : "2px",
          transform: `rotate(${currentRotation}deg)`,
          opacity: opacity * 0.8,
        }}
      />
    );
  });

  return <>{confetti}</>;
};

/**
 * New #1 ranking celebration content
 */
const NewFirstPlaceContent: React.FC<{
  winner: LeaderboardCelebrationProps["winner"];
  period: string;
  frame: number;
  fps: number;
}> = ({ winner, period, frame, fps }) => {
  // Animation timings
  const titleStart = fps * 0.5;
  const winnerStart = fps * 1.2;
  const scoreStart = fps * 2;
  const rankChangeStart = fps * 2.8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px",
        zIndex: 1,
      }}
    >
      {/* Title */}
      <AnimatedText
        text="🏆 NEW #1 RANKING!"
        startFrame={titleStart}
        frame={frame}
        fps={fps}
        fontSize={48}
        fontWeight={700}
      />

      <div style={{ height: 16 }} />

      {/* Period */}
      <AnimatedText
        text={period}
        startFrame={titleStart + fps * 0.2}
        frame={frame}
        fps={fps}
        fontSize={20}
        fontWeight={500}
        opacity={0.8}
      />

      <div style={{ height: 40 }} />

      {/* Winner photo and name */}
      <WinnerCard winner={winner} startFrame={winnerStart} frame={frame} fps={fps} />

      <div style={{ height: 32 }} />

      {/* Score */}
      <CounterAnimation
        value={winner.score}
        startFrame={scoreStart}
        durationFrames={fps * 1.5}
        suffix=" pts"
        fontSize={64}
        color={REPWELL_COLORS.white}
        fontFamily="display"
      />

      <div style={{ height: 24 }} />

      {/* Rank change */}
      <RankChangeIndicator
        previousRank={winner.previousRank}
        newRank={winner.newRank}
        startFrame={rankChangeStart}
        frame={frame}
        fps={fps}
      />
    </div>
  );
};

/**
 * Weekly highlights content
 */
const WeeklyHighlightsContent: React.FC<{
  topFive: LeaderboardEntry[];
  period: string;
  frame: number;
  fps: number;
}> = ({ topFive, period, frame, fps }) => {
  const titleStart = fps * 0.5;
  const listStart = fps * 1;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px",
        zIndex: 1,
      }}
    >
      {/* Title */}
      <AnimatedText
        text="🌟 TOP PERFORMERS"
        startFrame={titleStart}
        frame={frame}
        fps={fps}
        fontSize={40}
        fontWeight={700}
      />

      <AnimatedText
        text={period}
        startFrame={titleStart + fps * 0.2}
        frame={frame}
        fps={fps}
        fontSize={18}
        fontWeight={500}
        opacity={0.8}
      />

      <div style={{ height: 40 }} />

      {/* Leaderboard list */}
      <div style={{ width: "100%", maxWidth: 500 }}>
        {topFive.map((entry, index) => (
          <LeaderboardRow
            key={index}
            entry={entry}
            rank={index + 1}
            startFrame={listStart + index * fps * 0.3}
            frame={frame}
            fps={fps}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Badge earned content
 */
const BadgeEarnedContent: React.FC<{
  winner: LeaderboardCelebrationProps["winner"];
  badge: NonNullable<LeaderboardCelebrationProps["badge"]>;
  frame: number;
  fps: number;
}> = ({ winner, badge, frame, fps }) => {
  const titleStart = fps * 0.5;
  const badgeStart = fps * 1;
  const winnerStart = fps * 2;
  const descStart = fps * 2.8;

  // Badge scale animation
  const badgeProgress = spring({
    frame: frame - badgeStart,
    fps,
    config: { stiffness: 200, damping: 15 },
    durationInFrames: fps * 0.8,
  });
  const badgeScale = interpolate(badgeProgress, [0, 0.5, 1], [0, 1.2, 1]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px",
        zIndex: 1,
      }}
    >
      {/* Title */}
      <AnimatedText
        text="🎖️ BADGE EARNED!"
        startFrame={titleStart}
        frame={frame}
        fps={fps}
        fontSize={40}
        fontWeight={700}
      />

      <div style={{ height: 32 }} />

      {/* Badge */}
      <div
        style={{
          transform: `scale(${badgeScale})`,
          opacity: interpolate(badgeProgress, [0, 0.3], [0, 1]),
        }}
      >
        {badge.iconUrl ? (
          <Img
            src={badge.iconUrl}
            style={{ width: 120, height: 120, objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: withOpacity(REPWELL_COLORS.white, 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 60,
            }}
          >
            🏅
          </div>
        )}
      </div>

      <div style={{ height: 16 }} />

      {/* Badge name */}
      <AnimatedText
        text={badge.name}
        startFrame={badgeStart + fps * 0.5}
        frame={frame}
        fps={fps}
        fontSize={28}
        fontWeight={600}
      />

      <div style={{ height: 32 }} />

      {/* Winner */}
      <WinnerCard winner={winner} startFrame={winnerStart} frame={frame} fps={fps} compact />

      <div style={{ height: 16 }} />

      {/* Description */}
      <AnimatedText
        text={badge.description}
        startFrame={descStart}
        frame={frame}
        fps={fps}
        fontSize={16}
        fontWeight={400}
        opacity={0.9}
        maxWidth={400}
      />
    </div>
  );
};

// Helper components

const AnimatedText: React.FC<{
  text: string;
  startFrame: number;
  frame: number;
  fps: number;
  fontSize: number;
  fontWeight: number;
  opacity?: number;
  maxWidth?: number;
}> = ({ text, startFrame, frame, fps, fontSize, fontWeight, opacity = 1, maxWidth }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  return (
    <div
      style={{
        opacity: interpolate(progress, [0, 1], [0, opacity]),
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px)`,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize,
        fontWeight,
        color: REPWELL_COLORS.white,
        textAlign: "center",
        maxWidth,
      }}
    >
      {text}
    </div>
  );
};

const WinnerCard: React.FC<{
  winner: LeaderboardCelebrationProps["winner"];
  startFrame: number;
  frame: number;
  fps: number;
  compact?: boolean;
}> = ({ winner, startFrame, frame, fps, compact }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const photoSize = compact ? 64 : 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 8 : 12,
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      {winner.photoUrl ? (
        <Img
          src={winner.photoUrl}
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: "50%",
            objectFit: "cover",
            border: `4px solid ${REPWELL_COLORS.white}`,
          }}
        />
      ) : (
        <div
          style={{
            width: photoSize,
            height: photoSize,
            borderRadius: "50%",
            background: withOpacity(REPWELL_COLORS.white, 0.2),
            border: `4px solid ${REPWELL_COLORS.white}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <UserIcon size={photoSize * 0.5} />
        </div>
      )}
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: compact ? 20 : 28,
          fontWeight: 600,
          color: REPWELL_COLORS.white,
        }}
      >
        {winner.name}
      </div>
    </div>
  );
};

const RankChangeIndicator: React.FC<{
  previousRank: number;
  newRank: number;
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ previousRank, newRank, startFrame, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  const change = previousRank - newRank;

  return (
    <div
      style={{
        opacity: interpolate(progress, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(progress, [0, 1], [15, 0])}px)`,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Source Sans 3', system-ui, sans-serif",
        fontSize: 18,
        color: REPWELL_COLORS.white,
      }}
    >
      <span style={{ opacity: 0.8 }}>#{previousRank}</span>
      <span>→</span>
      <span style={{ fontWeight: 700 }}>#{newRank}</span>
      <span
        style={{
          background: withOpacity(REPWELL_COLORS.white, 0.2),
          padding: "4px 12px",
          borderRadius: 20,
          marginLeft: 8,
        }}
      >
        ↑ {change}
      </span>
    </div>
  );
};

const LeaderboardRow: React.FC<{
  entry: LeaderboardEntry;
  rank: number;
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ entry, rank, startFrame, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.4,
  });

  const translateX = interpolate(progress, [0, 1], [-50, 0]);
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  const isFirst = rank === 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        marginBottom: 8,
        background: withOpacity(REPWELL_COLORS.white, isFirst ? 0.2 : 0.1),
        borderRadius: 12,
        transform: `translateX(${translateX}px)`,
        opacity,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: isFirst ? "#FFD700" : withOpacity(REPWELL_COLORS.white, 0.2),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 14,
          fontWeight: 700,
          color: isFirst ? REPWELL_COLORS.teal[500] : REPWELL_COLORS.white,
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: REPWELL_COLORS.white,
          }}
        >
          {entry.name}
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: REPWELL_COLORS.white,
        }}
      >
        {entry.score}
      </div>
    </div>
  );
};

const UserIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="7"
      r="4"
      stroke={REPWELL_COLORS.white}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default LeaderboardCelebration;
