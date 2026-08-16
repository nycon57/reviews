/**
 * VideoTestimonial Composition ("Clip")
 *
 * Full branded video testimonial with:
 * - Animated intro (org logo, professional name/photo)
 * - Trimmed source video (auto-trim handled upstream via trimStartMs/trimEndMs)
 * - Adaptive framing: portrait sources fill the frame, landscape sources sit
 *   in a styled card on the brand background
 * - TikTok-style animated captions
 * - Ducked background music bed
 * - AI quote highlight segment
 * - End Card with the professional's contact block + smart-link QR
 */

import {
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  Audio,
  interpolate,
  spring,
} from "remotion";
import type { VideoTestimonialProps } from "../types";
import { REPWELL_COLORS, getPlayedDurationMs } from "../types";
import { secondsToFrames, calculateQuoteDurationSec } from "../utils/timing";
import { withOpacity } from "../utils/colors";
import { BrandedIntro } from "../components/BrandedIntro";
import { BrandedOutro } from "../components/BrandedOutro";
import { EndCard } from "../components/EndCard";
import { AnimatedCaptions } from "../components/AnimatedCaptions";
import { QuoteReveal } from "../components/QuoteReveal";

const MIN_VIDEO_SEGMENT_SEC = 5;

/** Aspect ratio of the output frame for a format. */
function formatAspect(format: "16:9" | "1:1" | "9:16"): number {
  if (format === "9:16") return 9 / 16;
  if (format === "1:1") return 1;
  return 16 / 9;
}

export const VideoTestimonial: React.FC<VideoTestimonialProps> = ({
  videoUrl,
  captions,
  wordTimestamps,
  transcription: _transcription,
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
  trimStartMs = 0,
  trimEndMs,
  sourceWidth,
  sourceHeight,
  framing = "crop",
  music,
  endCard,
}) => {
  const { fps } = useVideoConfig();

  // Calculate segment timings (must mirror calculateVideoTestimonialDuration)
  const playedMs = getPlayedDurationMs({ videoDurationMs, trimStartMs, trimEndMs });
  const introDurationSec = showIntro ? 3 : 0;
  const outroDurationSec = showOutro ? 3 : 0;
  const quoteDurationSec = calculateQuoteDurationSec(aiQuote);
  const videoDurationSec = Math.max(playedMs / 1000, MIN_VIDEO_SEGMENT_SEC);

  const introFrames = secondsToFrames(introDurationSec, fps);
  const videoFrames = secondsToFrames(videoDurationSec, fps);
  const quoteFrames = secondsToFrames(quoteDurationSec, fps);
  const outroFrames = secondsToFrames(outroDurationSec, fps);

  // Segment start frames
  const introStart = 0;
  const videoStart = introFrames;
  const quoteStart = videoStart + videoFrames;
  const outroStart = quoteStart + quoteFrames;

  const isVertical = format === "9:16";

  // Framing: "crop" always fills the frame (centered cover crop), "card"
  // always uses the styled card, "auto" falls back to the aspect heuristic
  // (full-bleed only when the source roughly matches the output frame).
  const sourceAspect =
    sourceWidth && sourceHeight && sourceHeight > 0
      ? sourceWidth / sourceHeight
      : 16 / 9;
  const aspectRatio = sourceAspect / formatAspect(format);
  const autoFullBleed = aspectRatio > 0.82 && aspectRatio < 1.22;
  const fullBleed =
    framing === "crop" ? true : framing === "card" ? false : autoFullBleed;

  // Music bed: full volume on intro/quote/outro, ducked under speech.
  const speechEnd = videoStart + videoFrames;
  const musicPeak = Math.min(1, Math.max(0, music?.volume ?? 0.3));
  const musicDucked = musicPeak * 0.25;
  const rampFrames = Math.floor(fps * 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: REPWELL_COLORS.teal[500] }}>
      {/* Music bed */}
      {music?.url && (
        <Audio
          src={music.url}
          loop
          volume={(f) =>
            interpolate(
              f,
              [
                videoStart - rampFrames,
                videoStart,
                speechEnd,
                speechEnd + rampFrames,
              ],
              [musicPeak, musicDucked, musicDucked, musicPeak],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            )
          }
        />
      )}

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
        <VideoSegment
          videoUrl={videoUrl}
          fps={fps}
          videoFrames={videoFrames}
          trimStartMs={trimStartMs}
          playedMs={playedMs}
          fullBleed={fullBleed}
          sourceAspect={sourceAspect}
          isVertical={isVertical}
          customer={customer}
          loanOfficer={loanOfficer}
          organization={organization}
        />

        {/* Animated Captions Overlay */}
        {showCaptions &&
          ((wordTimestamps?.length ?? 0) > 0 || captions.length > 0) && (
            <AnimatedCaptions
              captions={captions}
              wordTimestamps={wordTimestamps}
              startFrame={0}
              timeOffsetMs={trimStartMs}
              maxSourceMs={trimStartMs + playedMs}
              highlightColor={organization.primaryColor || REPWELL_COLORS.teal[300]}
              textColor={REPWELL_COLORS.white}
              fontSize={isVertical ? 44 : 48}
              bottomOffset={fullBleed ? (isVertical ? 22 : 12) : isVertical ? 28 : 10}
              maxWidth={isVertical ? 90 : 80}
              style={template === "minimal" || !fullBleed ? "minimal" : "default"}
            />
          )}
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

      {/* Outro Sequence: End Card with contact + QR, generic outro fallback */}
      {showOutro && (
        <Sequence from={outroStart} durationInFrames={outroFrames} name="Outro">
          {endCard ? (
            <EndCard
              contact={endCard}
              organization={organization}
              format={format}
              startFrame={0}
            />
          ) : (
            <BrandedOutro
              organization={organization}
              ctaText={`Work with ${loanOfficer.fullName.split(" ")[0]}`}
              format={format}
              startFrame={0}
              durationFrames={outroFrames}
            />
          )}
        </Sequence>
      )}
    </AbsoluteFill>
  );
};

/**
 * Source video with trim + adaptive framing + fade transitions.
 */
const VideoSegment: React.FC<{
  videoUrl: string;
  fps: number;
  videoFrames: number;
  trimStartMs: number;
  playedMs: number;
  fullBleed: boolean;
  sourceAspect: number;
  isVertical: boolean;
  customer: { displayName: string; relationship: string | null };
  loanOfficer: { fullName: string };
  organization: { primaryColor: string };
}> = ({
  videoUrl,
  fps,
  videoFrames,
  trimStartMs,
  playedMs,
  fullBleed,
  sourceAspect,
  isVertical,
  customer,
  loanOfficer,
  organization,
}) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    frame,
    [videoFrames - fps * 0.5, videoFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const opacity = Math.min(fadeIn, fadeOut);

  // If no video URL, show placeholder (studio preview)
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

  const startFrom = Math.floor((trimStartMs / 1000) * fps);
  const endAt = startFrom + Math.ceil((playedMs / 1000) * fps);

  const video = (
    <OffthreadVideo
      src={videoUrl}
      startFrom={startFrom}
      endAt={endAt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: fullBleed ? "cover" : "contain",
      }}
    />
  );

  if (fullBleed) {
    return (
      <AbsoluteFill style={{ opacity }}>
        {video}
        {isVertical && (
          <CustomerInfoChip
            customer={customer}
            loanOfficer={loanOfficer}
            frame={frame}
            fps={fps}
            bottom="34%"
          />
        )}
      </AbsoluteFill>
    );
  }

  // Styled card: source video in a rounded frame on the brand-dark
  // background, sized to the source aspect so nothing is cropped. The
  // customer chip sits directly under the card; captions own the bottom.
  return (
    <AbsoluteFill
      style={{
        opacity,
        background: `linear-gradient(180deg, ${REPWELL_COLORS.teal[500]}, ${withOpacity(
          organization.primaryColor || REPWELL_COLORS.teal[400],
          0.55
        )})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isVertical ? "flex-start" : "center",
        gap: 28,
        padding: isVertical ? "16% 44px 0" : "48px",
      }}
    >
      <div
        style={{
          width: isVertical ? "100%" : "auto",
          height: isVertical ? "auto" : "78%",
          aspectRatio: `${sourceAspect}`,
          maxWidth: "100%",
          maxHeight: isVertical ? "52%" : "78%",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 18px 48px rgba(0,0,0,0.35)",
        }}
      >
        {video}
      </div>

      {isVertical && (
        <CustomerInfoChip
          customer={customer}
          loanOfficer={loanOfficer}
          frame={frame}
          fps={fps}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Customer identity chip shown on vertical formats. Positioned absolutely
 * when `bottom` is given (full-bleed), otherwise flows after the video card.
 */
const CustomerInfoChip: React.FC<{
  customer: { displayName: string; relationship: string | null };
  loanOfficer: { fullName: string };
  frame: number;
  fps: number;
  bottom?: string;
}> = ({ customer, loanOfficer, frame, fps, bottom }) => {
  const opacity = interpolate(frame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateRight: "clamp",
  });

  const containerStyle: React.CSSProperties = {
    padding: "0 24px",
    opacity,
    display: "flex",
    justifyContent: "center",
  };

  // Pinned to the bottom of the frame only when the caller supplies an offset.
  if (bottom) {
    containerStyle.position = "absolute";
    containerStyle.bottom = bottom;
    containerStyle.left = 0;
    containerStyle.right = 0;
  }

  return (
    <div style={containerStyle}>
      <div
        style={{
          background: withOpacity(REPWELL_COLORS.teal[500], 0.9),
          borderRadius: "12px",
          padding: "14px 20px",
          textAlign: "center",
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
        <div
          style={{
            fontFamily: "'Source Sans 3', system-ui, sans-serif",
            fontSize: 13,
            color: withOpacity(REPWELL_COLORS.white, 0.7),
            marginTop: 4,
          }}
        >
          {customer.relationship ? `${customer.relationship} · ` : ""}
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
        {name}
      </div>
    </div>
  );
};

export default VideoTestimonial;
