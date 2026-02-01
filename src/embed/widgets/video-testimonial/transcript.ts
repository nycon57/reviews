/**
 * Transcript component — builds a scrollable transcript panel that
 * auto-scrolls and highlights the current segment during video playback.
 * All DOM construction uses safe methods — no innerHTML.
 */

import type { VideoTranscriptSegment } from "../../types";
import { el, text } from "../../core/dom-helpers";

/**
 * Builds a transcript panel and returns { element, connectToVideo }.
 * Call connectToVideo(videoElement) to start auto-sync.
 */
export function buildTranscript(
  segments: VideoTranscriptSegment[],
): {
  element: HTMLElement;
  connectToVideo: (video: HTMLVideoElement) => void;
} {
  const container = el("div", "rw-vt__transcript");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", "Video transcript");

  container.appendChild(text("div", "Transcript", "rw-vt__transcript-title"));

  const segElements: HTMLElement[] = [];

  for (const seg of segments) {
    const segEl = el("span", "rw-vt__transcript-seg");
    segEl.textContent = seg.text;
    segEl.dataset.start = String(seg.start);
    segEl.dataset.end = String(seg.end);
    segElements.push(segEl);
    container.appendChild(segEl);
    // Add a space between segments for readability
    container.appendChild(document.createTextNode(" "));
  }

  let activeIndex = -1;

  function connectToVideo(video: HTMLVideoElement): void {
    // Click to seek
    for (let i = 0; i < segElements.length; i++) {
      const segEl = segElements[i];
      segEl.style.cursor = "pointer";
      segEl.addEventListener("click", () => {
        video.currentTime = segments[i].start;
        if (video.paused) video.play();
      });
    }

    // Auto-highlight and scroll on timeupdate
    video.addEventListener("timeupdate", () => {
      const t = video.currentTime;
      let newIndex = -1;

      for (let i = 0; i < segments.length; i++) {
        if (t >= segments[i].start && t < segments[i].end) {
          newIndex = i;
          break;
        }
      }

      if (newIndex !== activeIndex) {
        if (activeIndex >= 0 && segElements[activeIndex]) {
          segElements[activeIndex].classList.remove("rw-vt__transcript-seg--active");
        }
        activeIndex = newIndex;
        if (activeIndex >= 0 && segElements[activeIndex]) {
          segElements[activeIndex].classList.add("rw-vt__transcript-seg--active");
          // Auto-scroll into view
          segElements[activeIndex].scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      }
    });
  }

  return { element: container, connectToVideo };
}
