import { z } from "zod";
import { FONT_FAMILY_OPTIONS } from "./types";

// ---------- Block prop schemas ----------

export const textPropsSchema = z.object({
  text: z.string(),
  fontSize: z.number().min(12).max(48).default(16),
  lineHeight: z.string().default("24px"),
  color: z.string().default("rgb(17,24,39)"),
  fontWeight: z.enum(["normal", "600"]).default("normal"),
  align: z.enum(["left", "center", "right"]).default("left"),
});

export const headingPropsSchema = z.object({
  text: z.string(),
  level: z.enum(["h1", "h2", "h3", "h4", "h5", "h6"]).default("h2"),
  align: z.enum(["left", "center", "right"]).default("left"),
  color: z.string().default("rgb(17,24,39)"),
  fontSize: z.number().optional(),
  fontWeight: z.number().default(600),
});

export const buttonPropsSchema = z.object({
  text: z.string(),
  href: z.string().default("#"),
  fullWidth: z.boolean().default(false),
  borderRadius: z.number().min(0).max(16).default(4),
  padding: z.number().min(8).max(20).default(12),
  backgroundColor: z.string().default("rgb(79,70,229)"),
  textColor: z.string().default("#ffffff"),
  borderColor: z.string().optional(),
  fontWeight: z.number().default(600),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export const imagePropsSchema = z.object({
  src: z.string().default(""),
  alt: z.string().default(""),
  width: z.number().min(50).max(600).default(600),
  height: z.number().optional(),
  borderRadius: z.number().min(0).max(24).default(0),
  align: z.enum(["left", "center", "right"]).default("center"),
  href: z.string().optional(),
  caption: z.string().default(""),
});

export const dividerPropsSchema = z.object({
  variant: z.enum(["solid", "dashed", "dotted", "gradient"]).default("solid"),
  color: z.string().default("rgb(209,213,219)"),
  thickness: z.number().min(1).max(4).default(1),
  spacing: z.enum(["sm", "md", "lg"]).default("md"),
  label: z.string().default(""),
});

export const spacerPropsSchema = z.object({
  height: z.number().min(8).max(120).default(24),
});

export const cardPropsSchema = z.object({
  accentColor: z.string().optional(),
  backgroundColor: z.string().default("#ffffff"),
  borderRadius: z.number().min(0).max(24).default(8),
  shadow: z.boolean().default(true),
  padding: z.enum(["sm", "md", "lg"]).default("md"),
});

export const sectionPropsSchema = z.object({
  backgroundColor: z.string().optional(),
  padding: z.enum(["none", "sm", "md", "lg"]).default("md"),
  center: z.boolean().default(false),
});

export const columnsPropsSchema = z.object({
  layout: z.enum(["50-50", "33-67", "67-33", "25-75", "75-25", "33-33-33"]).default("50-50"),
  gap: z.enum(["sm", "md", "lg"]).default("md"),
  stackOnMobile: z.boolean().default(true),
});

export const ctaPropsSchema = z.object({
  heading: z.string().default("Ready to get started?"),
  description: z.string().default(""),
  buttonText: z.string().default("Get Started"),
  buttonHref: z.string().default("#"),
  variant: z.enum(["default", "brand", "dark", "gradient"]).default("default"),
});

export const logoPropsSchema = z.object({
  src: z.string().default(""),
  alt: z.string().default("Logo"),
  width: z.number().min(40).max(300).default(150),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export const socialLinksPropsSchema = z.object({
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  align: z.enum(["left", "center", "right"]).default("center"),
});

export const headerPropsSchema = z.object({
  variant: z.enum(["centered", "inline", "social"]).default("centered"),
  logoSrc: z.string().default(""),
  logoAlt: z.string().default("Logo"),
  logoHeight: z.number().min(20).max(120).default(42),
  navLinks: z
    .array(z.object({ label: z.string(), href: z.string() }))
    .default([]),
  socialLinks: z
    .object({
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .default({}),
  backgroundColor: z.string().optional(),
  linkColor: z.string().default("rgb(75,85,99)"),
});

export const footerPropsSchema = z.object({
  variant: z.enum(["centered", "split"]).default("centered"),
  logoSrc: z.string().default(""),
  logoAlt: z.string().default("Logo"),
  companyName: z.string().default(""),
  tagline: z.string().default(""),
  address: z.string().default(""),
  contactInfo: z.string().default(""),
  socialLinks: z
    .object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .default({}),
  backgroundColor: z.string().optional(),
});

export const testimonialPropsSchema = z.object({
  quote: z.string(),
  authorName: z.string(),
  authorTitle: z.string().default(""),
  authorPhotoUrl: z.string().default(""),
  rating: z.number().min(0).max(5).default(0),
  variant: z.enum(["default", "featured", "compact"]).default("default"),
});

export const statsPropsSchema = z.object({
  items: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  showDividers: z.boolean().default(true),
  /** Individual card/row background — distinct from style.backgroundColor (outer section) */
  cardBackgroundColor: z.string().optional(),
  variant: z.enum(["row", "cards"]).default("row"),
});

export const featureListPropsSchema = z.object({
  items: z.array(z.object({ title: z.string(), description: z.string(), iconUrl: z.string().optional() })).default([]),
  variant: z.enum(["numbered", "bulleted", "icon-rows", "numbered-circles"]).default("bulleted"),
  columns: z.union([z.literal(1), z.literal(2)]).default(1),
});

export const ratingPropsSchema = z.object({
  question: z.string(),
  scale: z.union([z.literal(5), z.literal(10)]).default(10),
  surveyUrl: z.string().default("#"),
  lowLabel: z.string().default("Not likely"),
  highLabel: z.string().default("Very likely"),
});

export const calloutPropsSchema = z.object({
  text: z.string(),
  title: z.string().default(""),
  variant: z.enum(["info", "success", "warning", "tip", "important"]).default("info"),
});

export const listPropsSchema = z.object({
  items: z.array(z.string()).default([]),
  type: z.enum(["bullet", "number", "check"]).default("bullet"),
  markerColor: z.string().optional(),
});

export const buttonGroupPropsSchema = z.object({
  buttons: z.array(z.object({
    text: z.string(),
    href: z.string(),
    variant: z.enum(["primary", "secondary", "ghost", "inverse"]).default("primary"),
  })).default([]),
  align: z.enum(["left", "center", "right"]).default("center"),
  stackOnMobile: z.boolean().default(true),
});

export const heroPropsSchema = z.object({
  headline: z.string(),
  description: z.string().default(""),
  buttonText: z.string().default("Get Started"),
  buttonHref: z.string().default("#"),
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
  imagePosition: z.enum(["top", "bottom", "right"]).default("bottom"),
  contentBackgroundColor: z.string().optional(),
});

export const galleryPropsSchema = z.object({
  variant: z.enum(["grid", "featured"]).default("grid"),
  heading: z.string(),
  description: z.string().default(""),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
    href: z.string(),
  })).default([]),
});

export const articlePropsSchema = z.object({
  variant: z.enum(["hero", "horizontal"]).default("hero"),
  heading: z.string(),
  description: z.string().default(""),
  imageUrl: z.string().default(""),
  imageAlt: z.string().default(""),
  buttonText: z.string().default("Read more"),
  buttonHref: z.string().default("#"),
});

export const avatarPropsSchema = z.object({
  variant: z.enum(["single", "stacked", "profile"]).default("single"),
  images: z.array(z.object({ src: z.string(), alt: z.string() })).default([]),
  size: z.number().min(30).max(80).default(44),
  shape: z.enum(["circle", "rounded"]).default("circle"),
  name: z.string().default(""),
  title: z.string().default(""),
});

// ---------- Template CRUD schemas ----------

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  category: z.string().default("custom"),
  subject: z.string().min(1).max(200),
  previewText: z.string().max(200).optional(),
  document: z.object({
    settings: z.object({
      backdropColor: z.string(),
      canvasColor: z.string(),
      textColor: z.string(),
      fontFamily: z.enum(FONT_FAMILY_OPTIONS),
      previewText: z.string().optional(),
    }),
    blocks: z.array(z.any()),
  }),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export type TextProps = z.infer<typeof textPropsSchema>;
export type HeadingProps = z.infer<typeof headingPropsSchema>;
export type ButtonProps = z.infer<typeof buttonPropsSchema>;
export type ImageProps = z.infer<typeof imagePropsSchema>;
export type DividerProps = z.infer<typeof dividerPropsSchema>;
export type SpacerProps = z.infer<typeof spacerPropsSchema>;
export type CardProps = z.infer<typeof cardPropsSchema>;
export type SectionProps = z.infer<typeof sectionPropsSchema>;
export type ColumnsProps = z.infer<typeof columnsPropsSchema>;
export type CTAProps = z.infer<typeof ctaPropsSchema>;
export type LogoProps = z.infer<typeof logoPropsSchema>;
export type SocialLinksProps = z.infer<typeof socialLinksPropsSchema>;
export type HeaderProps = z.infer<typeof headerPropsSchema>;
export type FooterProps = z.infer<typeof footerPropsSchema>;
export type TestimonialBlockProps = z.infer<typeof testimonialPropsSchema>;
export type StatsProps = z.infer<typeof statsPropsSchema>;
export type FeatureListProps = z.infer<typeof featureListPropsSchema>;
export type RatingProps = z.infer<typeof ratingPropsSchema>;
export type CalloutProps = z.infer<typeof calloutPropsSchema>;
export type ListProps = z.infer<typeof listPropsSchema>;
export type ButtonGroupProps = z.infer<typeof buttonGroupPropsSchema>;
export type HeroProps = z.infer<typeof heroPropsSchema>;
export type GalleryProps = z.infer<typeof galleryPropsSchema>;
export type ArticleProps = z.infer<typeof articlePropsSchema>;
export type AvatarBlockProps = z.infer<typeof avatarPropsSchema>;
