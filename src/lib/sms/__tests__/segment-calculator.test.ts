import { describe, it, expect } from "vitest";
import {
  calculateSegments,
  detectEncoding,
  gsm7Length,
} from "../segment-calculator";

describe("detectEncoding", () => {
  it("detects GSM-7 for basic ASCII text", () => {
    expect(detectEncoding("Hello world")).toBe("GSM-7");
  });

  it("detects GSM-7 for GSM special chars", () => {
    expect(detectEncoding("Price: £100")).toBe("GSM-7");
  });

  it("detects GSM-7 for extension table characters", () => {
    expect(detectEncoding("Use [brackets]")).toBe("GSM-7");
  });

  it("detects UCS-2 for emoji", () => {
    expect(detectEncoding("Hello 👋")).toBe("UCS-2");
  });

  it("detects UCS-2 for Chinese characters", () => {
    expect(detectEncoding("你好")).toBe("UCS-2");
  });

  it("detects UCS-2 for accented characters not in GSM-7", () => {
    // 'ó' is not in GSM-7 basic or extension set
    expect(detectEncoding("adiós")).toBe("UCS-2");
  });

  it("detects GSM-7 for accented characters IN GSM-7", () => {
    // 'é' is part of the GSM-7 basic character set
    expect(detectEncoding("café")).toBe("GSM-7");
  });
});

describe("gsm7Length", () => {
  it("counts basic chars as 1", () => {
    expect(gsm7Length("Hello")).toBe(5);
  });

  it("counts extension chars as 2", () => {
    expect(gsm7Length("[test]")).toBe(8); // [ = 2, t=1, e=1, s=1, t=1, ] = 2
  });

  it("counts euro sign as 2", () => {
    expect(gsm7Length("€100")).toBe(5); // € = 2, 1=1, 0=1, 0=1
  });

  it("handles empty string", () => {
    expect(gsm7Length("")).toBe(0);
  });
});

describe("calculateSegments", () => {
  it("returns 0 segments for empty message", () => {
    const info = calculateSegments("");
    expect(info.segments).toBe(0);
    expect(info.characterCount).toBe(0);
  });

  it("returns 1 segment for short GSM-7 message", () => {
    const info = calculateSegments("Hello, please leave us a review!");
    expect(info.segments).toBe(1);
    expect(info.encoding).toBe("GSM-7");
  });

  it("returns 1 segment for exactly 160 GSM-7 chars", () => {
    const msg = "a".repeat(160);
    const info = calculateSegments(msg);
    expect(info.segments).toBe(1);
    expect(info.characterCount).toBe(160);
  });

  it("returns 2 segments for 161 GSM-7 chars", () => {
    const msg = "a".repeat(161);
    const info = calculateSegments(msg);
    expect(info.segments).toBe(2);
    // 161 chars / 153 per segment = ceil(1.05) = 2
  });

  it("correctly segments long GSM-7 messages", () => {
    const msg = "a".repeat(306); // 306 / 153 = 2
    const info = calculateSegments(msg);
    expect(info.segments).toBe(2);
  });

  it("correctly segments at boundary: 307 chars = 3 segments", () => {
    const msg = "a".repeat(307); // 307 / 153 = ceil(2.006) = 3
    const info = calculateSegments(msg);
    expect(info.segments).toBe(3);
  });

  it("returns 1 segment for short UCS-2 message", () => {
    const info = calculateSegments("Hello 👋");
    expect(info.segments).toBe(1);
    expect(info.encoding).toBe("UCS-2");
  });

  it("returns 1 segment for exactly 70 UCS-2 chars", () => {
    const msg = "á".repeat(70);
    const info = calculateSegments(msg);
    expect(info.segments).toBe(1);
    expect(info.encoding).toBe("UCS-2");
  });

  it("returns 2 segments for 71 UCS-2 chars", () => {
    const msg = "á".repeat(71);
    const info = calculateSegments(msg);
    expect(info.segments).toBe(2);
    expect(info.encoding).toBe("UCS-2");
  });

  it("GSM-7 extension chars increase segment count", () => {
    // 80 brackets = 160 GSM-7 bytes = 1 segment
    const msg80 = "[".repeat(80);
    const info80 = calculateSegments(msg80);
    expect(info80.segments).toBe(1);
    expect(info80.characterCount).toBe(160);

    // 81 brackets = 162 GSM-7 bytes = 2 segments (162/153)
    const msg81 = "[".repeat(81);
    const info81 = calculateSegments(msg81);
    expect(info81.segments).toBe(2);
  });
});
