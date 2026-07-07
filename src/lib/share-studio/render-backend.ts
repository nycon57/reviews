/**
 * Render backend selection (ADR 0003).
 *
 * Production target is Remotion Lambda; the first implementation pass runs
 * the in-process renderer everywhere and stubs Lambda dispatch behind the
 * RENDER_BACKEND env flag so the worker code is already written against the
 * dispatch seam.
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";

export type RenderBackend = "local" | "lambda";

export function getRenderBackend(): RenderBackend {
  const value = (process.env.RENDER_BACKEND || "local").toLowerCase();
  if (value === "lambda") return "lambda";
  return "local";
}

export interface CompositionRenderRequest {
  /** Registered composition id, e.g. "VideoTestimonial-9-16" */
  compositionId: string;
  inputProps: Record<string, unknown>;
  /** Filename stem for the temp output; a uuid is appended. */
  outputName: string;
}

export interface CompositionRenderResult {
  outputPath: string;
  width: number;
  height: number;
  durationSeconds: number;
  cleanup: () => Promise<void>;
}

let bundledApp: string | null = null;

async function getBundleLocation(): Promise<string> {
  if (bundledApp) {
    try {
      await fs.stat(bundledApp);
      return bundledApp;
    } catch {
      bundledApp = null;
    }
  }

  bundledApp = await bundle({
    entryPoint: path.join(process.cwd(), "src/remotion/index.tsx"),
  });

  return bundledApp;
}

async function renderCompositionLocally(
  request: CompositionRenderRequest
): Promise<CompositionRenderResult> {
  const serveUrl = await getBundleLocation();

  const composition = await selectComposition({
    serveUrl,
    id: request.compositionId,
    inputProps: request.inputProps,
  });

  const outputPath = path.join(
    "/tmp",
    `${request.outputName}-${crypto.randomUUID()}.mp4`
  );

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: request.inputProps,
    concurrency: 2,
    imageFormat: "jpeg",
    jpegQuality: 84,
  });

  return {
    outputPath,
    width: composition.width,
    height: composition.height,
    durationSeconds: composition.durationInFrames / composition.fps,
    cleanup: async () => {
      await fs.unlink(outputPath).catch(() => undefined);
    },
  };
}

async function renderCompositionOnLambda(
  request: CompositionRenderRequest
): Promise<CompositionRenderResult> {
  // Stub per ADR 0003 first pass: the dispatch seam exists, the AWS side
  // does not. Implement with @remotion/lambda renderMediaOnLambda +
  // progress polling once the AWS account and deployed site/function exist.
  throw new Error(
    `Remotion Lambda backend is not configured (requested composition ${request.compositionId}). ` +
      "Set RENDER_BACKEND=local or deploy the Lambda site/function (see docs/adr/0003)."
  );
}

/**
 * Render a registered composition to an MP4 via the configured backend.
 * Both backends resolve with a local file path the worker can upload.
 */
export async function renderComposition(
  request: CompositionRenderRequest
): Promise<CompositionRenderResult> {
  if (getRenderBackend() === "lambda") {
    return renderCompositionOnLambda(request);
  }
  return renderCompositionLocally(request);
}
