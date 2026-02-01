/**
 * Embed deployment script.
 *
 * Orchestrates the full embed.js build and deploy pipeline:
 *   1. TypeScript compile via esbuild
 *   2. Content-hash the output
 *   3. Update manifest.json
 *   4. Create versioned rollback copy
 *   5. Verify size budget
 *
 * Since the project uses Vercel, deployment is handled by Vercel's build
 * pipeline. This script is called as a pre-build step to ensure the embed
 * assets are fresh in public/embed/v1/ before `next build` runs.
 *
 * Usage:
 *   npx tsx scripts/deploy-embed.ts          # Build and verify
 *   npx tsx scripts/deploy-embed.ts --verify # Verify only (check existing build)
 */

import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { gzipSync } from "zlib";
import { execFileSync } from "child_process";
import type { EmbedManifest } from "../src/lib/widgets/manifest-types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "public/embed/v1/manifest.json");
const MAX_GZIP_BYTES = 32 * 1024; // 32KB — 9 widget types

function verify(): boolean {
  console.log("Verifying embed build...\n");

  if (!existsSync(MANIFEST_PATH)) {
    console.error("FAIL: manifest.json not found. Run build:embed first.");
    return false;
  }

  const manifest: EmbedManifest = JSON.parse(
    readFileSync(MANIFEST_PATH, "utf-8")
  );
  const { current } = manifest;

  // Check the hashed file exists
  const hashedPath = resolve(ROOT, "public/embed/v1", current.filename);
  if (!existsSync(hashedPath)) {
    console.error(`FAIL: ${current.filename} not found.`);
    return false;
  }

  // Check the stable URL file exists
  const stablePath = resolve(ROOT, "public/embed/v1/embed.min.js");
  if (!existsSync(stablePath)) {
    console.error("FAIL: embed.min.js (stable URL) not found.");
    return false;
  }

  // Verify gzip size
  const buf = readFileSync(hashedPath);
  const gzipBuf = gzipSync(buf, { level: 9 });

  if (gzipBuf.length > MAX_GZIP_BYTES) {
    console.error(
      `FAIL: Gzipped size (${gzipBuf.length} bytes) exceeds budget (${MAX_GZIP_BYTES} bytes)`
    );
    return false;
  }

  // Check versioned rollback copy
  const versionedFile = resolve(
    ROOT,
    "public/embed/v1",
    current.version,
    "embed.min.js"
  );
  if (!existsSync(versionedFile)) {
    console.warn(
      `WARN: Versioned rollback copy missing at /embed/v1/${current.version}/embed.min.js`
    );
  }

  console.log(`  Version:    ${current.version}`);
  console.log(`  Hash:       ${current.hash}`);
  console.log(`  Filename:   ${current.filename}`);
  console.log(`  Size:       ${(current.size / 1024).toFixed(1)} KB`);
  console.log(`  Gzipped:    ${(current.gzipSize / 1024).toFixed(1)} KB`);
  console.log(`  Brotli:     ${(current.brotliSize / 1024).toFixed(1)} KB`);
  console.log(`  Built:      ${current.buildTimestamp}`);
  console.log(`  Rollbacks:  ${manifest.previous.length} previous versions`);
  console.log("\nPASS: All verification checks passed.");
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes("--verify");

  if (!verifyOnly) {
    console.log("Running embed build pipeline...\n");
    console.log("Step 1/2: Building embed.js...");
    execFileSync("npx", ["tsx", "scripts/build-embed.ts"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    console.log("\nStep 2/2: Verifying build output...");
  }

  const passed = verify();
  process.exit(passed ? 0 : 1);
}

main().catch((err) => {
  console.error("Deploy failed:", err);
  process.exit(1);
});
