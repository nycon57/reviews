import { describe, expect, it } from "vitest";
import {
  buildDisplayLines,
  buildTimelineWords,
  findActiveWordIndex,
} from "@/remotion/utils/caption-timing";

describe("buildTimelineWords", () => {
  it("uses word timestamps when provided", () => {
    const words = buildTimelineWords({
      captions: [],
      wordTimestamps: [
        { word: "Hello", startMs: 0, endMs: 120, confidence: 0.9 },
        { word: "world", startMs: 120, endMs: 120, confidence: 0.9 }, // zero-duration
        { word: "today", startMs: 200, endMs: 260, confidence: 0.9 }, // overlap handled
      ],
      fps: 30,
      startFrame: 0,
    });

    expect(words).toHaveLength(3);
    expect(words[1].startFrame).toBeGreaterThanOrEqual(words[0].startFrame);
    expect(words[1].endFrame).toBeGreaterThanOrEqual(words[1].startFrame);
    expect(words[2].startFrame).toBeGreaterThanOrEqual(words[1].startFrame);
  });

  it("falls back to evenly split caption timing", () => {
    const words = buildTimelineWords({
      captions: [{ text: "Great service team", startMs: 0, endMs: 900 }],
      fps: 30,
      startFrame: 0,
    });

    expect(words).toHaveLength(3);
    expect(words[0].text).toBe("Great");
    expect(words[2].endFrame).toBeGreaterThan(words[0].startFrame);
  });
});

describe("findActiveWordIndex", () => {
  it("switches active word based on start frame only", () => {
    const words = [
      { text: "one", startFrame: 0, endFrame: 5 },
      { text: "two", startFrame: 5, endFrame: 5 },
      { text: "three", startFrame: 8, endFrame: 12 },
    ];

    expect(findActiveWordIndex(words, -1)).toBe(-1);
    expect(findActiveWordIndex(words, 0)).toBe(0);
    expect(findActiveWordIndex(words, 5)).toBe(1);
    expect(findActiveWordIndex(words, 10)).toBe(2);
  });
});

describe("buildDisplayLines", () => {
  it("chunks output into max 4 words per line", () => {
    const words = Array.from({ length: 9 }, (_, index) => ({
      text: `w${index + 1}`,
      startFrame: index,
      endFrame: index + 1,
    }));

    const lines = buildDisplayLines(words, 4, 4, 2);

    expect(lines.length).toBeGreaterThan(0);
    expect(lines.every((line) => line.length <= 4)).toBe(true);
    expect(lines.flat().length).toBeLessThanOrEqual(8);
  });
});
