import { Composition, Still } from "remotion";
import { VideoTestimonial } from "./compositions/VideoTestimonial";
import { TextTestimonial } from "./compositions/TextTestimonial";
import { LeaderboardCelebration } from "./compositions/LeaderboardCelebration";
import { ReportSummary } from "./compositions/ReportSummary";
import { SocialClip } from "./compositions/SocialClip";
import { VideoThumbnail } from "./compositions/VideoThumbnail";
import type { VideoTestimonialProps } from "./types";
import type { TextTestimonialProps } from "./types";
import type { LeaderboardCelebrationProps } from "./types";
import type { ReportSummaryProps } from "./types";
import type { SocialClipProps } from "./types";
import type { VideoThumbnailProps } from "./types";
import {
  calculateVideoTestimonialDuration,
  calculateTextTestimonialDuration,
  calculateLeaderboardDuration,
  calculateReportDuration,
  calculateSocialClipDuration,
} from "./utils/timing";

/**
 * Remotion Root - Composition Registry
 *
 * This file registers all video compositions that can be rendered.
 * Each composition defines its output format, dimensions, and frame rate.
 */

// Default props for studio preview
const defaultVideoTestimonialProps: VideoTestimonialProps = {
  videoUrl: "",
  captions: [
    { text: "This was an amazing experience.", startMs: 0, endMs: 2000 },
    { text: "I highly recommend them to everyone.", startMs: 2000, endMs: 4000 },
  ],
  wordTimestamps: [
    { word: "This", startMs: 0, endMs: 300 },
    { word: "was", startMs: 300, endMs: 520 },
    { word: "an", startMs: 520, endMs: 650 },
    { word: "amazing", startMs: 650, endMs: 1100 },
    { word: "experience.", startMs: 1100, endMs: 1700 },
    { word: "I", startMs: 2000, endMs: 2140 },
    { word: "highly", startMs: 2140, endMs: 2480 },
    { word: "recommend", startMs: 2480, endMs: 2940 },
    { word: "them", startMs: 2940, endMs: 3160 },
    { word: "to", startMs: 3160, endMs: 3280 },
    { word: "everyone.", startMs: 3280, endMs: 3900 },
  ],
  transcription: "This was an amazing experience. I highly recommend them to everyone.",
  aiQuote: "An amazing experience worth recommending.",
  customer: {
    displayName: "John Smith",
    relationship: "First-time Homebuyer",
  },
  loanOfficer: {
    fullName: "Sarah Johnson",
    title: "Senior Loan Officer",
    photoUrl: null,
  },
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  template: "modern",
  format: "16:9",
  showCaptions: true,
  showIntro: true,
  showOutro: true,
  videoDurationMs: 10000,
};

const defaultTextTestimonialProps: TextTestimonialProps = {
  text: "Working with this team was the best decision we made. They guided us through every step of the process with patience and expertise.",
  author: "Michael Chen",
  rating: 5,
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  template: "modern",
  format: "16:9",
};

const defaultLeaderboardProps: LeaderboardCelebrationProps = {
  celebrationType: "new_first_place",
  winner: {
    name: "Sarah Johnson",
    photoUrl: null,
    score: 98,
    rank: 1,
    previousRank: 3,
    newRank: 1,
  },
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  topFive: [
    { name: "Sarah Johnson", photoUrl: null, score: 98, rank: 1 },
    { name: "Michael Chen", photoUrl: null, score: 95, rank: 2 },
    { name: "Emily Davis", photoUrl: null, score: 92, rank: 3 },
    { name: "James Wilson", photoUrl: null, score: 88, rank: 4 },
    { name: "Lisa Anderson", photoUrl: null, score: 85, rank: 5 },
  ],
  period: "This Week",
};

const defaultReportProps: ReportSummaryProps = {
  period: "January 2026",
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  metrics: {
    npsScore: 72,
    npsPrevious: 65,
    totalReviews: 47,
    reviewsPrevious: 38,
    averageRating: 4.8,
    ratingPrevious: 4.6,
    responseRate: 94,
    responseRatePrevious: 88,
  },
  sentimentBreakdown: {
    positive: 78,
    neutral: 15,
    negative: 7,
  },
  topPerformer: {
    name: "Sarah Johnson",
    photoUrl: null,
    score: 98,
  },
};

const defaultSocialClipProps: SocialClipProps = {
  type: "testimonial_quote",
  quote: "This was the smoothest home buying experience. Highly recommend!",
  author: "John Smith",
  rating: 5,
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  format: "9:16",
};

const defaultThumbnailProps: VideoThumbnailProps = {
  customerName: "John Smith",
  quote: "Best experience ever!",
  rating: 5,
  organization: {
    name: "RepWell Mortgage",
    logoUrl: null,
    primaryColor: "#52796f",
    secondaryColor: "#84a98c",
  },
  loanOfficer: {
    fullName: "Sarah Johnson",
    photoUrl: null,
  },
};

// Frame rate constant
const FPS = 30;

// Type-safe component wrappers for Remotion compatibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoTestimonialComponent = VideoTestimonial as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TextTestimonialComponent = TextTestimonial as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LeaderboardCelebrationComponent = LeaderboardCelebration as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReportSummaryComponent = ReportSummary as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SocialClipComponent = SocialClip as React.FC<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoThumbnailComponent = VideoThumbnail as React.FC<any>;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Video Testimonial - 16:9 Landscape */}
      <Composition
        id="VideoTestimonial-16-9"
        component={VideoTestimonialComponent}
        durationInFrames={calculateVideoTestimonialDuration(defaultVideoTestimonialProps, FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultVideoTestimonialProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateVideoTestimonialDuration(props as unknown as VideoTestimonialProps, FPS),
        })}
      />

      {/* Video Testimonial - 1:1 Square */}
      <Composition
        id="VideoTestimonial-1-1"
        component={VideoTestimonialComponent}
        durationInFrames={calculateVideoTestimonialDuration(
          { ...defaultVideoTestimonialProps, format: "1:1" },
          FPS
        )}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ ...defaultVideoTestimonialProps, format: "1:1" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateVideoTestimonialDuration(props as unknown as VideoTestimonialProps, FPS),
        })}
      />

      {/* Video Testimonial - 9:16 Vertical */}
      <Composition
        id="VideoTestimonial-9-16"
        component={VideoTestimonialComponent}
        durationInFrames={calculateVideoTestimonialDuration(
          { ...defaultVideoTestimonialProps, format: "9:16" },
          FPS
        )}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ ...defaultVideoTestimonialProps, format: "9:16" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateVideoTestimonialDuration(props as unknown as VideoTestimonialProps, FPS),
        })}
      />

      {/* Text Testimonial - 16:9 */}
      <Composition
        id="TextTestimonial-16-9"
        component={TextTestimonialComponent}
        durationInFrames={calculateTextTestimonialDuration(defaultTextTestimonialProps, FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultTextTestimonialProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateTextTestimonialDuration(props as unknown as TextTestimonialProps, FPS),
        })}
      />

      {/* Text Testimonial - 1:1 */}
      <Composition
        id="TextTestimonial-1-1"
        component={TextTestimonialComponent}
        durationInFrames={calculateTextTestimonialDuration(
          { ...defaultTextTestimonialProps, format: "1:1" },
          FPS
        )}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ ...defaultTextTestimonialProps, format: "1:1" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateTextTestimonialDuration(props as unknown as TextTestimonialProps, FPS),
        })}
      />

      {/* Text Testimonial - 9:16 */}
      <Composition
        id="TextTestimonial-9-16"
        component={TextTestimonialComponent}
        durationInFrames={calculateTextTestimonialDuration(
          { ...defaultTextTestimonialProps, format: "9:16" },
          FPS
        )}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ ...defaultTextTestimonialProps, format: "9:16" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateTextTestimonialDuration(props as unknown as TextTestimonialProps, FPS),
        })}
      />

      {/* Leaderboard Celebration */}
      <Composition
        id="LeaderboardCelebration"
        component={LeaderboardCelebrationComponent}
        durationInFrames={calculateLeaderboardDuration(defaultLeaderboardProps, FPS)}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={defaultLeaderboardProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateLeaderboardDuration(props as unknown as LeaderboardCelebrationProps, FPS),
        })}
      />

      {/* Report Summary */}
      <Composition
        id="ReportSummary"
        component={ReportSummaryComponent}
        durationInFrames={calculateReportDuration(defaultReportProps, FPS)}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={defaultReportProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateReportDuration(props as unknown as ReportSummaryProps, FPS),
        })}
      />

      {/* Social Clip - 9:16 Stories/Reels */}
      <Composition
        id="SocialClip-9-16"
        component={SocialClipComponent}
        durationInFrames={calculateSocialClipDuration(defaultSocialClipProps, FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultSocialClipProps}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateSocialClipDuration(props as unknown as SocialClipProps, FPS),
        })}
      />

      {/* Social Clip - 1:1 Feed */}
      <Composition
        id="SocialClip-1-1"
        component={SocialClipComponent}
        durationInFrames={calculateSocialClipDuration(
          { ...defaultSocialClipProps, format: "1:1" },
          FPS
        )}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ ...defaultSocialClipProps, format: "1:1" }}
        calculateMetadata={({ props }) => ({
          durationInFrames: calculateSocialClipDuration(props as unknown as SocialClipProps, FPS),
        })}
      />

      {/* Video Thumbnail - Static Image */}
      <Still
        id="VideoThumbnail"
        component={VideoThumbnailComponent}
        width={1280}
        height={720}
        defaultProps={defaultThumbnailProps}
      />
    </>
  );
};
