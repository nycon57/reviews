"use client";

import { Star, Play, Pause, Volume2, Maximize, Home, ExternalLink, AlertCircle, RotateCcw } from "lucide-react";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";

/**
 * Dashboard preview component for the Video Testimonial Widget.
 * Plays actual video with all controls functional for WYSIWYG editing.
 */

// ── Types ────────────────────────────────────────────────────────────

interface WidgetThemeColors {
  primary?: string;
  background?: string;
  text?: string;
  accent?: string;
  border?: string;
  starFilled?: string;
  starEmpty?: string;
}

interface WidgetContent {
  showHeader?: boolean;
  headerText?: string;
  showCTA?: boolean;
  ctaText?: string;
  ctaUrl?: string;
  showSource?: boolean;
  showDate?: boolean;
  showAvatar?: boolean;
  showBranding?: boolean;
  truncateLength?: number;
  showNMLS?: boolean;
  showDisclaimer?: boolean;
  disclaimerText?: string;
  showWriteReview?: boolean;
  writeReviewUrl?: string;
  columns?: number;
  dateFormat?: "relative" | "absolute";
  cardStyle?: "bordered" | "shadow" | "flat";
}

interface WidgetVideo {
  transcriptPosition?: "below" | "side" | "hidden";
  layout?: "list" | "grid";
}

interface VideoTestimonialData {
  id: string;
  video_url: string;
  poster_url: string | null;
  reviewer_name: string | null;
  reviewer_title: string | null;
  rating: number;
  duration: number | null;
  transcript: { start: number; end: number; text: string }[] | null;
}

interface EntityProfile {
  full_name: string | null;
  avatar_url: string | null;
  photo_url: string | null;
  nmls_id: string | null;
  title: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

interface VideoTestimonialPreviewProps {
  profile: EntityProfile | null;
  testimonials: VideoTestimonialData[];
  content?: WidgetContent;
  video?: WidgetVideo;
  colors?: WidgetThemeColors;
  maxWidth?: string;
  borderRadius?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "?";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Star Rating ─────────────────────────────────────────────────────

function StarRating({
  rating,
  filledColor,
  emptyColor,
  size = 16,
}: {
  rating: number;
  filledColor: string;
  emptyColor: string;
  size?: number;
}) {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          fill={i < rating ? filledColor : "none"}
          stroke={i < rating ? filledColor : emptyColor}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

// ── Video Player Card ───────────────────────────────────────────────

function VideoPlayerCard({
  testimonial,
  profile,
  content,
  transcriptPosition,
  starFilled,
  starEmpty,
}: {
  testimonial: VideoTestimonialData;
  profile: EntityProfile | null;
  content: WidgetContent;
  transcriptPosition: "below" | "side" | "hidden";
  starFilled: string;
  starEmpty: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(testimonial.duration ?? 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const handlePlay = useCallback(() => {
    if (!videoRef.current) return;
    setHasError(false);
    setShowPlayOverlay(false);
    setVideoLoaded(true);
    videoRef.current.play().catch(() => {
      setShowPlayOverlay(true);
    });
  }, []);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setVideoLoaded(false);
    setShowPlayOverlay(true);
    // Force reload by resetting src
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pct * videoRef.current.duration;
  }, []);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const v = parseFloat(e.target.value);
    videoRef.current.volume = v;
    videoRef.current.muted = v === 0;
    setVolume(v);
    setIsMuted(v === 0);
  }, []);

  // Transcript auto-highlight (derived state, no setState needed)
  const activeTranscriptIndex = useMemo(() => {
    if (!testimonial.transcript?.length) return -1;
    const segments = testimonial.transcript;
    for (let i = 0; i < segments.length; i++) {
      if (currentTime >= segments[i].start && currentTime < segments[i].end) {
        return i;
      }
    }
    return -1;
  }, [currentTime, testimonial.transcript]);

  // Auto-scroll transcript
  useEffect(() => {
    if (activeTranscriptIndex < 0 || !transcriptRef.current) return;
    const activeEl = transcriptRef.current.querySelector("[data-active='true']");
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeTranscriptIndex]);

  const isSide = transcriptPosition === "side" && !!testimonial.transcript?.length;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`border rounded-lg overflow-hidden bg-white transition-shadow hover:shadow-md ${isSide ? "flex flex-col sm:flex-row" : ""}`}
      style={{ borderColor: "var(--rw-border, #e5e7eb)", borderRadius: "var(--rw-radius, 8px)" }}
    >
      {/* Video player */}
      <div className={`relative bg-black aspect-video ${isSide ? "sm:w-[60%] flex-shrink-0" : ""}`}>
        {/* Video element */}
        {(videoLoaded || testimonial.video_url) && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-contain"
            playsInline
            preload="metadata"
            poster={testimonial.poster_url ?? undefined}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              setShowPlayOverlay(true);
            }}
            onError={() => setHasError(true)}
          >
            <source src={testimonial.video_url} />
          </video>
        )}

        {/* Poster overlay */}
        {testimonial.poster_url && showPlayOverlay && !hasError && (
          <img
            src={testimonial.poster_url}
            alt={`Video thumbnail: ${testimonial.reviewer_name ?? "testimonial"}`}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Poster placeholder */}
        {!testimonial.poster_url && showPlayOverlay && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a2e] text-gray-400 text-sm">
            Video Testimonial
          </div>
        )}

        {/* Play button overlay */}
        {showPlayOverlay && !hasError && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/35 hover:bg-black/50 transition-colors cursor-pointer z-10"
            onClick={handlePlay}
            aria-label="Play video"
          >
            <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Play size={24} className="ml-0.5" style={{ color: "var(--rw-primary, #52796f)" }} fill="currentColor" />
            </div>
          </button>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a2e] gap-3 z-20">
            <AlertCircle size={24} className="text-gray-400" />
            <div className="text-sm text-gray-400">Failed to load video</div>
            <button
              className="px-5 py-2 text-sm font-medium text-white rounded-md transition-opacity hover:opacity-90"
              style={{ background: "var(--rw-primary, #52796f)" }}
              onClick={handleRetry}
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw size={14} />
                Retry
              </span>
            </button>
          </div>
        )}

        {/* Custom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 z-10 transition-opacity ${
            isPlaying ? "opacity-0 hover:opacity-100" : "opacity-100"
          }`}
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
        >
          <button
            className="text-white p-1 hover:opacity-80 flex-shrink-0"
            onClick={togglePlayPause}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" />}
          </button>

          <div
            className="flex-1 h-1 bg-white/30 rounded cursor-pointer relative overflow-hidden"
            onClick={handleProgressClick}
            role="slider"
            aria-label="Video progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div
              className="h-full rounded"
              style={{ width: `${progress}%`, background: "var(--rw-primary, #52796f)" }}
            />
          </div>

          <span className="text-[11px] text-white/85 min-w-[70px] text-center tabular-nums whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            className="text-white p-1 hover:opacity-80 flex-shrink-0 hidden sm:flex"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            <Volume2 size={16} fill={isMuted ? "none" : "white"} />
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-12 h-1 hidden sm:block"
            aria-label="Volume"
          />

          <button
            className="text-white p-1 hover:opacity-80 flex-shrink-0"
            onClick={() => {
              const el = videoRef.current?.parentElement;
              if (el?.requestFullscreen) el.requestFullscreen();
            }}
            aria-label="Fullscreen"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>

      {/* Side panel (for side transcript) */}
      {isSide ? (
        <div className="sm:w-[40%] flex flex-col">
          {/* Reviewer info */}
          <div className="p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ background: "var(--rw-primary, #52796f)" }}
              >
                {getInitials(testimonial.reviewer_name)}
              </div>
              <div className="flex-1 min-w-0">
                {testimonial.reviewer_name && (
                  <div className="text-sm font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                    {testimonial.reviewer_name}
                  </div>
                )}
                {testimonial.reviewer_title && (
                  <div className="text-xs text-gray-500">{testimonial.reviewer_title}</div>
                )}
              </div>
            </div>
            {testimonial.rating > 0 && (
              <StarRating rating={testimonial.rating} filledColor={starFilled} emptyColor={starEmpty} />
            )}
          </div>

          {/* Transcript (always shown in side layout) */}
          {testimonial.transcript && (
            <div
              ref={transcriptRef}
              className="flex-1 max-h-[200px] overflow-y-auto border-t px-3 py-2 bg-gray-50"
              style={{ borderColor: "var(--rw-border, #e5e7eb)" }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                Transcript
              </div>
              {testimonial.transcript.map((seg, i) => (
                <span
                  key={i}
                  data-active={i === activeTranscriptIndex}
                  className={`text-[13px] leading-relaxed px-1 rounded cursor-pointer transition-colors ${
                    i === activeTranscriptIndex
                      ? "bg-[var(--rw-primary,#52796f)]/10 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  style={i === activeTranscriptIndex ? { color: "var(--rw-text, #1a1a2e)" } : undefined}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = seg.start;
                      if (videoRef.current.paused) videoRef.current.play();
                    }
                  }}
                >
                  {seg.text}{" "}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Reviewer info below video */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                style={{ background: "var(--rw-primary, #52796f)" }}
              >
                {getInitials(testimonial.reviewer_name)}
              </div>
              <div className="flex-1 min-w-0">
                {testimonial.reviewer_name && (
                  <div className="text-sm font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                    {testimonial.reviewer_name}
                  </div>
                )}
                {testimonial.reviewer_title && (
                  <div className="text-xs text-gray-500">{testimonial.reviewer_title}</div>
                )}
              </div>
            </div>
            {testimonial.rating > 0 && (
              <StarRating rating={testimonial.rating} filledColor={starFilled} emptyColor={starEmpty} />
            )}
          </div>

          {/* Pro info */}
          {profile && content.showHeader !== false && (
            <div
              className="flex items-center gap-2.5 px-4 py-2.5 border-t bg-gray-50"
              style={{ borderColor: "var(--rw-border, #e5e7eb)" }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                style={{ background: "var(--rw-primary, #52796f)" }}
              >
                {getInitials(profile.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                {profile.full_name && (
                  <div className="text-[13px] font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                    {profile.full_name}
                  </div>
                )}
                {profile.nmls_id && (
                  <a
                    href={`https://www.nmlsconsumeraccess.org/EntityDetails.aspx/INDIVIDUAL/${encodeURIComponent(profile.nmls_id)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] text-gray-500 hover:text-[var(--rw-primary,#52796f)] no-underline hover:underline"
                  >
                    NMLS# {profile.nmls_id}
                    <ExternalLink size={9} />
                  </a>
                )}
              </div>
              {profile.average_rating != null && (
                <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                  {profile.average_rating.toFixed(1)}
                  <StarRating rating={Math.round(profile.average_rating)} filledColor={starFilled} emptyColor={starEmpty} size={12} />
                </div>
              )}
            </div>
          )}

          {/* Transcript below video */}
          {testimonial.transcript && transcriptPosition === "below" && (
            <div
              ref={transcriptRef}
              className="max-h-[200px] overflow-y-auto border-t px-4 py-3 bg-gray-50"
              style={{ borderColor: "var(--rw-border, #e5e7eb)" }}
            >
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--rw-text, #1a1a2e)" }}>
                Transcript
              </div>
              {testimonial.transcript.map((seg, i) => (
                <span
                  key={i}
                  data-active={i === activeTranscriptIndex}
                  className={`text-[13px] leading-relaxed px-1 rounded cursor-pointer transition-colors ${
                    i === activeTranscriptIndex
                      ? "bg-[var(--rw-primary,#52796f)]/10 font-medium"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                  style={i === activeTranscriptIndex ? { color: "var(--rw-text, #1a1a2e)" } : undefined}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = seg.start;
                      if (videoRef.current.paused) videoRef.current.play();
                    }
                  }}
                >
                  {seg.text}{" "}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main Preview Component ──────────────────────────────────────────

export function VideoTestimonialPreview({
  profile,
  testimonials,
  content = {},
  video = {},
  colors = {},
  maxWidth,
  borderRadius,
}: VideoTestimonialPreviewProps) {
  const starFilled = colors.starFilled ?? "#f59e0b";
  const starEmpty = colors.starEmpty ?? "#d1d5db";
  const transcriptPosition = video.transcriptPosition ?? "below";
  const layout = video.layout ?? "list";

  const containerStyle: React.CSSProperties = {
    "--rw-primary": colors.primary ?? "#52796f",
    "--rw-bg": colors.background ?? "#ffffff",
    "--rw-text": colors.text ?? "#1a1a2e",
    "--rw-border": colors.border ?? "#e5e7eb",
    "--rw-radius": borderRadius ?? "8px",
    borderRadius: borderRadius ?? "8px",
    padding: "16px",
    background: colors.background ?? "#ffffff",
    color: colors.text ?? "#1a1a2e",
  } as React.CSSProperties;

  return (
    <div
      className="text-sm leading-normal antialiased"
      style={containerStyle}
      role="region"
      aria-label={content.headerText ?? "Video Testimonials"}
    >
      {testimonials.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-sm">
          No video testimonials available.
        </div>
      ) : (
        <div
          className={layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "flex flex-col gap-4"}
        >
          {testimonials.map((t) => (
            <VideoPlayerCard
              key={t.id}
              testimonial={t}
              profile={profile}
              content={content}
              transcriptPosition={transcriptPosition}
              starFilled={starFilled}
              starEmpty={starEmpty}
            />
          ))}
        </div>
      )}

      {/* Disclaimer */}
      {content.showDisclaimer && (
        <div className="mt-3 p-2.5 bg-gray-50 rounded border border-gray-100">
          <div className="flex items-center gap-1.5 mb-1">
            <Home size={16} className="flex-shrink-0 text-gray-500" />
            <span className="text-[11px] font-semibold text-gray-600">Equal Housing Lender</span>
          </div>
          <p className="text-[10px] leading-snug text-gray-500 mb-1">
            {content.disclaimerText ||
              "This is not a commitment to lend. Programs, rates, terms, and conditions are subject to change without notice."}
          </p>
          <a
            href="https://www.nmlsconsumeraccess.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] no-underline hover:underline"
            style={{ color: "var(--rw-primary, #52796f)" }}
          >
            NMLS Consumer Access
          </a>
        </div>
      )}

      {/* Branding */}
      {content.showBranding !== false && (
        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 text-center">
          Powered by{" "}
          <a
            href="https://repwell.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 no-underline hover:underline"
          >
            RepWell
          </a>
        </div>
      )}
    </div>
  );
}
