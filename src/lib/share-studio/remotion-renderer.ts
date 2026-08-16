/**
 * Share Studio quote-card video rendering (SocialClip composition).
 * Builds composition props from review/testimonial content and renders
 * through the shared backend (render-backend.ts), which owns bundling and
 * the local/Lambda dispatch seam.
 */

import {
  renderComposition,
  type CompositionRenderResult,
} from "@/lib/share-studio/render-backend";

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

export interface ShareStudioRenderResult extends CompositionRenderResult {
  format: "mp4";
}

function normalizeRating(value: number | null | undefined): number {
  if (value === null || value === undefined || Number.isNaN(value)) return 5;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function getVideoCompositionId(format: ShareStudioVideoFormat): string {
  if (format === "9:16") return "SocialClip-9-16";
  if (format === "1:1") return "SocialClip-1-1";
  return "SocialClip-16-9";
}

export async function renderShareStudioVideo(options: {
  input: ShareStudioRenderInput;
  format: ShareStudioVideoFormat;
  template?: "modern" | "minimal" | "bold";
}): Promise<ShareStudioRenderResult> {
  const { input, format } = options;

  const inputProps: Record<string, unknown> = {
    type: "testimonial_quote",
    quote: input.quote || input.title || "Customer feedback shared via Share Studio",
    author: input.customerName || "Verified Customer",
    rating: normalizeRating(input.rating),
    organization: {
      name: input.organizationName,
      logoUrl: input.organizationLogoUrl ?? null,
      primaryColor: input.primaryColor,
      secondaryColor: input.secondaryColor,
    },
    format,
  };

  const result = await renderComposition({
    compositionId: getVideoCompositionId(format),
    inputProps,
    outputName: `share-studio-socialclip`,
  });

  return { ...result, format: "mp4" };
}
