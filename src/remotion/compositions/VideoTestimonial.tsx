/**
 * VideoTestimonial Composition
 *
 * Full branded video testimonial with:
 * - Animated intro (org logo, professional name/photo)
 * - TikTok-style animated captions
 * - AI quote highlight segment
 * - Branded outro with CTA
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  Video,
  interpolate,
  spring,
} from "remotion";
import type { VideoTestimonialProps } from "../types";
import { REPWELL_COLORS } from "../types";
import { secondsToFrames, getCompositionSegments } from "../utils/timing";
import { withOpacity } from "../utils/colors";
import { BrandedIntro } from "../components/BrandedIntro";
import { BrandedOutro } from "../components/BrandedOutro";
import { AnimatedCaptions } from "../components/AnimatedCaptions";
import { QuoteReveal } from "../components/QuoteReveal";

export const VideoTestimonial: React.FC<VideoTestimonialProps> = ({
  videoUrl,
  captions,
  transcription,
  aiQuote,
  customer,
  loanOfficer,
  organization,
  template,
  format,
  showCaptions,
  showIntro,
  showOutro,
  videoDurationMs,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height, durationInFrames } = useVideoConfig();

  // Calculate segment timings
  const introDurationSec = showIntro ? 3 : 0;
  const outroDurationSec = showOutro ? 3 : 0;
  const quoteDurationSec = aiQuote ? 4 : 0;
  const videoDurationSec = videoDurationMs / 1000;

  const introFrames = secondsToFrames(introDurationSec, fps);
  const videoFrames = secondsToFrames(videoDurationSec, fps);
  const quoteFrames = secondsToFrames(quoteDurationSec, fps);
  const outroFrames = secondsToFrames(outroDurationSec, fps);

  // Segment start frames
  const introStart = 0;
  const videoStart = introFrames;
  const quoteStart = videoStart + videoFrames;
  const outroStart = quoteStart + quoteFrames;

  // Layout adjustments based on format
  const isVertical = format === "9:16";
  const isSquare = format === "1:1";

  // Video container styles based on format
  const getVideoContainerStyles = (): React.CSSProperties => {
    if (isVertical) {
      return {
        width: "100%",
        height: "60%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: REPWELL_COLORS.teal[500],
      };
    }
    if (isSquare) {
      return {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: REPWELL_COLORS.teal[500],
      };
    }
    // 16:9
    return {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: REPWELL_COLORS.teal[500],
    };
  };

  return (
    <AbsoluteFill style={{ backgroundColor: REPWELL_COLORS.teal[500] }}>
      {/* Intro Sequence */}
      {showIntro && (
        <Sequence from={introStart} durationInFrames={introFrames} name="Intro">
          <BrandedIntro
            organization={organization}
            professionalName={loanOfficer.fullName}
            professionalTitle={loanOfficer.title}
            professionalPhotoUrl={loanOfficer.photoUrl}
            customerName={customer.displayName}
            format={format}
            durationFrames={introFrames}
          />
        </Sequence>
      )}

      {/* Video Content Sequence */}
      <Sequence from={videoStart} durationInFrames={videoFrames} name="Video">
        <AbsoluteFill style={getVideoContainerStyles()}>
          {/* Video Player */}
          <VideoWithTransition
            videoUrl={videoUrl}
            fps={fps}
            videoStart={videoStart}
            videoFrames={videoFrames}
            frame={frame}
          />

          {/* Animated Captions Overlay */}
          {showCaptions && captions.length > 0 && (
            <AnimatedCaptions
              captions={captions}
              startFrame={0}
              highlightColor={organization.primaryColor || REPWELL_COLORS.teal[300]}
              textColor={REPWELL_COLORS.white}
              fontSize={isVertical ? 36 : 48}
              bottomOffset={isVertical ? 25 : 15}
              maxWidth={isVertical ? 90 : 80}
              style={template === "minimal" ? "minimal" : "default"}
            />
          )}

          {/* Customer Info Overlay (for vertical format) */}
          {isVertical && (
            <CustomerInfoOverlay
              customer={customer}
              loanOfficer={loanOfficer}
              frame={frame - videoStart}
              fps={fps}
            />
          )}
        </AbsoluteFill>
      </Sequence>

      {/* AI Quote Highlight Sequence */}
      {aiQuote && (
        <Sequence from={quoteStart} durationInFrames={quoteFrames} name="Quote">
          <QuoteHighlightSection
            quote={aiQuote}
            customer={customer}
            organization={organization}
            format={format}
            fps={fps}
          />
        </Sequence>
      )}

      {/* Outro Sequence */}
      {showOutro && (
        <Sequence from={outroStart} durationInFrames={outroFrames} name="Outro">
          <BrandedOutro
            organization={organization}
            ctaText="Ready to share your story?"
            format={format}
            startFrame={0}
            durationFrames={outroFrames}
          />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/**
 * Video player with fade transitions
 */
const VideoWithTransition: React.FC<{
  videoUrl: string;
  fps: number;
  videoStart: number;
  videoFrames: number;
  frame: number;
}> = ({ videoUrl, fps, videoStart, videoFrames, frame }) => {
  const relativeFrame = frame - videoStart;

  // Fade in
  const fadeIn = interpolate(relativeFrame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(
    relativeFrame,
    [videoFrames - fps * 0.5, videoFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  // If no video URL, show placeholder
  if (!videoUrl) {
    return (
      <AbsoluteFill
        style={{
          opacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: REPWELL_COLORS.teal[400],
        }}
      >
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 24,
            color: withOpacity(REPWELL_COLORS.white, 0.5),
          }}
        >
          Video Preview
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ opacity }}>
      <Video
        src={videoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Customer info overlay for vertical format
 */
const CustomerInfoOverlay: React.FC<{
  customer: { displayName: string; relationship: string | null };
  loanOfficer: { fullName: string };
  frame: number;
  fps: number;
}> = ({ customer, loanOfficer, frame, fps }) => {
  const opacity = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "35%",
        left: 0,
        right: 0,
        padding: "0 24px",
        opacity,
      }}
    >
      <div
        style={{
          background: withOpacity(REPWELL_COLORS.teal[500], 0.9),
          borderRadius: "12px",
          padding: "16px 20px",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: REPWELL_COLORS.white,
          }}
        >
          {customer.displayName}
        </div>
        {customer.relationship && (
          <div
            style={{
              fontFamily: "'Source Sans 3', system-ui, sans-serif",
              fontSize: 14,
              color: withOpacity(REPWELL_COLORS.white, 0.8),
              marginTop: "4px",
            }}
          >
            {customer.relationship}
          </div>
        )}
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 12,
            color: withOpacity(REPWELL_COLORS.white, 0.6),
            marginTop: "8px",
          }}
        >
          Review for {loanOfficer.fullName}
        </div>
      </div>
    </div>
  );
};

/**
 * AI Quote highlight section
 */
const QuoteHighlightSection: React.FC<{
  quote: string;
  customer: { displayName: string };
  organization: { name: string; primaryColor: string; secondaryColor: string };
  format: "16:9" | "1:1" | "9:16";
  fps: number;
}> = ({ quote, customer, organization, format, fps }) => {
  const frame = useCurrentFrame();

  const isVertical = format === "9:16";

  // Background fade in
  const bgOpacity = interpolate(frame, [0, fps * 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${organization.primaryColor}, ${organization.secondaryColor})`,
        opacity: bgOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isVertical ? "60px 32px" : "60px",
      }}
    >
      {/* Quote marks background */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontFamily: "'Erstoria', Georgia, serif",
          fontSize: isVertical ? 400 : 500,
          color: withOpacity(REPWELL_COLORS.white, 0.05),
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        "
      </div>

      {/* Quote text */}
      <div style={{ maxWidth: isVertical ? "90%" : "70%", zIndex: 1 }}>
        <QuoteReveal
          text={quote}
          startFrame={fps * 0.3}
          style="slide-up"
          fontSize={isVertical ? 32 : 40}
          color={REPWELL_COLORS.white}
          showQuoteMarks={false}
          textAlign="center"
          fontFamily="display"
          italic={true}
        />
      </div>

      {/* Attribution */}
      <AttributionReveal
        name={customer.displayName}
        startFrame={fps * 1.5}
        frame={frame}
        fps={fps}
      />
    </AbsoluteFill>
  );
};

/**
 * Attribution reveal animation
 */
const AttributionReveal: React.FC<{
  name: string;
  startFrame: number;
  frame: number;
  fps: number;
}> = ({ name, startFrame, frame, fps }) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { stiffness: 200, damping: 25 },
    durationInFrames: fps * 0.5,
  });

  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [15, 0]);

  return (
    <div
      style={{
        marginTop: "32px",
        opacity,
        transform: `translateY(${translateY}px)`,
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontFamily: "'Source Sans 3', system-ui, sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: REPWELL_COLORS.white,
        }}
      >
        — {name}
      </div>
    </div>
  );
};

export default VideoTestimonial;
