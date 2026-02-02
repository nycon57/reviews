/**
 * Performance benchmark: embed.js bundle size assertion.
 * Enforces the gzipped size budget for CI pipelines.
 *
 * Budget: 38KB gzipped — accommodates 9 widget types, filter controls,
 * i18n, CSS sanitizer, and JS hooks (aligned with build-embed.ts).
 *
 * Uses Vitest (not Playwright) since this only needs filesystem access.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { gzipSync } from "zlib";
import { resolve } from "path";

const ROOT = resolve(__dirname, "../..");
const EMBED_DIR = resolve(ROOT, "public/embed/v1");
const MAX_GZIP_BYTES = 38 * 1024; // 38KB — matches build-embed.ts budget for 9 widget types

describe("Embed Bundle Size", () => {
  it("embed.min.js exists", () => {
    const embedPath = resolve(EMBED_DIR, "embed.min.js");
    expect(existsSync(embedPath)).toBe(true);
  });

  it("embed.min.js is under 38KB gzipped", () => {
    const embedPath = resolve(EMBED_DIR, "embed.min.js");
    if (!existsSync(embedPath)) {
      // Build may not have run — skip gracefully in dev
      console.warn(
        "embed.min.js not found. Run `npm run build:embed` first."
      );
      return;
    }

    const raw = readFileSync(embedPath);
    const gzipped = gzipSync(raw, { level: 9 });

    console.log(`  Raw size:     ${(raw.length / 1024).toFixed(1)} KB`);
    console.log(`  Gzipped size: ${(gzipped.length / 1024).toFixed(1)} KB`);
    console.log(`  Budget:       ${(MAX_GZIP_BYTES / 1024).toFixed(1)} KB`);

    expect(gzipped.length).toBeLessThanOrEqual(MAX_GZIP_BYTES);
  });

  it("manifest.json reports correct size", () => {
    const manifestPath = resolve(EMBED_DIR, "manifest.json");
    if (!existsSync(manifestPath)) {
      console.warn("manifest.json not found. Run `npm run build:embed` first.");
      return;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest.current).toBeDefined();
    expect(manifest.current.gzipSize).toBeGreaterThan(0);
    expect(manifest.current.size).toBeGreaterThan(0);

    // Cross-verify: manifest gzip size matches actual gzip size
    const embedPath = resolve(EMBED_DIR, "embed.min.js");
    if (existsSync(embedPath)) {
      const raw = readFileSync(embedPath);
      const gzipped = gzipSync(raw, { level: 9 });
      // Allow 5% tolerance for different gzip implementations
      const tolerance = Math.ceil(gzipped.length * 0.05);
      expect(Math.abs(manifest.current.gzipSize - gzipped.length)).toBeLessThan(
        tolerance
      );
    }
  });

  it("pre-compressed .gz file exists", () => {
    const gzPath = resolve(EMBED_DIR, "embed.min.js.gz");
    if (!existsSync(gzPath)) {
      console.warn("embed.min.js.gz not found. Run `npm run build:embed` first.");
      return;
    }
    const gz = readFileSync(gzPath);
    expect(gz.length).toBeGreaterThan(0);
    expect(gz.length).toBeLessThanOrEqual(MAX_GZIP_BYTES);
  });
});
