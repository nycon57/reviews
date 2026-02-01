/**
 * Build script for embed.js using esbuild.
 * Outputs: public/embed.js, public/embed.min.js, and source maps.
 * Reports gzip size and enforces the 15KB budget.
 */

import { build, type BuildOptions } from "esbuild";
import { readFileSync } from "fs";
import { gzipSync } from "zlib";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const ENTRY = resolve(ROOT, "src/embed/index.ts");
const OUT_DIR = resolve(ROOT, "public");
const MAX_GZIP_BYTES = 15 * 1024; // 15KB

const common: BuildOptions = {
  entryPoints: [ENTRY],
  bundle: true,
  target: "es2018",
  platform: "browser",
  format: "iife",
  sourcemap: true,
  metafile: true,
  // Zero external dependencies — bundle everything
  external: [],
  // Tree-shake unused code
  treeShaking: true,
  // Define to strip dev-only code in minified build
  legalComments: "none",
};

async function main() {
  console.log("Building embed.js...\n");

  // Unminified build
  const devResult = await build({
    ...common,
    outfile: resolve(OUT_DIR, "embed.js"),
    minify: false,
  });

  const devSize = readFileSync(resolve(OUT_DIR, "embed.js")).length;
  console.log(`  embed.js:     ${(devSize / 1024).toFixed(1)} KB`);

  // Minified build
  const prodResult = await build({
    ...common,
    outfile: resolve(OUT_DIR, "embed.min.js"),
    minify: true,
    drop: ["console", "debugger"],
  });

  const minBuf = readFileSync(resolve(OUT_DIR, "embed.min.js"));
  const minSize = minBuf.length;
  const gzipBuf = gzipSync(minBuf, { level: 9 });
  const gzipSize = gzipBuf.length;

  console.log(`  embed.min.js: ${(minSize / 1024).toFixed(1)} KB`);
  console.log(`  gzipped:      ${(gzipSize / 1024).toFixed(1)} KB`);
  console.log();

  // Budget check
  if (gzipSize > MAX_GZIP_BYTES) {
    console.error(
      `FAIL: Gzipped size (${gzipSize} bytes) exceeds budget (${MAX_GZIP_BYTES} bytes)`
    );
    process.exit(1);
  }

  console.log(`PASS: Gzipped size within ${(MAX_GZIP_BYTES / 1024).toFixed(0)} KB budget`);

  // Print metafile analysis for the minified build
  if (prodResult.metafile) {
    const outputs = prodResult.metafile.outputs;
    for (const [file, meta] of Object.entries(outputs)) {
      if (file.endsWith(".map")) continue;
      console.log(`\n  Bundle inputs for ${file}:`);
      const inputs = Object.entries(meta.inputs).sort((a, b) => b[1].bytesInOutput - a[1].bytesInOutput);
      for (const [input, info] of inputs.slice(0, 10)) {
        console.log(`    ${input}: ${(info.bytesInOutput / 1024).toFixed(1)} KB`);
      }
    }
  }
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
