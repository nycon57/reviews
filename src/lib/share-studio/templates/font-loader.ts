/**
 * Font loader for resvg-js SVG → PNG rendering.
 *
 * Fetches Inter TTF fonts from Google Fonts CDN and caches them in memory.
 * Same URLs as satori-renderer.ts to keep bundle consistent.
 *
 * resvg supports `fontBuffers: Buffer[]` at runtime (added v2.5.0) but
 * the TypeScript types are outdated and don't include it. We cast through
 * the type system when passing to resvg constructor.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

let fontFileCache: string[] | null = null;
let fontFilePromise: Promise<string[]> | null = null;

const FONT_URLS = [
  // Inter Regular (400)
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
  // Inter Bold (700)
  "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf",
];

/**
 * Load Inter fonts and return file paths for resvg's `fontFiles` option.
 * Downloads on first call, then returns cached paths.
 * Concurrent callers share the same pending promise to avoid duplicate downloads.
 */
export async function loadFontFiles(): Promise<string[]> {
  if (fontFileCache) return fontFileCache;
  if (fontFilePromise) return fontFilePromise;

  fontFilePromise = (async () => {
    try {
      const fontDir = join(tmpdir(), "repwell-fonts");
      if (!existsSync(fontDir)) {
        mkdirSync(fontDir, { recursive: true });
      }

      const paths: string[] = [];

      await Promise.all(
        FONT_URLS.map(async (url, i) => {
          const filePath = join(fontDir, `inter-${i}.ttf`);

          // Skip download if already on disk
          if (existsSync(filePath)) {
            paths[i] = filePath;
            return;
          }

          try {
            const res = await fetch(url, {
              signal: AbortSignal.timeout(10_000),
            });
            if (!res.ok) return;
            const ab = await res.arrayBuffer();
            writeFileSync(filePath, Buffer.from(ab));
            paths[i] = filePath;
          } catch {
            // Font loading failure (including timeout) is non-fatal; text will use fallback
          }
        }),
      );

      const validPaths = paths.filter(Boolean);
      fontFileCache = validPaths;
      return validPaths;
    } catch {
      fontFilePromise = null;
      return [];
    }
  })();

  return fontFilePromise;
}
