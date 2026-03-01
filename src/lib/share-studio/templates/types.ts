import type { ReactElement } from "react";

// ---------------------------------------------------------------------------
// Template props — the universal input for all SVG template components
// ---------------------------------------------------------------------------

export interface TemplateProps {
  width: number;
  height: number;
  // Review data
  quote: string;
  customerName: string;
  rating: number;
  avatarBase64: string | null; // Pre-fetched, base64-encoded data URI
  // Organization branding
  orgName: string;
  primaryColor: string;
  secondaryColor: string;
  logoBase64: string | null; // Pre-fetched, base64-encoded data URI
  // Optional
  ctaText?: string;
  ctaUrl?: string;
  sourcePlatform?: string;
}

// ---------------------------------------------------------------------------
// Template metadata — describes a template for the registry / UI
// ---------------------------------------------------------------------------

export type TemplateFormat = "1:1" | "9:16" | "16:9";

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: "simple" | "premium";
  supportedFormats: TemplateFormat[];
  component: (props: TemplateProps) => ReactElement;
}

// ---------------------------------------------------------------------------
// Render result
// ---------------------------------------------------------------------------

export interface SvgRenderResult {
  buffer: Buffer;
  width: number;
  height: number;
}
