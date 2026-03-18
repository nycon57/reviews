import type { BlockDefinition, BlockType } from "./types";
import {
  textPropsSchema,
  headingPropsSchema,
  buttonPropsSchema,
  imagePropsSchema,
  dividerPropsSchema,
  spacerPropsSchema,
  cardPropsSchema,
  sectionPropsSchema,
  columnsPropsSchema,
  ctaPropsSchema,
  logoPropsSchema,
  socialLinksPropsSchema,
  headerPropsSchema,
  footerPropsSchema,
  testimonialPropsSchema,
  statsPropsSchema,
  featureListPropsSchema,
  ratingPropsSchema,
  calloutPropsSchema,
  listPropsSchema,
  buttonGroupPropsSchema,
  heroPropsSchema,
  galleryPropsSchema,
  articlePropsSchema,
  avatarPropsSchema,
} from "./schemas";
import type { z } from "zod";

export interface BlockDefinitionWithSchema extends BlockDefinition {
  propsSchema: z.ZodType;
}

const TEXT_BLOCK: BlockDefinitionWithSchema = {
  type: "text",
  label: "Text",
  icon: "TextT",
  category: "content",
  isContainer: false,
  defaultProps: {
    text: "Enter your text here...",
    fontSize: 16,
    lineHeight: "24px",
    color: "rgb(17,24,39)",
    fontWeight: "normal",
    align: "left",
  },
  propsSchema: textPropsSchema,
};

const HEADING_BLOCK: BlockDefinitionWithSchema = {
  type: "heading",
  label: "Heading",
  icon: "TextHOne",
  category: "content",
  isContainer: false,
  defaultProps: {
    text: "Your Heading",
    level: "h2",
    align: "left",
    color: "rgb(17,24,39)",
    fontWeight: 600,
  },
  propsSchema: headingPropsSchema,
};

const BUTTON_BLOCK: BlockDefinitionWithSchema = {
  type: "button",
  label: "Button",
  icon: "CursorClick",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    text: "Click Here",
    href: "#",
    fullWidth: false,
    borderRadius: 4,
    padding: 12,
    backgroundColor: "rgb(79,70,229)",
    textColor: "#ffffff",
    fontWeight: 600,
    align: "center",
  },
  propsSchema: buttonPropsSchema,
};

const IMAGE_BLOCK: BlockDefinitionWithSchema = {
  type: "image",
  label: "Image",
  icon: "Image",
  category: "media",
  isContainer: false,
  defaultProps: {
    src: "",
    alt: "",
    width: 600,
    align: "center",
    borderRadius: 0,
  },
  propsSchema: imagePropsSchema,
};

const DIVIDER_BLOCK: BlockDefinitionWithSchema = {
  type: "divider",
  label: "Divider",
  icon: "LineSegment",
  category: "layout",
  isContainer: false,
  defaultProps: {
    variant: "solid",
    color: "rgb(209,213,219)",
    thickness: 1,
    spacing: "md",
  },
  propsSchema: dividerPropsSchema,
};

const SPACER_BLOCK: BlockDefinitionWithSchema = {
  type: "spacer",
  label: "Spacer",
  icon: "ArrowsOutLineVertical",
  category: "layout",
  isContainer: false,
  defaultProps: { height: 24 },
  propsSchema: spacerPropsSchema,
};

const CARD_BLOCK: BlockDefinitionWithSchema = {
  type: "card",
  label: "Card",
  icon: "Rectangle",
  category: "layout",
  isContainer: true,
  defaultProps: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadow: true,
    padding: "md",
  },
  propsSchema: cardPropsSchema,
};

const SECTION_BLOCK: BlockDefinitionWithSchema = {
  type: "section",
  label: "Section",
  icon: "Rows",
  category: "layout",
  isContainer: true,
  defaultProps: {
    padding: "md",
    center: false,
  },
  propsSchema: sectionPropsSchema,
};

const COLUMNS_BLOCK: BlockDefinitionWithSchema = {
  type: "columns",
  label: "Columns",
  icon: "Columns",
  category: "layout",
  isContainer: true,
  defaultProps: {
    layout: "50-50",
    gap: "md",
    stackOnMobile: true,
  },
  propsSchema: columnsPropsSchema,
};

const CTA_BLOCK: BlockDefinitionWithSchema = {
  type: "cta",
  label: "Call to Action",
  icon: "Megaphone",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    heading: "Ready to get started?",
    description: "",
    buttonText: "Get Started",
    buttonHref: "#",
    variant: "default",
  },
  propsSchema: ctaPropsSchema,
};

const LOGO_BLOCK: BlockDefinitionWithSchema = {
  type: "logo",
  label: "Logo",
  icon: "ImageSquare",
  category: "media",
  isContainer: false,
  defaultProps: {
    src: "",
    alt: "Logo",
    width: 150,
    align: "center",
  },
  propsSchema: logoPropsSchema,
};

const SOCIAL_LINKS_BLOCK: BlockDefinitionWithSchema = {
  type: "social-links",
  label: "Social Links",
  icon: "ShareNetwork",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    align: "center",
  },
  propsSchema: socialLinksPropsSchema,
};

const HEADER_BLOCK: BlockDefinitionWithSchema = {
  type: "header",
  label: "Header",
  icon: "Rows",
  category: "layout",
  isContainer: false,
  defaultProps: {
    variant: "centered",
    logoSrc: "",
    logoAlt: "{{company_name}}",
    logoHeight: 42,
    navLinks: [],
    socialLinks: {},
    linkColor: "rgb(75,85,99)",
  },
  propsSchema: headerPropsSchema,
};

const FOOTER_BLOCK: BlockDefinitionWithSchema = {
  type: "footer",
  label: "Footer",
  icon: "CaretDoubleDown",
  category: "layout",
  isContainer: false,
  defaultProps: {
    variant: "centered",
    logoSrc: "",
    logoAlt: "Logo",
    companyName: "",
    tagline: "",
    address: "",
    contactInfo: "",
    socialLinks: {},
  },
  propsSchema: footerPropsSchema,
};

const TESTIMONIAL_BLOCK: BlockDefinitionWithSchema = {
  type: "testimonial",
  label: "Testimonial",
  icon: "Quotes",
  category: "content",
  isContainer: false,
  defaultProps: {
    quote: "Enter testimonial quote...",
    authorName: "Author Name",
    authorTitle: "",
    authorPhotoUrl: "",
    rating: 0,
    variant: "default",
  },
  propsSchema: testimonialPropsSchema,
};

const STATS_BLOCK: BlockDefinitionWithSchema = {
  type: "stats",
  label: "Stats",
  icon: "ChartBar",
  category: "content",
  isContainer: false,
  defaultProps: {
    items: [],
    columns: 3,
    showDividers: true,
    variant: "row",
  },
  propsSchema: statsPropsSchema,
};

const FEATURE_LIST_BLOCK: BlockDefinitionWithSchema = {
  type: "feature-list",
  label: "Feature List",
  icon: "ListChecks",
  category: "content",
  isContainer: false,
  defaultProps: {
    items: [],
    variant: "bulleted",
    columns: 1,
  },
  propsSchema: featureListPropsSchema,
};

const RATING_BLOCK: BlockDefinitionWithSchema = {
  type: "rating",
  label: "Rating",
  icon: "Star",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    question: "How likely are you to recommend us?",
    scale: 10,
    surveyUrl: "#",
    lowLabel: "Not likely",
    highLabel: "Very likely",
  },
  propsSchema: ratingPropsSchema,
};

const CALLOUT_BLOCK: BlockDefinitionWithSchema = {
  type: "callout",
  label: "Callout",
  icon: "Info",
  category: "content",
  isContainer: false,
  defaultProps: {
    text: "Enter callout text...",
    title: "",
    variant: "info",
  },
  propsSchema: calloutPropsSchema,
};

const LIST_BLOCK: BlockDefinitionWithSchema = {
  type: "list",
  label: "List",
  icon: "ListBullets",
  category: "content",
  isContainer: false,
  defaultProps: {
    items: [],
    type: "bullet",
  },
  propsSchema: listPropsSchema,
};

const BUTTON_GROUP_BLOCK: BlockDefinitionWithSchema = {
  type: "button-group",
  label: "Button Group",
  icon: "SquaresFour",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    buttons: [],
    align: "center",
    stackOnMobile: true,
  },
  propsSchema: buttonGroupPropsSchema,
};

const HERO_BLOCK: BlockDefinitionWithSchema = {
  type: "hero",
  label: "Hero",
  icon: "FrameCorners",
  category: "interactive",
  isContainer: false,
  defaultProps: {
    headline: "Your Headline Here",
    description: "",
    buttonText: "Get Started",
    buttonHref: "#",
    imageUrl: "",
    imageAlt: "",
    imagePosition: "bottom",
  },
  propsSchema: heroPropsSchema,
};

const GALLERY_BLOCK: BlockDefinitionWithSchema = {
  type: "gallery",
  label: "Gallery",
  icon: "GridFour",
  category: "media",
  isContainer: false,
  defaultProps: {
    variant: "grid",
    heading: "Gallery Heading",
    description: "",
    images: [],
  },
  propsSchema: galleryPropsSchema,
};

const ARTICLE_BLOCK: BlockDefinitionWithSchema = {
  type: "article",
  label: "Article",
  icon: "Article",
  category: "content",
  isContainer: false,
  defaultProps: {
    variant: "hero",
    heading: "Article Title",
    description: "",
    imageUrl: "",
    imageAlt: "",
    buttonText: "Read more",
    buttonHref: "#",
  },
  propsSchema: articlePropsSchema,
};

const AVATAR_BLOCK: BlockDefinitionWithSchema = {
  type: "avatar",
  label: "Avatar",
  icon: "UserCircle",
  category: "media",
  isContainer: false,
  defaultProps: {
    variant: "single",
    images: [],
    size: 44,
    shape: "circle",
  },
  propsSchema: avatarPropsSchema,
};

export const BLOCK_DEFINITIONS: BlockDefinitionWithSchema[] = [
  TEXT_BLOCK,
  HEADING_BLOCK,
  BUTTON_BLOCK,
  IMAGE_BLOCK,
  DIVIDER_BLOCK,
  SPACER_BLOCK,
  CARD_BLOCK,
  SECTION_BLOCK,
  COLUMNS_BLOCK,
  CTA_BLOCK,
  LOGO_BLOCK,
  SOCIAL_LINKS_BLOCK,
  HEADER_BLOCK,
  FOOTER_BLOCK,
  TESTIMONIAL_BLOCK,
  STATS_BLOCK,
  FEATURE_LIST_BLOCK,
  RATING_BLOCK,
  CALLOUT_BLOCK,
  LIST_BLOCK,
  BUTTON_GROUP_BLOCK,
  HERO_BLOCK,
  GALLERY_BLOCK,
  ARTICLE_BLOCK,
  AVATAR_BLOCK,
];

export const BLOCK_REGISTRY: Record<BlockType, BlockDefinitionWithSchema> =
  Object.fromEntries(BLOCK_DEFINITIONS.map((d) => [d.type, d])) as Record<
    BlockType,
    BlockDefinitionWithSchema
  >;

/** Block categories for palette grouping */
export const BLOCK_CATEGORIES = [
  { key: "content" as const, label: "Content" },
  { key: "layout" as const, label: "Layout" },
  { key: "media" as const, label: "Media" },
  { key: "interactive" as const, label: "Interactive" },
];
