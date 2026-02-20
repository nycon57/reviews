import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export type ShareStudioVideoFormat = "16:9" | "1:1" | "9:16";

export interface ShareStudioRenderInput {
  title: string;
  quote: string;
  customerName?: string | null;
  rating?: number | null;
  organizationName: string;
  organizationLogoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily?: string;
}

export interface ShareStudioRenderResult {
  outputPath: string;
  width: number;
  height: number;
  durationSeconds?: number;
  format: "png" | "mp4";
  cleanup: () => Promise<void>;
}

let bundledApp: string | null = null;

async function getBundleLocation(): Promise<string> {
  if (bundledApp) {
    try {
      await fs.stat(bundledApp);
      return bundledApp;
    } catch {
      // Cached path is stale, re-bundle
      bundledApp = null;
    }
  }

  bundledApp = await bundle({
    entryPoint: path.join(process.cwd(), "src/remotion/Root.tsx"),
  });

  return bundledApp;
}

function imageCompositionId(format: "og" | ShareStudioVideoFormat): string {
  if (format === "og") return "ShareStudio-OG";
  if (format === "16:9") return "ShareStudio-Image-16-9";
  if (format === "9:16") return "ShareStudio-Image-9-16";
  return "ShareStudio-Image-1-1";
}

function videoCompositionId(format: ShareStudioVideoFormat): string {
  if (format === "1:1") return "ShareStudio-Video-1-1";
  if (format === "9:16") return "ShareStudio-Video-9-16";
  return "ShareStudio-Video-16-9";
}

export async function renderShareStudioStill(options: {
  input: ShareStudioRenderInput;
  format: "og" | ShareStudioVideoFormat;
}): Promise<ShareStudioRenderResult> {
  const serveUrl = await getBundleLocation();
  const compositionId = imageCompositionId(options.format);

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: {
      ...options.input,
      animate: false,
    },
  });

  const outputPath = path.join(
    "/tmp",
    `share-studio-${compositionId.toLowerCase()}-${crypto.randomUUID()}.png`
  );

  await renderStill({
    composition,
    serveUrl,
    output: outputPath,
    imageFormat: "png",
    inputProps: {
      ...options.input,
      animate: false,
    },
    frame: 1,
  });

  return {
    outputPath,
    width: composition.width,
    height: composition.height,
    format: "png",
    cleanup: async () => {
      await fs.unlink(outputPath).catch(() => undefined);
    },
  };
}

export async function renderShareStudioVideo(options: {
  input: ShareStudioRenderInput;
  format: ShareStudioVideoFormat;
}): Promise<ShareStudioRenderResult> {
  const serveUrl = await getBundleLocation();
  const compositionId = videoCompositionId(options.format);

  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps: {
      ...options.input,
      animate: true,
    },
  });

  const outputPath = path.join(
    "/tmp",
    `share-studio-${compositionId.toLowerCase()}-${crypto.randomUUID()}.mp4`
  );

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps: {
      ...options.input,
      animate: true,
    },
    concurrency: 2,
    imageFormat: "jpeg",
    jpegQuality: 84,
  });

  return {
    outputPath,
    width: composition.width,
    height: composition.height,
    durationSeconds: composition.durationInFrames / composition.fps,
    format: "mp4",
    cleanup: async () => {
      await fs.unlink(outputPath).catch(() => undefined);
    },
  };
}
