import type { CaptionSegment, WordTimestamp } from "@/remotion/types";

export interface TimelineWord {
  text: string;
  startFrame: number;
  endFrame: number;
}

interface BuildTimelineWordsInput {
  captions: CaptionSegment[];
  wordTimestamps?: WordTimestamp[] | null;
  fps: number;
  startFrame: number;
}

export function buildTimelineWords(input: BuildTimelineWordsInput): TimelineWord[] {
  const { captions, wordTimestamps, fps, startFrame } = input;

  if (wordTimestamps && wordTimestamps.length > 0) {
    const orderedWords = [...wordTimestamps].sort(
      (a, b) => a.startMs - b.startMs || a.endMs - b.endMs
    );

    return orderedWords
      .map((word, index): TimelineWord | null => {
        const text = word.word.trim();
        if (!text) return null;

        const nextWord = orderedWords[index + 1];
        const startMs = Math.max(0, Math.round(word.startMs));
        const minimumEndMs = nextWord ? Math.max(startMs, Math.round(nextWord.startMs)) : startMs + 120;
        const endMs = Math.max(minimumEndMs, Math.round(word.endMs));

        return {
          text,
          startFrame: startFrame + msToFrames(startMs, fps),
          endFrame: startFrame + msToFrames(endMs, fps),
        };
      })
      .filter((word): word is TimelineWord => word !== null);
  }

  const fallbackWords: TimelineWord[] = [];

  captions.forEach((segment) => {
    const segmentWords = segment.text.trim().split(/\s+/).filter(Boolean);
    if (!segmentWords.length) return;

    const segmentDuration = Math.max(1, segment.endMs - segment.startMs);
    const wordDuration = segmentDuration / segmentWords.length;

    segmentWords.forEach((wordText, index) => {
      const wordStartMs = segment.startMs + index * wordDuration;
      const wordEndMs =
        index === segmentWords.length - 1
          ? segment.endMs
          : segment.startMs + (index + 1) * wordDuration;

      fallbackWords.push({
        text: wordText,
        startFrame: startFrame + msToFrames(wordStartMs, fps),
        endFrame: startFrame + msToFrames(Math.max(wordStartMs, wordEndMs), fps),
      });
    });
  });

  return fallbackWords;
}

export function findActiveWordIndex(words: TimelineWord[], frame: number): number {
  if (!words.length) return -1;

  let activeIndex = -1;
  for (let i = 0; i < words.length; i++) {
    if (frame >= words[i].startFrame) {
      activeIndex = i;
    } else {
      break;
    }
  }

  return activeIndex;
}

export function buildDisplayLines(
  words: TimelineWord[],
  activeIndex: number,
  wordsPerLine: number = 4,
  maxLines: number = 2
): TimelineWord[][] {
  if (!words.length) return [];

  const safeActiveIndex = activeIndex < 0 ? 0 : Math.min(activeIndex, words.length - 1);
  const windowSize = Math.max(wordsPerLine, wordsPerLine * maxLines);
  let windowStart = Math.max(0, safeActiveIndex - Math.floor(windowSize / 2));
  let windowEnd = Math.min(words.length, windowStart + windowSize);

  if (windowEnd - windowStart < windowSize) {
    windowStart = Math.max(0, windowEnd - windowSize);
  }

  const windowWords = words.slice(windowStart, windowEnd);
  const lines: TimelineWord[][] = [];

  for (let index = 0; index < windowWords.length; index += wordsPerLine) {
    lines.push(windowWords.slice(index, index + wordsPerLine));
  }

  return lines;
}

function msToFrames(milliseconds: number, fps: number): number {
  return Math.floor((milliseconds / 1000) * fps);
}
