/**
 * Converts between System B (EmailDocument) and Waypoint editor (TEditorDocument) formats.
 *
 * System B: { settings, blocks: [{ id, type: "text", props: { ... } }] }
 * Waypoint: { root: { type: "EmailLayout", data: { childrenIds } }, [id]: { type: "Text", data: { props } } }
 */

import type { EmailDocument, BlockNode } from "./types";

/** Waypoint editor document shape (flat key-value) */
type TEditorDocument = Record<
  string,
  { type: string; data: Record<string, unknown> }
>;

// ---------------------------------------------------------------------------
// System B type → Waypoint PascalCase type
// ---------------------------------------------------------------------------

const TYPE_MAP: Record<string, string> = {
  text: "Text",
  heading: "Heading",
  button: "Button",
  image: "Image",
  divider: "Divider",
  spacer: "Spacer",
  avatar: "Avatar",
  card: "Container",
  section: "Container",
  columns: "ColumnsContainer",
  header: "Header",
  footer: "Footer",
  testimonial: "Testimonial",
  stats: "Stats",
  "feature-list": "FeatureList",
  rating: "Rating",
  callout: "Callout",
  list: "List",
  "button-group": "ButtonGroup",
  hero: "Hero",
  gallery: "Gallery",
  article: "Article",
};

// ---------------------------------------------------------------------------
// Prop migration helpers for blocks whose schemas changed
// ---------------------------------------------------------------------------

function migrateSpacerProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  if ("size" in props && typeof props.size === "string") {
    const map: Record<string, number> = {
      xs: 8,
      sm: 12,
      md: 24,
      lg: 36,
      xl: 48,
      "2xl": 64,
    };
    return { height: map[props.size] ?? 24 };
  }
  return props;
}

function migrateButtonProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  if ("variant" in props) {
    const colors: Record<string, { bg: string; text: string }> = {
      primary: { bg: "rgb(79,70,229)", text: "#ffffff" },
      secondary: { bg: "#e5e7eb", text: "#111827" },
      ghost: { bg: "transparent", text: "rgb(79,70,229)" },
      success: { bg: "#16a34a", text: "#ffffff" },
      warning: { bg: "#f59e0b", text: "#ffffff" },
      danger: { bg: "#dc2626", text: "#ffffff" },
    };
    const c = colors[(props.variant as string) ?? "primary"] ?? colors.primary;
    const padMap: Record<string, number> = { sm: 8, md: 12, lg: 16 };
    return {
      text: props.text,
      href: props.href ?? "#",
      fullWidth: props.fullWidth ?? false,
      backgroundColor: c.bg,
      textColor: c.text,
      borderRadius: 4,
      padding: padMap[(props.size as string) ?? "md"] ?? 12,
      fontWeight: 600,
      align: props.align ?? "center",
    };
  }
  return props;
}

function migrateTextProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...props };
  if (out.fontWeight === "bold") out.fontWeight = "600";
  return out;
}

function migrateDividerProps(
  props: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...props };
  if (!("thickness" in out)) out.thickness = 1;
  return out;
}

// ---------------------------------------------------------------------------
// Expand compound blocks that have no editor equivalent
// ---------------------------------------------------------------------------

function uniqueId(base: string, existing: TEditorDocument): string {
  if (!(base in existing)) return base;
  let i = 2;
  while (`${base}_${i}` in existing) i++;
  return `${base}_${i}`;
}

function expandCTA(
  blockId: string,
  props: Record<string, unknown>,
  result: TEditorDocument,
  childrenIds: string[]
) {
  const heading = props.heading as string | undefined;
  const description = props.description as string | undefined;
  const buttonText = props.buttonText as string | undefined;
  const buttonHref = (props.buttonHref as string) || "#";

  if (heading) {
    const hid = uniqueId(`${blockId}-heading`, result);
    result[hid] = {
      type: "Heading",
      data: { props: { text: heading, level: "h2", align: "center" } },
    };
    childrenIds.push(hid);
  }
  if (description) {
    const tid = uniqueId(`${blockId}-desc`, result);
    result[tid] = {
      type: "Text",
      data: {
        props: {
          text: description,
          fontSize: 14,
          color: "rgb(107,114,128)",
          align: "center",
        },
      },
    };
    childrenIds.push(tid);
  }
  if (buttonText) {
    const bid = uniqueId(`${blockId}-btn`, result);
    result[bid] = {
      type: "Button",
      data: {
        props: {
          text: buttonText,
          href: buttonHref,
          backgroundColor: "rgb(79,70,229)",
          textColor: "#ffffff",
          borderRadius: 4,
          padding: 12,
          fontWeight: 600,
          align: "center",
        },
      },
    };
    childrenIds.push(bid);
  }
}

function convertLogoToImage(
  props: Record<string, unknown>
): Record<string, unknown> {
  return {
    src: props.src,
    alt: props.alt,
    width: props.width ?? 150,
    align: props.align ?? "center",
    borderRadius: 0,
  };
}

// ---------------------------------------------------------------------------
// Main converter: EmailDocument → TEditorDocument
// ---------------------------------------------------------------------------

export function emailDocumentToEditorDocument(
  doc: EmailDocument
): TEditorDocument {
  const result: TEditorDocument = {};
  const childrenIds: string[] = [];

  for (const block of doc.blocks) {
    // CTA: expand to multiple blocks
    if (block.type === "cta") {
      expandCTA(block.id, block.props, result, childrenIds);
      continue;
    }

    // social-links: skip (no editor equivalent and rarely used in starters)
    if (block.type === "social-links") continue;

    // Logo → Image
    if (block.type === "logo") {
      result[block.id] = {
        type: "Image",
        data: { props: convertLogoToImage(block.props) },
      };
      childrenIds.push(block.id);
      continue;
    }

    const editorType = TYPE_MAP[block.type];
    if (!editorType) continue;

    // Migrate props for blocks whose schemas changed
    let props = { ...block.props };
    switch (block.type) {
      case "spacer":
        props = migrateSpacerProps(props);
        break;
      case "button":
        props = migrateButtonProps(props);
        break;
      case "text":
        props = migrateTextProps(props);
        break;
      case "divider":
        props = migrateDividerProps(props);
        break;
    }

    result[block.id] = {
      type: editorType,
      data: { props, sourceType: block.type },
    };
    childrenIds.push(block.id);
  }

  // Root EmailLayout
  result.root = {
    type: "EmailLayout",
    data: {
      backdropColor: doc.settings.backdropColor,
      canvasColor: doc.settings.canvasColor,
      textColor: doc.settings.textColor,
      fontFamily: doc.settings.fontFamily,
      childrenIds,
    },
  };

  return result;
}

// ---------------------------------------------------------------------------
// Reverse: TEditorDocument → EmailDocument (for rendering)
// ---------------------------------------------------------------------------

/** Explicit reverse map — handles collisions where multiple System B types map to one editor type */
const EDITOR_TO_TYPE_MAP: Record<string, string> = {
  Text: "text",
  Heading: "heading",
  Button: "button",
  Image: "image",
  Divider: "divider",
  Spacer: "spacer",
  Avatar: "avatar",
  Container: "section",
  ColumnsContainer: "columns",
  Header: "header",
  Footer: "footer",
  Testimonial: "testimonial",
  Stats: "stats",
  FeatureList: "feature-list",
  Rating: "rating",
  Callout: "callout",
  List: "list",
  ButtonGroup: "button-group",
  Hero: "hero",
  Gallery: "gallery",
  Article: "article",
};

export function editorDocumentToEmailDocument(
  doc: TEditorDocument
): EmailDocument {
  const root = doc.root;
  if (!root) {
    return {
      settings: {
        backdropColor: "#f8faf8",
        canvasColor: "#ffffff",
        textColor: "#2f3e46",
        fontFamily: "MODERN_SANS",
      },
      blocks: [],
    };
  }

  const rootData = root.data;
  const childrenIds = (rootData.childrenIds as string[]) ?? [];

  const blocks: BlockNode[] = [];
  for (const cid of childrenIds) {
    const entry = doc[cid];
    if (!entry) continue;

    // Prefer sourceType stored during forward conversion to avoid collisions
    const sourceType = entry.data?.sourceType as string | undefined;
    const systemBType =
      sourceType ?? EDITOR_TO_TYPE_MAP[entry.type] ?? entry.type.toLowerCase();
    const props =
      (entry.data?.props as Record<string, unknown>) ?? entry.data ?? {};

    blocks.push({
      id: cid,
      type: systemBType as BlockNode["type"],
      props,
    });
  }

  return {
    settings: {
      backdropColor: (rootData.backdropColor as string) ?? "#f8faf8",
      canvasColor: (rootData.canvasColor as string) ?? "#ffffff",
      textColor: (rootData.textColor as string) ?? "#2f3e46",
      fontFamily:
        (rootData.fontFamily as "MODERN_SANS" | "SERIF" | "MONOSPACE") ??
        "MODERN_SANS",
      previewText: rootData.previewText as string | undefined,
    },
    blocks,
  };
}

// ---------------------------------------------------------------------------
// Detect format
// ---------------------------------------------------------------------------

export function isEditorFormat(doc: unknown): doc is TEditorDocument {
  return (
    typeof doc === "object" &&
    doc !== null &&
    "root" in (doc as Record<string, unknown>)
  );
}

export function isEmailDocumentFormat(doc: unknown): doc is EmailDocument {
  return (
    typeof doc === "object" &&
    doc !== null &&
    "settings" in (doc as Record<string, unknown>) &&
    "blocks" in (doc as Record<string, unknown>)
  );
}
