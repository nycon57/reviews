/**
 * Manual end-to-end test for the Clip pipeline (not part of the app).
 * Renders a real video testimonial response through renderClipForResponse
 * using the local backend and reports the output path.
 *
 * Run: npx tsx --env-file=.env scripts/test-clip-render.ts <responseId> <orgId>
 */
import { renderClipForResponse } from "../src/lib/share-studio/clip-renderer";

async function main() {
  const [responseId, organizationId] = process.argv.slice(2);
  if (!responseId || !organizationId) {
    console.error("Usage: tsx scripts/test-clip-render.ts <responseId> <orgId>");
    process.exit(1);
  }

  console.log("Rendering clip...", { responseId, organizationId });
  const started = Date.now();

  const result = await renderClipForResponse(responseId, organizationId, {
    format: "9:16",
  });

  console.log("RENDER OK in", Math.round((Date.now() - started) / 1000), "s");
  console.log({
    outputPath: result.outputPath,
    width: result.width,
    height: result.height,
    durationSeconds: result.durationSeconds,
    appliedOptions: result.appliedOptions,
  });
}

main().catch((err) => {
  console.error("RENDER FAILED:", err);
  process.exit(1);
});
