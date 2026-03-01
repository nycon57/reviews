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

type CompositionKind = "text_testimonial" | "social_clip";

interface CompositionTarget {
  id: string;
  kind: CompositionKind;
  format: ShareStudioVideoFormat;
}

function normalizeRating(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function getStillComposition(format: "og" | ShareStudioVideoFormat): CompositionTarget {
  if (format === "9:16") {
    return { id: "TextTestimonial-9-16", kind: "text_testimonial", format: "9:16" };
  }
  if (format === "1:1") {
    return { id: "TextTestimonial-1-1", kind: "text_testimonial", format: "1:1" };
  }
  return { id: "TextTestimonial-16-9", kind: "text_testimonial", format: "16:9" };
}

function getVideoComposition(format: ShareStudioVideoFormat): CompositionTarget {
  if (format === "9:16") {
    return { id: "SocialClip-9-16", kind: "social_clip", format: "9:16" };
  }
  if (format === "1:1") {
    return { id: "SocialClip-1-1", kind: "social_clip", format: "1:1" };
  }
  return { id: "SocialClip-16-9", kind: "social_clip", format: "16:9" };
}

function buildCompositionInputProps(
  kind: CompositionKind,
  input: ShareStudioRenderInput,
  format: ShareStudioVideoFormat,
  template: "modern" | "minimal" | "bold" = "modern"
): Record<string, unknown> {
  const organization = {
    name: input.organizationName,
    logoUrl: input.organizationLogoUrl ?? null,
    primaryColor: input.primaryColor,
    secondaryColor: input.secondaryColor,
  };
  const rating = normalizeRating(input.rating);

  if (kind === "social_clip") {
    return {
      type: "testimonial_quote",
      quote: input.quote || input.title || "Customer feedback shared via Share Studio",
      author: input.customerName || "Verified Customer",
      rating,
      organization,
      format,
    };
  }

  return {
    text: input.quote || input.title || "Customer feedback shared via Share Studio",
    author: input.customerName || "Verified Customer",
    rating,
    organization,
    template,
    format,
    authorPhotoUrl: null,
  };
}

export async function renderShareStudioStill(options: {
  input: ShareStudioRenderInput;
  format: "og" | ShareStudioVideoFormat;
  template?: "modern" | "minimal" | "bold";
}): Promise<ShareStudioRenderResult> {
  const serveUrl = await getBundleLocation();
  const composition = getStillComposition(options.format);
  const inputProps = buildCompositionInputProps(
    composition.kind,
    options.input,
    composition.format,
    options.template ?? "modern"
  );

  const selectedComposition = await selectComposition({
    serveUrl,
    id: composition.id,
    inputProps,
  });

  const outputPath = path.join(
    "/tmp",
    `share-studio-${composition.id.toLowerCase()}-${crypto.randomUUID()}.png`
  );

  await renderStill({
    composition: selectedComposition,
    serveUrl,
    output: outputPath,
    imageFormat: "png",
    inputProps,
    frame: 1,
  });

  return {
    outputPath,
    width: selectedComposition.width,
    height: selectedComposition.height,
    format: "png",
    cleanup: async () => {
      await fs.unlink(outputPath).catch(() => undefined);
    },
  };
}

export async function renderShareStudioVideo(options: {
  input: ShareStudioRenderInput;
  format: ShareStudioVideoFormat;
  template?: "modern" | "minimal" | "bold";
}): Promise<ShareStudioRenderResult> {
  const serveUrl = await getBundleLocation();
  const composition = getVideoComposition(options.format);
  const inputProps = buildCompositionInputProps(
    composition.kind,
    options.input,
    composition.format,
    options.template ?? "modern"
  );

  const selectedComposition = await selectComposition({
    serveUrl,
    id: composition.id,
    inputProps,
  });

  const outputPath = path.join(
    "/tmp",
    `share-studio-${composition.id.toLowerCase()}-${crypto.randomUUID()}.mp4`
  );

  await renderMedia({
    composition: selectedComposition,
    serveUrl,
    codec: "h264",
    outputLocation: outputPath,
    inputProps,
    concurrency: 2,
    imageFormat: "jpeg",
    jpegQuality: 84,
  });

  return {
    outputPath,
    width: selectedComposition.width,
    height: selectedComposition.height,
    durationSeconds: selectedComposition.durationInFrames / selectedComposition.fps,
    format: "mp4",
    cleanup: async () => {
      await fs.unlink(outputPath).catch(() => undefined);
    },
  };
}
