/**
 * Build script for embed.js using esbuild.
 *
 * Outputs to public/embed/v1/:
 *   - embed.{hash}.min.js   (production, content-hashed)
 *   - embed.js               (unminified, for debugging)
 *   - manifest.json           (version manifest with hash, size, timestamp)
 *   - Source maps (.map files, not publicly linked)
 *
 * Also maintains a stable redirect target by writing the current hash
 * to manifest.json so Next.js rewrites can serve /embed/v1/embed.min.js.
 *
 * Enforces a 15KB gzipped size budget.
 */

import { build, type BuildOptions } from "esbuild";
import { createHash } from "crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  copyFileSync,
} from "fs";
import { gzipSync, brotliCompressSync, constants } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENTRY = resolve(ROOT, "src/embed/index.ts");
const OUT_DIR = resolve(ROOT, "public/embed/v1");
const MAX_GZIP_BYTES = 15 * 1024; // 15KB

// Read package.json for version
const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
const EMBED_VERSION = pkg.version || "0.1.0";

const common: BuildOptions = {
  entryPoints: [ENTRY],
  bundle: true,
  target: "es2018",
  platform: "browser",
  format: "iife",
  metafile: true,
  external: [],
  treeShaking: true,
  legalComments: "none",
};

interface ManifestEntry {
  version: string;
  hash: string;
  filename: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  buildTimestamp: string;
}

interface Manifest {
  current: ManifestEntry;
  previous: ManifestEntry[];
}

function contentHash(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").slice(0, 12);
}

async function main() {
  console.log("Building embed.js...\n");

  // Ensure output directory exists
  mkdirSync(OUT_DIR, { recursive: true });

  // --- Unminified build (for debugging) ---
  await build({
    ...common,
    outfile: resolve(OUT_DIR, "embed.js"),
    sourcemap: true,
    minify: false,
  });

  const devBuf = readFileSync(resolve(OUT_DIR, "embed.js"));
  console.log(`  embed.js:     ${(devBuf.length / 1024).toFixed(1)} KB`);

  // --- Minified build to temp location ---
  const prodResult = await build({
    ...common,
    outfile: resolve(OUT_DIR, "embed.min.js"),
    sourcemap: true,
    minify: true,
    drop: ["console", "debugger"],
  });

  const minBuf = readFileSync(resolve(OUT_DIR, "embed.min.js"));
  const hash = contentHash(minBuf);
  const hashedFilename = `embed.${hash}.min.js`;

  // Rename to content-hashed filename
  const hashedPath = resolve(OUT_DIR, hashedFilename);
  writeFileSync(hashedPath, minBuf);

  // Move source map for hashed file (not publicly linked)
  const mapBuf = readFileSync(resolve(OUT_DIR, "embed.min.js.map"));
  writeFileSync(resolve(OUT_DIR, `embed.${hash}.min.js.map`), mapBuf);

  // Keep embed.min.js as well (stable URL fallback served by Next.js rewrite)
  // The source map for embed.min.js stays as-is

  // --- Compression stats ---
  const gzipBuf = gzipSync(minBuf, { level: 9 });
  const brotliBuf = brotliCompressSync(minBuf, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  });

  const minSize = minBuf.length;
  const gzipSize = gzipBuf.length;
  const brotliSize = brotliBuf.length;

  // Write pre-compressed files for CDN serving
  writeFileSync(resolve(OUT_DIR, `${hashedFilename}.gz`), gzipBuf);
  writeFileSync(resolve(OUT_DIR, `${hashedFilename}.br`), brotliBuf);
  writeFileSync(resolve(OUT_DIR, "embed.min.js.gz"), gzipBuf);
  writeFileSync(resolve(OUT_DIR, "embed.min.js.br"), brotliBuf);

  console.log(`  embed.min.js: ${(minSize / 1024).toFixed(1)} KB`);
  console.log(`  ${hashedFilename}: ${(minSize / 1024).toFixed(1)} KB`);
  console.log(`  gzipped:      ${(gzipSize / 1024).toFixed(1)} KB`);
  console.log(`  brotli:       ${(brotliSize / 1024).toFixed(1)} KB`);
  console.log();

  // --- Generate manifest.json (before budget check so artifacts exist even on failure) ---
  const currentEntry: ManifestEntry = {
    version: EMBED_VERSION,
    hash,
    filename: hashedFilename,
    size: minSize,
    gzipSize,
    brotliSize,
    buildTimestamp: new Date().toISOString(),
  };

  // Load existing manifest to preserve version history
  const manifestPath = resolve(OUT_DIR, "manifest.json");
  let manifest: Manifest;
  if (existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(readFileSync(manifestPath, "utf-8"));
      const previous: ManifestEntry[] = existing.previous || [];
      // Keep current as previous if hash changed
      if (existing.current && existing.current.hash !== hash) {
        previous.unshift(existing.current);
      }
      // Keep last 10 versions for rollback
      manifest = {
        current: currentEntry,
        previous: previous.slice(0, 10),
      };
    } catch {
      manifest = { current: currentEntry, previous: [] };
    }
  } else {
    manifest = { current: currentEntry, previous: [] };
  }

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\n  manifest.json updated: v${EMBED_VERSION} (${hash})`);

  // --- Copy previous version files for rollback ---
  // Each version is accessible at /embed/v1/{version}/embed.min.js
  const versionDir = resolve(OUT_DIR, EMBED_VERSION);
  mkdirSync(versionDir, { recursive: true });
  copyFileSync(hashedPath, resolve(versionDir, "embed.min.js"));
  copyFileSync(
    resolve(OUT_DIR, `embed.${hash}.min.js.map`),
    resolve(versionDir, "embed.min.js.map")
  );
  console.log(`  Versioned copy: /embed/v1/${EMBED_VERSION}/embed.min.js`);

  // --- Budget check (after manifest/versioned copy so artifacts exist even on failure) ---
  if (gzipSize > MAX_GZIP_BYTES) {
    console.error(
      `\nFAIL: Gzipped size (${gzipSize} bytes) exceeds budget (${MAX_GZIP_BYTES} bytes)`
    );
    process.exit(1);
  }

  console.log(
    `\nPASS: Gzipped size within ${(MAX_GZIP_BYTES / 1024).toFixed(0)} KB budget`
  );

  // --- Print metafile analysis ---
  if (prodResult.metafile) {
    const outputs = prodResult.metafile.outputs;
    for (const [file, meta] of Object.entries(outputs)) {
      if (file.endsWith(".map")) continue;
      console.log(`\n  Bundle inputs for ${file}:`);
      const inputs = Object.entries(meta.inputs).sort(
        (a, b) => b[1].bytesInOutput - a[1].bytesInOutput
      );
      for (const [input, info] of inputs.slice(0, 10)) {
        console.log(
          `    ${input}: ${(info.bytesInOutput / 1024).toFixed(1)} KB`
        );
      }
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
