/**
 * Email Builder Document Model
 *
 * JSON document → React Email component tree → render() → HTML string
 */

export type BlockType =
  | "text"
  | "heading"
  | "button"
  | "image"
  | "divider"
  | "spacer"
  | "card"
  | "section"
  | "columns"
  | "cta"
  | "logo"
  | "social-links"
  | "header"
  | "footer"
  | "testimonial"
  | "stats"
  | "feature-list"
  | "rating"
  | "callout"
  | "list"
  | "button-group"
  | "hero"
  | "gallery"
  | "article"
  | "avatar";

export interface BlockNode {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
  children?: BlockNode[];
}

export const FONT_FAMILY_OPTIONS = ["MODERN_SANS", "SERIF", "MONOSPACE"] as const;
export type FontFamily = (typeof FONT_FAMILY_OPTIONS)[number];

export interface EmailDocumentSettings {
  backdropColor: string;
  canvasColor: string;
  textColor: string;
  fontFamily: FontFamily;
  previewText?: string;
}

export const DEFAULT_DOCUMENT_SETTINGS: EmailDocumentSettings = {
  backdropColor: "#f8faf8",
  canvasColor: "#ffffff",
  textColor: "#2f3e46",
  fontFamily: "MODERN_SANS",
};

export interface EmailDocument {
  settings: EmailDocumentSettings;
  blocks: BlockNode[];
}

export interface BlockDefinition {
  type: BlockType;
  label: string;
  icon: string;
  category: "content" | "layout" | "media" | "interactive";
  isContainer: boolean;
  defaultProps: Record<string, unknown>;
}

export interface CustomEmailTemplate {
  id: string;
  organization_id: string | null;
  created_by: string | null;
  name: string;
  description: string | null;
  category: string;
  document: EmailDocument;
  subject: string;
  preview_text: string | null;
  html_cache: string | null;
  thumbnail_url: string | null;
  is_starter: boolean;
  is_default: boolean;
  version: number;
  merge_fields: string[];
  created_at: string;
  updated_at: string;
}

export type CustomEmailTemplateInsert = Omit<
  CustomEmailTemplate,
  "id" | "created_at" | "updated_at" | "version" | "html_cache"
>;

export type CustomEmailTemplateUpdate = Partial<
  Pick<
    CustomEmailTemplate,
    | "name"
    | "description"
    | "category"
    | "document"
    | "subject"
    | "preview_text"
    | "is_default"
    | "merge_fields"
  >
>;
