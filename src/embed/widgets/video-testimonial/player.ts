/**
 * Video player component — builds a lazy-loading HTML5 video player with custom controls.
 * Poster image shown initially; video source fetched only on play intent.
 * All DOM construction uses safe methods (createElement/textContent) — no innerHTML.
 */

import type { PublicWidgetConfig, VideoTestimonial } from "../../types";
import { el } from "../../core/dom-helpers";
import { trackClick } from "../../core/event-tracker";

const PLAY_SVG_PATH = "M8 5v14l11-7z";
const PAUSE_SVG_PATH = "M6 19h4V5H6v14zm8-14v14h4V5h-4z";
const VOLUME_SVG_PATH = "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z";
const VOLUME_MUTE_SVG_PATH = "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z";
const FULLSCREEN_SVG_PATH = "M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z";

function createSVGButton(pathD: string, label: string, className: string): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = className;
  btn.type = "button";
  btn.setAttribute("aria-label", label);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathD);
  svg.appendChild(path);
  btn.appendChild(svg);
  return btn;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface PlayerCallbacks {
  onPlay?: (videoId: string) => void;
  onPause?: (videoId: string) => void;
  onComplete?: (videoId: string) => void;
  onProgress?: (videoId: string, milestone: number) => void;
}

/**
 * Builds a lazy-loading video player with custom controls inside Shadow DOM.
 * Returns the player wrapper element.
 */
export function buildVideoPlayer(
  testimonial: VideoTestimonial,
  apiBase: string,
  config: Pick<PublicWidgetConfig, "widget_id" | "entity_type" | "entity_id" | "override_applied">,
  callbacks?: PlayerCallbacks,
): HTMLElement {
  const wrap = el("div", "rw-vt__player-wrap");
  wrap.setAttribute("role", "region");
  wrap.setAttribute("aria-label", `Video testimonial by ${testimonial.reviewer_name ?? "Anonymous"}`);

  // Track which progress milestones have been sent (25/50/75/100)
  const milestonesSent = new Set<number>();

  // Poster image
  if (testimonial.poster_url) {
    const poster = document.createElement("img");
    poster.className = "rw-vt__poster";
    poster.src = testimonial.poster_url;
    poster.alt = `Video thumbnail: ${testimonial.reviewer_name ?? "testimonial"}`;
    poster.loading = "lazy";
    wrap.appendChild(poster);
  } else {
    const placeholder = el("div", "rw-vt__poster-placeholder");
    placeholder.textContent = "Video Testimonial";
    wrap.appendChild(placeholder);
  }

  // Play button overlay
  const playBtn = el("div", "rw-vt__play-btn");
  playBtn.setAttribute("role", "button");
  playBtn.setAttribute("tabindex", "0");
  playBtn.setAttribute("aria-label", "Play video");
  const playIcon = el("div", "rw-vt__play-icon");
  const playSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  playSvg.setAttribute("viewBox", "0 0 24 24");
  playSvg.setAttribute("aria-hidden", "true");
  const playPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  playPath.setAttribute("d", PLAY_SVG_PATH);
  playSvg.appendChild(playPath);
  playIcon.appendChild(playSvg);
  playBtn.appendChild(playIcon);
  wrap.appendChild(playBtn);

  // Video element (created but src not set until play intent)
  let video: HTMLVideoElement | null = null;
  let videoLoaded = false;
  let hasError = false;

  // Error state
  const errorEl = el("div", "rw-vt__error");
  errorEl.style.display = "none";
  const errorText = el("div", "rw-vt__error-text");
  errorText.textContent = "Failed to load video";
  errorEl.appendChild(errorText);
  const retryBtn = document.createElement("button");
  retryBtn.className = "rw-vt__retry-btn";
  retryBtn.textContent = "Retry";
  retryBtn.type = "button";
  errorEl.appendChild(retryBtn);
  wrap.appendChild(errorEl);

  // Custom controls
  const controls = el("div", "rw-vt__controls");
  const playPauseBtn = createSVGButton(PLAY_SVG_PATH, "Play", "rw-vt__ctrl-btn");
  controls.appendChild(playPauseBtn);

  const timeDisplay = el("span", "rw-vt__time");
  timeDisplay.textContent = "0:00 / 0:00";

  const progressWrap = el("div", "rw-vt__progress");
  progressWrap.setAttribute("role", "slider");
  progressWrap.setAttribute("aria-label", "Video progress");
  progressWrap.setAttribute("aria-valuemin", "0");
  progressWrap.setAttribute("aria-valuemax", "100");
  progressWrap.setAttribute("aria-valuenow", "0");
  const progressBar = el("div", "rw-vt__progress-bar");
  progressBar.style.width = "0%";
  progressWrap.appendChild(progressBar);
  controls.appendChild(progressWrap);
  controls.appendChild(timeDisplay);

  // Volume controls
  const volumeWrap = el("div", "rw-vt__volume-wrap");
  const volumeBtn = createSVGButton(VOLUME_SVG_PATH, "Mute", "rw-vt__ctrl-btn");
  volumeWrap.appendChild(volumeBtn);
  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.className = "rw-vt__volume-slider";
  volumeSlider.min = "0";
  volumeSlider.max = "1";
  volumeSlider.step = "0.05";
  volumeSlider.value = "1";
  volumeSlider.setAttribute("aria-label", "Volume");
  volumeWrap.appendChild(volumeSlider);
  controls.appendChild(volumeWrap);

  // Fullscreen button
  const fsBtn = createSVGButton(FULLSCREEN_SVG_PATH, "Fullscreen", "rw-vt__ctrl-btn");
  controls.appendChild(fsBtn);
  wrap.appendChild(controls);

  function updatePlayPauseIcon(playing: boolean): void {
    const svg = playPauseBtn.querySelector("svg");
    if (!svg) return;
    const path = svg.querySelector("path");
    if (!path) return;
    path.setAttribute("d", playing ? PAUSE_SVG_PATH : PLAY_SVG_PATH);
    playPauseBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  }

  function updateVolumeIcon(muted: boolean): void {
    const svg = volumeBtn.querySelector("svg");
    if (!svg) return;
    const path = svg.querySelector("path");
    if (!path) return;
    path.setAttribute("d", muted ? VOLUME_MUTE_SVG_PATH : VOLUME_SVG_PATH);
    volumeBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
  }

  function showError(): void {
    hasError = true;
    errorEl.style.display = "";
    playBtn.classList.add("rw-vt__play-btn--hidden");
    const poster = wrap.querySelector(".rw-vt__poster") as HTMLElement | null;
    if (poster) poster.classList.add("rw-vt__poster--hidden");
  }

  function loadAndPlay(): void {
    if (hasError) {
      // Reset error state for retry
      hasError = false;
      errorEl.style.display = "none";
    }

    if (!videoLoaded) {
      video = document.createElement("video");
      video.className = "rw-vt__video";
      video.playsInline = true;
      video.preload = "metadata";
      video.src = testimonial.video_url;

      video.addEventListener("error", () => {
        showError();
      });

      video.addEventListener("loadedmetadata", () => {
        timeDisplay.textContent = `0:00 / ${formatTime(video!.duration)}`;
        progressWrap.setAttribute("aria-valuemax", String(Math.floor(video!.duration)));
      });

      video.addEventListener("timeupdate", () => {
        if (!video) return;
        const pct = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0;
        progressBar.style.width = `${pct}%`;
        timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
        progressWrap.setAttribute("aria-valuenow", String(Math.floor(video.currentTime)));

        // Check milestones
        if (video.duration > 0) {
          const progress = video.currentTime / video.duration;
          const milestones = [25, 50, 75, 100];
          for (const m of milestones) {
            if (progress >= m / 100 && !milestonesSent.has(m)) {
              milestonesSent.add(m);
              trackClick(apiBase, config, "video_progress", {
                video_id: testimonial.id,
                milestone: m,
                current_time: Math.round(video.currentTime),
                duration: Math.round(video.duration),
              });
              callbacks?.onProgress?.(testimonial.id, m);
            }
          }
        }
      });

      video.addEventListener("ended", () => {
        updatePlayPauseIcon(false);
        playBtn.classList.remove("rw-vt__play-btn--hidden");
        controls.classList.remove("rw-vt__controls--visible");
        trackClick(apiBase, config, "video_complete", {
          video_id: testimonial.id,
          duration: Math.round(video!.duration),
        });
        callbacks?.onComplete?.(testimonial.id);
      });

      video.addEventListener("play", () => {
        updatePlayPauseIcon(true);
        if (video!.currentTime === 0) {
          milestonesSent.clear();
        }
      });

      video.addEventListener("pause", () => {
        updatePlayPauseIcon(false);
      });

      // Insert before controls but after poster
      wrap.insertBefore(video, controls);
      videoLoaded = true;

      // Notify transcript (or other listeners) that a new video element exists
      const extWrap = wrap as HTMLElement & { _onVideoCreated?: (v: HTMLVideoElement) => void };
      extWrap._onVideoCreated?.(video);
    }

    if (video) {
      const poster = wrap.querySelector(".rw-vt__poster") as HTMLElement | null;
      if (poster) poster.classList.add("rw-vt__poster--hidden");
      playBtn.classList.add("rw-vt__play-btn--hidden");
      controls.classList.add("rw-vt__controls--visible");

      video.play().then(() => {
        trackClick(apiBase, config, "video_play", { video_id: testimonial.id });
        callbacks?.onPlay?.(testimonial.id);
      }).catch(() => {
        // Autoplay may be blocked; show play button again
        playBtn.classList.remove("rw-vt__play-btn--hidden");
      });
    }
  }

  // Play intent: click or keyboard
  const handlePlayIntent = (): void => { loadAndPlay(); };
  playBtn.addEventListener("click", handlePlayIntent);
  playBtn.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handlePlayIntent(); }
  });

  // Retry button
  retryBtn.addEventListener("click", () => {
    if (video) {
      video.remove();
      video = null;
      videoLoaded = false;
    }
    milestonesSent.clear();
    loadAndPlay();
  });

  // Play/pause toggle
  playPauseBtn.addEventListener("click", () => {
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
      trackClick(apiBase, config, "video_pause", {
        video_id: testimonial.id,
        current_time: Math.round(video.currentTime),
        duration: Math.round(video.duration),
      });
      callbacks?.onPause?.(testimonial.id);
    }
  });

  // Progress seeking
  progressWrap.addEventListener("click", (e: MouseEvent) => {
    if (!video) return;
    const rect = progressWrap.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  });

  // Volume controls
  volumeBtn.addEventListener("click", () => {
    if (!video) return;
    video.muted = !video.muted;
    updateVolumeIcon(video.muted);
    volumeSlider.value = video.muted ? "0" : String(video.volume);
  });

  volumeSlider.addEventListener("input", () => {
    if (!video) return;
    const vol = parseFloat(volumeSlider.value);
    video.volume = vol;
    video.muted = vol === 0;
    updateVolumeIcon(video.muted);
  });

  // Fullscreen
  fsBtn.addEventListener("click", () => {
    if (wrap.requestFullscreen) {
      wrap.requestFullscreen();
    }
  });

  // Expose video element reference and callback for transcript sync
  const extWrap = wrap as HTMLElement & {
    _getVideo: () => HTMLVideoElement | null;
    _onVideoCreated?: (v: HTMLVideoElement) => void;
  };
  extWrap._getVideo = () => video;

  return wrap;
}
