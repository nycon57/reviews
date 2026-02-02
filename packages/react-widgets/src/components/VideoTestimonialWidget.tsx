import { useState, useRef } from "react";
import type { BaseWidgetProps, VideoTestimonial } from "../types";
import { useWidgetConfig } from "../hooks/useWidgetConfig";
import { useWidgetEvents } from "../hooks/useWidgetEvents";
import { WidgetShell } from "../utils/WidgetShell";
import { Stars } from "../utils/Stars";

const DEFAULT_API_BASE = "https://app.repwell.com";

function VideoPlayer({
  testimonial,
  transcriptPosition,
  onPlay,
}: {
  testimonial: VideoTestimonial;
  transcriptPosition: "below" | "side" | "hidden";
  onPlay: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    setPlaying(true);
    onPlay();
  };

  return (
    <div className={`rw-video__player rw-video__player--transcript-${transcriptPosition}`}>
      <div className="rw-video__media">
        <video
          ref={videoRef}
          src={testimonial.video_url}
          poster={testimonial.poster_url ?? undefined}
          controls
          preload="none"
          onPlay={handlePlay}
          className="rw-video__element"
        />
        {!playing && (
          <button
            type="button"
            className="rw-video__play-btn"
            onClick={() => videoRef.current?.play()}
            aria-label={`Play video from ${testimonial.reviewer_name ?? "Anonymous"}`}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      <div className="rw-video__info">
        {testimonial.reviewer_name && (
          <span className="rw-video__name">{testimonial.reviewer_name}</span>
        )}
        {testimonial.reviewer_title && (
          <span className="rw-video__title">{testimonial.reviewer_title}</span>
        )}
        <Stars rating={testimonial.rating} />
      </div>

      {transcriptPosition !== "hidden" && testimonial.transcript && testimonial.transcript.length > 0 && (
        <div className="rw-video__transcript">
          {testimonial.transcript.map((seg, i) => (
            <p key={i} className="rw-video__transcript-seg">
              {seg.text}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Video Testimonial Widget.
 * Displays video testimonials with poster images, player controls, and optional transcripts.
 */
export function VideoTestimonialWidget({
  widgetId,
  config: inlineConfig,
  reviews: inlineReviews,
  apiBaseUrl = DEFAULT_API_BASE,
  className,
  style,
  onEvent,
  fallback,
}: BaseWidgetProps) {
  const { config, loading, error } = useWidgetConfig({
    widgetId,
    config: inlineConfig,
    reviews: inlineReviews,
    apiBaseUrl,
  });

  const resolvedId = widgetId ?? config?.widget_id ?? "unknown";
  const { emit } = useWidgetEvents({ widgetId: resolvedId, onEvent });

  const cfg = config?.config;
  const content = cfg?.content;
  const videoCfg = cfg?.video;
  const testimonials = config?.video_testimonials ?? [];
  const layout = videoCfg?.layout ?? "list";
  const transcriptPosition = videoCfg?.transcriptPosition ?? "below";

  return (
    <WidgetShell
      className={className}
      style={style}
      ariaLabel={content?.headerText ?? "Video Testimonials"}
      loading={loading}
      error={error}
      fallback={fallback}
    >
      {config && (
        <>
          {content?.showHeader !== false && content?.headerText && (
            <h3 className="rw-video__header">{content.headerText}</h3>
          )}

          {testimonials.length === 0 ? (
            <div className="rw-empty">No testimonials yet.</div>
          ) : (
            <div className={`rw-video__grid rw-video__grid--${layout}`}>
              {testimonials.map((t) => (
                <VideoPlayer
                  key={t.id}
                  testimonial={t}
                  transcriptPosition={transcriptPosition}
                  onPlay={() => emit("click", { video_id: t.id })}
                />
              ))}
            </div>
          )}

          {content?.showBranding !== false && (
            <div className="rw-branding">
              Powered by{" "}
              <a href="https://repwell.com" target="_blank" rel="noopener noreferrer">
                RepWell
              </a>
            </div>
          )}
        </>
      )}
    </WidgetShell>
  );
}
