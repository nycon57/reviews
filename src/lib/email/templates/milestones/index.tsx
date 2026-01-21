/**
 * Milestone & Achievement Email Templates (S081)
 *
 * React Email templates for celebratory milestone notification emails.
 * Uses S073 email design system components.
 */

import { render } from "@react-email/components";

// Template Components - import for use and re-export
import { FirstReviewMilestoneEmail } from "./first-review-milestone";
import { ReviewCountMilestoneEmail } from "./review-count-milestone";
import { First5StarMilestoneEmail } from "./first-5star-milestone";
import { LeaderboardMilestoneEmail } from "./leaderboard-milestone";
import { BadgeEarnedMilestoneEmail } from "./badge-earned-milestone";
import { StreakMilestoneEmail } from "./streak-milestone";
import { VideoMilestoneEmail } from "./video-milestone";

// Shared Components
import { CelebrationHeader } from "./celebration-header";
import { SocialShareCta } from "./social-share-cta";

export {
  FirstReviewMilestoneEmail,
  ReviewCountMilestoneEmail,
  First5StarMilestoneEmail,
  LeaderboardMilestoneEmail,
  BadgeEarnedMilestoneEmail,
  StreakMilestoneEmail,
  VideoMilestoneEmail,
  CelebrationHeader,
  SocialShareCta,
};

// Types
import type {
  FirstReviewMilestoneEmailData,
  ReviewCountMilestoneEmailData,
  First5StarMilestoneEmailData,
  LeaderboardMilestoneEmailData,
  BadgeEarnedMilestoneEmailData,
  StreakMilestoneEmailData,
  VideoMilestoneEmailData,
} from "../../types";

// =============================================================================
// RENDERING FUNCTIONS
// =============================================================================

/**
 * Render First Review Milestone email to HTML
 */
export async function renderFirstReviewMilestoneEmail(
  data: FirstReviewMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `🎉 Congratulations ${data.firstName}! You received your first review!`;
  const html = await render(<FirstReviewMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render Review Count Milestone email to HTML
 */
export async function renderReviewCountMilestoneEmail(
  data: ReviewCountMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `🏆 ${data.firstName}, you've reached ${data.reviewCount} reviews!`;
  const html = await render(<ReviewCountMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render First 5-Star Review Milestone email to HTML
 */
export async function renderFirst5StarMilestoneEmail(
  data: First5StarMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `⭐ Perfect score! Your first 5-star review, ${data.firstName}!`;
  const html = await render(<First5StarMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render Leaderboard Achievement Milestone email to HTML
 */
export async function renderLeaderboardMilestoneEmail(
  data: LeaderboardMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  let emoji = "🏅";
  let achievement = `ranked #${data.currentRank}`;

  if (data.achievementType === "reached_number_1") {
    emoji = "👑";
    achievement = "reached #1";
  } else if (data.achievementType === "reached_top_3") {
    emoji = "🥇";
    achievement = `reached the top 3`;
  }

  const subject = `${emoji} ${data.firstName}, you've ${achievement} on the leaderboard!`;
  const html = await render(<LeaderboardMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render Badge Earned Milestone email to HTML
 */
export async function renderBadgeEarnedMilestoneEmail(
  data: BadgeEarnedMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const tierEmoji =
    data.badgeTier === "platinum"
      ? "💎"
      : data.badgeTier === "gold"
        ? "🏆"
        : data.badgeTier === "silver"
          ? "🥈"
          : "🎖️";
  const subject = `${tierEmoji} Badge unlocked: ${data.badgeName}!`;
  const html = await render(<BadgeEarnedMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render Streak Milestone email to HTML
 */
export async function renderStreakMilestoneEmail(
  data: StreakMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const subject = `🔥 ${data.streakDays}-day streak! Keep it up, ${data.firstName}!`;
  const html = await render(<StreakMilestoneEmail data={data} />);
  return { subject, html };
}

/**
 * Render Video Testimonial Milestone email to HTML
 */
export async function renderVideoMilestoneEmail(
  data: VideoMilestoneEmailData
): Promise<{ subject: string; html: string }> {
  const subject =
    data.videoCount === 1
      ? `🎬 Your first video testimonial, ${data.firstName}!`
      : `🎬 ${data.firstName}, you've collected ${data.videoCount} video testimonials!`;
  const html = await render(<VideoMilestoneEmail data={data} />);
  return { subject, html };
}
