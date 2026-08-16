import * as React from "react";
import { render } from "@react-email/render";
import {
  Section,
  Text,
  Img,
  Link,
  Row,
  Column,
  Hr,
  Heading,
  Button as ReactEmailButton,
} from "@react-email/components";
import {
  EmailLayout,
  EmailCard,
  EmailSection,
  TwoColumnLayout,
  CTASection,
} from "@/lib/email/components";
import { ComplianceStrip } from "@/lib/email/components/compliance-strip";
import type { EmailBrandingConfig } from "@/lib/organization/types";

import { Testimonial } from "@/lib/email/components/email-social-proof";
import { StatsRow } from "@/lib/email/components/email-stats";
import { SurveyCTA, HeroCTA } from "@/lib/email/components/email-cta";
import { CalloutBox, TextDivider } from "@/lib/email/components/email-utilities";
import { EmailList } from "@/lib/email/components/email-typography";
import { EmailButtonGroup } from "@/lib/email/components/email-button";
import { colors, typography, spacing } from "@/lib/email/theme";
import type { EmailDocument, BlockNode } from "./types";
import { replaceMergeFieldsInProps } from "./merge-fields";
import type {
  TextProps,
  HeadingProps,
  ButtonProps,
  ImageProps,
  DividerProps,
  SpacerProps,
  CardProps,
  SectionProps,
  ColumnsProps,
  CTAProps,
  LogoProps,
  SocialLinksProps,
  HeaderProps,
  FooterProps,
  TestimonialBlockProps,
  StatsProps,
  FeatureListProps,
  RatingProps,
  CalloutProps,
  ListProps,
  ButtonGroupProps,
  HeroProps,
  GalleryProps,
  ArticleProps,
  AvatarBlockProps,
} from "./schemas";

const FONT_FAMILY_MAP: Record<string, string> = {
  MODERN_SANS: typography.fontFamily.body,
  SERIF: typography.fontFamily.display,
  MONOSPACE: typography.fontFamily.mono,
};

/** Render an EmailDocument to an HTML string. */
export async function renderEmailDocument(
  doc: EmailDocument,
  mergeValues?: Record<string, string>,
  orgBranding?: EmailBrandingConfig | null
): Promise<{ html: string }> {
  // Detect whether user has explicit header/footer blocks
  const hasUserHeader = doc.blocks.some((b) => b.type === "header");
  const hasUserFooter = doc.blocks.some((b) => b.type === "footer");

  const emailJsx = (
    <EmailLayout
      preview={doc.settings.previewText || ""}
      bodyBackgroundColor={doc.settings.backdropColor}
      containerBackgroundColor={doc.settings.canvasColor}
    >
      {/* Org default header (when enabled + no user override) */}
      {orgBranding?.enabled && !hasUserHeader && orgBranding.header.logoSrc ? (
        renderHeader(orgBranding.header)
      ) : null}

      {doc.blocks.map((block) => (
        <React.Fragment key={block.id}>
          {renderBlock(block, mergeValues)}
        </React.Fragment>
      ))}

      {/* Org default footer (when enabled + no user override) */}
      {orgBranding?.enabled && !hasUserFooter && orgBranding.footer.companyName ? (
        renderFooterBlock(orgBranding.footer)
      ) : null}

      {/* CAN-SPAM compliance strip — always rendered */}
      <ComplianceStrip
        unsubscribeUrl={mergeValues?.unsubscribe_link}
        physicalAddress={orgBranding?.compliance?.physicalAddress || undefined}
        copyrightHolder={orgBranding?.compliance?.copyrightHolder || undefined}
      />
    </EmailLayout>
  );

  const html = await render(emailJsx);
  return { html };
}

/**
 * Narrow a stored block's prop bag to the contract its renderer owns.
 *
 * Documents are persisted as untyped JSON, so props reach the renderer as
 * `Record<string, unknown>` with no compile-time link to the block type.
 */
function blockProps<TProps>(raw: Record<string, unknown>): TProps {
  // SAFETY: the caller is the `case` in renderBlock that owns this block type,
  // so TProps is the prop schema the editor writes for that type. Renderers
  // read every field defensively (`?? default`), so a document saved before a
  // field existed renders with defaults rather than throwing.
  return raw as TProps;
}

function renderBlock(
  block: BlockNode,
  mergeValues?: Record<string, string>
): React.ReactNode {
  const raw = mergeValues
    ? replaceMergeFieldsInProps(block.props, mergeValues)
    : block.props;

  const children = block.children?.map((child) => (
    <React.Fragment key={child.id}>
      {renderBlock(child, mergeValues)}
    </React.Fragment>
  ));

  switch (block.type) {
    case "text":
      return renderText(blockProps<TextProps>(raw));
    case "heading":
      return renderHeading(blockProps<HeadingProps>(raw));
    case "button":
      return renderButton(blockProps<ButtonProps>(raw));
    case "image":
      return renderImage(blockProps<ImageProps>(raw));
    case "divider":
      return renderDividerBlock(blockProps<DividerProps>(raw));
    case "spacer":
      return renderSpacerBlock(blockProps<SpacerProps>(raw));
    case "card":
      return renderCard(blockProps<CardProps>(raw), children);
    case "section":
      return renderSectionBlock(blockProps<SectionProps>(raw), children);
    case "columns":
      return renderColumns(blockProps<ColumnsProps>(raw), block.children, mergeValues);
    case "cta":
      return renderCTA(blockProps<CTAProps>(raw));
    case "logo":
      return renderLogo(blockProps<LogoProps>(raw));
    case "social-links":
      return renderSocialLinks(blockProps<SocialLinksProps>(raw));
    case "header":
      return renderHeader(blockProps<HeaderProps>(raw));
    case "footer":
      return renderFooterBlock(blockProps<FooterProps>(raw));
    case "testimonial":
      return renderTestimonial(blockProps<TestimonialBlockProps>(raw));
    case "stats":
      return renderStats(blockProps<StatsProps>(raw));
    case "feature-list":
      return renderFeatureList(blockProps<FeatureListProps>(raw));
    case "rating":
      return renderRating(blockProps<RatingProps>(raw));
    case "callout":
      return renderCallout(blockProps<CalloutProps>(raw));
    case "list":
      return renderList(blockProps<ListProps>(raw));
    case "button-group":
      return renderButtonGroup(blockProps<ButtonGroupProps>(raw));
    case "hero":
      return renderHero(blockProps<HeroProps>(raw));
    case "gallery":
      return renderGallery(blockProps<GalleryProps>(raw));
    case "article":
      return renderArticle(blockProps<ArticleProps>(raw));
    case "avatar":
      return renderAvatar(blockProps<AvatarBlockProps>(raw));
    default:
      return null;
  }
}

function renderText(p: TextProps) {
  return (
    <Section style={{ padding: `${spacing[2]} ${spacing[6]}` }}>
      <Text
        style={{
          margin: 0,
          fontSize: `${p.fontSize ?? 16}px`,
          lineHeight: p.lineHeight ?? "24px",
          color: p.color ?? "rgb(17,24,39)",
          fontWeight: p.fontWeight === "600" ? 600 : 400,
          textAlign: p.align ?? "left",
        }}
      >
        {p.text}
      </Text>
    </Section>
  );
}

function renderHeading(p: HeadingProps) {
  const levelSizes: Record<string, string> = {
    h1: "36px", h2: "30px", h3: "24px", h4: "20px", h5: "18px", h6: "16px",
  };
  const level = p.level ?? "h2";
  return (
    <Section style={{ padding: `${spacing[2]} ${spacing[6]}` }}>
      <Heading
        as={level as "h1" | "h2" | "h3" | "h4" | "h5" | "h6"}
        style={{
          margin: 0,
          fontSize: p.fontSize ? `${p.fontSize}px` : levelSizes[level],
          fontWeight: p.fontWeight ?? 600,
          color: p.color ?? "rgb(17,24,39)",
          textAlign: p.align ?? "left",
        }}
      >
        {p.text}
      </Heading>
    </Section>
  );
}

function renderButton(p: ButtonProps) {
  const bgColor = p.backgroundColor ?? "rgb(79,70,229)";
  const txtColor = p.textColor ?? "#ffffff";
  const radius = p.borderRadius ?? 4;
  const pad = p.padding ?? 12;
  const border = p.borderColor ? `1px solid ${p.borderColor}` : "none";
  return (
    <Section style={{ textAlign: p.align ?? "center", padding: `${spacing[2]} ${spacing[6]}` }}>
      <ReactEmailButton
        href={p.href || "#"}
        style={{
          display: p.fullWidth ? "block" : "inline-block",
          width: p.fullWidth ? "100%" : undefined,
          padding: `${pad}px ${pad * 2}px`,
          backgroundColor: bgColor,
          color: txtColor,
          borderRadius: `${radius}px`,
          border,
          fontSize: "14px",
          fontWeight: p.fontWeight ?? 600,
          textDecoration: "none",
          textAlign: "center",
        }}
      >
        {p.text}
      </ReactEmailButton>
    </Section>
  );
}

function renderImage(p: ImageProps) {
  if (!p.src) {
    return (
      <Section style={{ textAlign: p.align ?? "center", padding: `${spacing[2]} ${spacing[6]}` }}>
        <Text style={{ color: colors.text.muted, fontSize: "14px" }}>
          [Image placeholder]
        </Text>
      </Section>
    );
  }
  const align = p.align ?? "center";
  const imgEl = (
    <Img
      src={p.src}
      alt={p.alt || ""}
      width={p.width ?? 600}
      height={p.height}
      style={{
        borderRadius: `${p.borderRadius ?? 0}px`,
        maxWidth: "100%",
        display: "block",
        margin: align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : undefined,
      }}
    />
  );
  return (
    <Section style={{ textAlign: p.align ?? "center", padding: `${spacing[2]} ${spacing[6]}` }}>
      {p.href ? <Link href={p.href}>{imgEl}</Link> : imgEl}
      {p.caption && (
        <Text style={{ margin: "8px 0 0 0", fontSize: "12px", color: "#84a98c", textAlign: p.align ?? "center" }}>
          {p.caption}
        </Text>
      )}
    </Section>
  );
}

function renderDividerBlock(p: DividerProps) {
  const marginMap = { sm: spacing[2], md: spacing[4], lg: spacing[6] };
  const margin = marginMap[p.spacing ?? "md"] ?? spacing[4];
  const color = p.color ?? "rgb(209,213,219)";
  const thickness = p.thickness ?? 1;

  if (p.label) {
    return <TextDivider text={p.label} lineColor={color} />;
  }

  if (p.variant === "gradient") {
    return (
      <Section style={{ padding: `${margin} ${spacing[6]}` }}>
        <Hr style={{
          border: "none",
          borderTop: `${thickness}px solid transparent`,
          backgroundImage: `linear-gradient(to right, transparent, ${color}, transparent)`,
          height: `${thickness}px`,
          margin: 0,
        }} />
      </Section>
    );
  }

  return (
    <Section style={{ padding: `${margin} ${spacing[6]}` }}>
      <Hr style={{
        border: "none",
        borderTop: `${thickness}px ${p.variant ?? "solid"} ${color}`,
        margin: 0,
      }} />
    </Section>
  );
}

function renderSpacerBlock(p: SpacerProps) {
  return (
    <Section style={{ height: `${p.height ?? 24}px`, lineHeight: `${p.height ?? 24}px` }}>
      &nbsp;
    </Section>
  );
}

function renderCard(p: CardProps, children?: React.ReactNode) {
  return (
    <EmailCard
      accentColor={p.accentColor}
      backgroundColor={p.backgroundColor}
    >
      {children}
    </EmailCard>
  );
}

function renderSectionBlock(p: SectionProps, children?: React.ReactNode) {
  const paddingMap = { none: "0", sm: spacing[4], md: spacing[6], lg: spacing[8] };
  return (
    <EmailSection
      backgroundColor={p.backgroundColor}
      padding={paddingMap[p.padding]}
      center={p.center}
    >
      {children}
    </EmailSection>
  );
}

function renderColumns(
  p: ColumnsProps,
  childBlocks?: BlockNode[],
  mergeValues?: Record<string, string>
) {
  const gapMap = { sm: spacing[2], md: spacing[4], lg: spacing[6] };
  const gap = gapMap[p.gap];

  if (p.layout === "50-50" || p.layout === "33-67" || p.layout === "67-33" || p.layout === "25-75" || p.layout === "75-25") {
    const leftWidth = p.layout === "33-67" ? "33%" : p.layout === "67-33" ? "67%" : p.layout === "25-75" ? "25%" : p.layout === "75-25" ? "75%" : "50%";
    const blocks = childBlocks ?? [];
    const midpoint = Math.ceil(blocks.length / 2);
    const leftBlocks = blocks.slice(0, midpoint);
    const rightBlocks = blocks.slice(midpoint);

    return (
      <TwoColumnLayout
        leftWidth={leftWidth}
        gap={gap}
        stackOnMobile={p.stackOnMobile}
        left={
          <>
            {leftBlocks.map((b) => (
              <React.Fragment key={b.id}>
                {renderBlock(b, mergeValues)}
              </React.Fragment>
            ))}
          </>
        }
        right={
          <>
            {rightBlocks.map((b) => (
              <React.Fragment key={b.id}>
                {renderBlock(b, mergeValues)}
              </React.Fragment>
            ))}
          </>
        }
      />
    );
  }

  // Three-column: render as rows with columns
  const blocks = childBlocks ?? [];
  const third = Math.ceil(blocks.length / 3);
  return (
    <Section className="mobile-padding" style={{ padding: spacing[4] }}>
      <Row>
        {[0, 1, 2].map((i) => (
          <Column
            key={i}
            className="mobile-stack"
            style={{ width: "33.33%", padding: `0 ${parseInt(gap, 10) / 2}px`, verticalAlign: "top" }}
          >
            {blocks.slice(i * third, (i + 1) * third).map((b) => (
              <React.Fragment key={b.id}>
                {renderBlock(b, mergeValues)}
              </React.Fragment>
            ))}
          </Column>
        ))}
      </Row>
    </Section>
  );
}

function renderCTA(p: CTAProps) {
  return (
    <CTASection
      headline={p.heading}
      description={p.description || undefined}
      buttonText={p.buttonText}
      buttonUrl={p.buttonHref}
      variant={p.variant}
    />
  );
}

function renderLogo(p: LogoProps) {
  if (!p.src) {
    return (
      <Section style={{ textAlign: p.align, padding: `${spacing[4]} ${spacing[6]}` }}>
        <Text style={{ color: colors.text.muted, fontSize: "14px" }}>
          [Logo placeholder]
        </Text>
      </Section>
    );
  }
  return (
    <Section style={{ textAlign: p.align, padding: `${spacing[4]} ${spacing[6]}` }}>
      <Img src={p.src} alt={p.alt} width={p.width} style={{ display: "inline-block" }} />
    </Section>
  );
}

function renderSocialLinks(p: SocialLinksProps) {
  const links = [
    { key: "linkedin", url: p.linkedin, label: "LinkedIn" },
    { key: "twitter", url: p.twitter, label: "X (Twitter)" },
    { key: "facebook", url: p.facebook, label: "Facebook" },
    { key: "instagram", url: p.instagram, label: "Instagram" },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <Section style={{ textAlign: p.align, padding: `${spacing[3]} ${spacing[6]}` }}>
      <Row style={{ display: "inline-block" }}>
        {links.map((l) => (
          <Column key={l.key} style={{ display: "inline-block", padding: `0 ${spacing[2]}` }}>
            <Link
              href={l.url!}
              style={{
                color: colors.primary,
                fontSize: typography.fontSize.sm,
                textDecoration: "underline",
              }}
            >
              {l.label}
            </Link>
          </Column>
        ))}
      </Row>
    </Section>
  );
}

function renderHeader(p: HeaderProps) {
  const linkStyle = {
    color: p.linkColor || "rgb(75,85,99)",
    textDecoration: "none" as const,
    fontFamily: typography.fontFamily.body,
    fontSize: typography.fontSize.sm,
  };
  const sectionStyle = {
    paddingTop: spacing[10],
    paddingBottom: spacing[10],
    paddingLeft: spacing[8],
    paddingRight: spacing[8],
    backgroundColor: p.backgroundColor,
  };

  const logo = p.logoSrc ? (
    <Img
      alt={p.logoAlt || "Logo"}
      height={String(p.logoHeight || 42)}
      src={p.logoSrc}
    />
  ) : (
    <Text
      style={{
        margin: 0,
        fontFamily: typography.fontFamily.display,
        fontSize: typography.fontSize["2xl"],
        fontWeight: typography.fontWeight.bold,
        color: colors.repwell.teal[400],
      }}
    >
      {p.logoAlt || "Logo"}
    </Text>
  );

  // Variant: centered — logo centered, nav links centered below
  if (p.variant === "centered") {
    return (
      <Section style={sectionStyle}>
        <Row>
          <Column style={{ textAlign: "center" }}>{logo}</Column>
        </Row>
        {p.navLinks && p.navLinks.length > 0 && (
          <Row style={{ marginTop: spacing[10] }}>
            <Column style={{ textAlign: "center" }}>
              <table cellPadding={0} cellSpacing={0} role="presentation" style={{ display: "inline-table" }}>
                <tr>
                  {p.navLinks.map((link, i) => (
                    <td key={i} style={{ paddingRight: spacing[2], paddingLeft: spacing[2] }}>
                      <Link href={link.href} style={linkStyle}>
                        {link.label}
                      </Link>
                    </td>
                  ))}
                </tr>
              </table>
            </Column>
          </Row>
        )}
      </Section>
    );
  }

  // Variant: social — logo left, social icons right
  if (p.variant === "social") {
    const socials = [
      { key: "twitter", url: p.socialLinks?.twitter, alt: "X" },
      { key: "instagram", url: p.socialLinks?.instagram, alt: "Instagram" },
      { key: "facebook", url: p.socialLinks?.facebook, alt: "Facebook" },
      { key: "linkedin", url: p.socialLinks?.linkedin, alt: "LinkedIn" },
    ].filter((s) => s.url);

    return (
      <Section style={sectionStyle}>
        <Row>
          <Column style={{ width: "80%" }}>{logo}</Column>
          <Column style={{ textAlign: "right" }}>
            <Row style={{ display: "inline-table" }}>
              {socials.map((s) => (
                <Column key={s.key}>
                  <Link href={s.url!}>
                    <Text
                      style={{
                        ...linkStyle,
                        display: "inline-block",
                        marginLeft: spacing[1],
                        marginRight: spacing[1],
                        fontWeight: typography.fontWeight.medium,
                      }}
                    >
                      {s.alt}
                    </Text>
                  </Link>
                </Column>
              ))}
            </Row>
          </Column>
        </Row>
      </Section>
    );
  }

  // Variant: inline (default) — logo left, nav links right
  return (
    <Section style={sectionStyle}>
      <Row>
        <Column style={{ width: "80%" }}>{logo}</Column>
        <Column style={{ textAlign: "right" }}>
          <Row style={{ display: "inline-table" }}>
            {(p.navLinks || []).map((link, i) => (
              <Column key={i} style={{ paddingLeft: spacing[2], paddingRight: spacing[2] }}>
                <Link href={link.href} style={linkStyle}>
                  {link.label}
                </Link>
              </Column>
            ))}
          </Row>
        </Column>
      </Row>
    </Section>
  );
}

function renderFooterBlock(p: FooterProps) {
  const socialIcons = {
    facebook: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z'/%3E%3C/svg%3E`,
    twitter: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z'/%3E%3C/svg%3E`,
    instagram: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z'/%3E%3C/svg%3E`,
    linkedin: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='%236b7280'%3E%3Cpath d='M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z'/%3E%3C/svg%3E`,
  };

  const bgColor = p.backgroundColor || colors.background.subtle;
  const socialEntries = Object.entries(p.socialLinks || {}).filter(
    ([, url]) => url
  ) as [keyof typeof socialIcons, string][];

  const logoEl = p.logoSrc ? (
    <Img
      src={p.logoSrc}
      alt={p.logoAlt || "Logo"}
      height="36"
      style={{ display: "inline-block" }}
    />
  ) : null;

  const socialRow =
    socialEntries.length > 0 ? (
      <Row style={{ display: "inline-table" }}>
        {socialEntries.map(([key, url]) => (
          <Column
            key={key}
            style={{ padding: `0 ${spacing[2]}`, display: "inline-block" }}
          >
            <Link href={url}>
              <Img
                src={socialIcons[key]}
                alt={key}
                width={36}
                height={36}
                style={{ display: "inline-block" }}
              />
            </Link>
          </Column>
        ))}
      </Row>
    ) : null;

  // Centered variant
  if (p.variant === "centered" || !p.variant) {
    return (
      <Section
        style={{
          textAlign: "center",
          backgroundColor: bgColor,
          padding: `${spacing[10]} ${spacing[8]}`,
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
        >
          <tbody>
            {logoEl && (
              <tr>
                <td style={{ textAlign: "center", paddingBottom: spacing[4] }}>
                  {logoEl}
                </td>
              </tr>
            )}
            {p.companyName && (
              <tr>
                <td style={{ textAlign: "center" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.semibold,
                      color: "rgb(17,24,39)",
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {p.companyName}
                  </Text>
                </td>
              </tr>
            )}
            {p.tagline && (
              <tr>
                <td style={{ textAlign: "center" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.base,
                      color: "rgb(107,114,128)",
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {p.tagline}
                  </Text>
                </td>
              </tr>
            )}
            {socialRow && (
              <tr>
                <td
                  style={{
                    textAlign: "center",
                    paddingTop: spacing[4],
                    paddingBottom: spacing[4],
                  }}
                >
                  {socialRow}
                </td>
              </tr>
            )}
            {p.address && (
              <tr>
                <td style={{ textAlign: "center" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: "rgb(107,114,128)",
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {p.address}
                  </Text>
                </td>
              </tr>
            )}
            {p.contactInfo && (
              <tr>
                <td style={{ textAlign: "center" }}>
                  <Text
                    style={{
                      margin: 0,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: "rgb(107,114,128)",
                      fontFamily: typography.fontFamily.body,
                    }}
                  >
                    {p.contactInfo}
                  </Text>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Section>
    );
  }

  // Split variant
  return (
    <Section
      style={{
        backgroundColor: bgColor,
        padding: `${spacing[10]} ${spacing[8]}`,
      }}
    >
      <Row>
        <Column
          colSpan={4}
          style={{ verticalAlign: "top", paddingRight: spacing[6] }}
        >
          {logoEl && (
            <Section style={{ marginBottom: spacing[3] }}>{logoEl}</Section>
          )}
          {p.companyName && (
            <Text
              style={{
                margin: 0,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.semibold,
                color: "rgb(17,24,39)",
                fontFamily: typography.fontFamily.body,
              }}
            >
              {p.companyName}
            </Text>
          )}
          {p.tagline && (
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontSize: typography.fontSize.base,
                color: "rgb(107,114,128)",
                fontFamily: typography.fontFamily.body,
              }}
            >
              {p.tagline}
            </Text>
          )}
        </Column>
        <Column style={{ verticalAlign: "top", textAlign: "right" }}>
          {socialRow && (
            <Section
              style={{ textAlign: "right", marginBottom: spacing[3] }}
            >
              {socialRow}
            </Section>
          )}
          {p.address && (
            <Text
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: "rgb(107,114,128)",
                fontFamily: typography.fontFamily.body,
                textAlign: "right",
              }}
            >
              {p.address}
            </Text>
          )}
          {p.contactInfo && (
            <Text
              style={{
                margin: `${spacing[1]} 0 0 0`,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.semibold,
                color: "rgb(107,114,128)",
                fontFamily: typography.fontFamily.body,
                textAlign: "right",
              }}
            >
              {p.contactInfo}
            </Text>
          )}
        </Column>
      </Row>
    </Section>
  );
}

function renderTestimonial(p: TestimonialBlockProps) {
  return (
    <Testimonial
      quote={p.quote}
      authorName={p.authorName}
      authorTitle={p.authorTitle || undefined}
      authorPhotoUrl={p.authorPhotoUrl || undefined}
      rating={p.rating || undefined}
      variant={p.variant}
    />
  );
}

function renderStats(p: StatsProps) {
  if (p.variant === "cards") {
    return (
      <Section style={{ padding: spacing[4] }}>
        <Row>
          {p.items.map((item, i) => (
            <Column key={i} style={{ padding: "0 4px" }}>
              <Section style={{ marginBottom: "8px" }}>
                <Row>
                  <Column
                    style={{
                      minHeight: "112px",
                      borderRadius: "16px",
                      backgroundColor: "#f3f4f6",
                      padding: "16px",
                    }}
                  >
                    <Text
                      style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: 700,
                        letterSpacing: "-0.025em",
                        color: "#111827",
                      }}
                    >
                      {item.value}
                    </Text>
                    <Text
                      style={{
                        margin: "4px 0 0 0",
                        fontSize: "12px",
                        color: "#6b7280",
                      }}
                    >
                      {item.label}
                    </Text>
                  </Column>
                </Row>
              </Section>
            </Column>
          ))}
        </Row>
      </Section>
    );
  }

  // Default "row" variant
  return (
    <StatsRow
      stats={p.items.map(item => ({ value: item.value, label: item.label }))}
      columns={p.columns}
      showDividers={p.showDividers}
      backgroundColor={p.cardBackgroundColor}
    />
  );
}

function renderFeatureList(p: FeatureListProps) {
  // Variant: icon-rows — icon on left, title + description on right, separated by Hr dividers
  if (p.variant === "icon-rows") {
    return (
      <Section style={{ padding: spacing[4] }}>
        {p.items.map((item, index) => (
          <React.Fragment key={index}>
            <Hr style={{ borderColor: "#e5e7eb", borderWidth: "1px", margin: "0" }} />
            <Section style={{ padding: `${spacing[3]} 0` }}>
              <Row>
                <Column style={{ verticalAlign: "baseline", width: "48px", paddingRight: "12px" }}>
                  {item.iconUrl ? (
                    <Img src={item.iconUrl} alt="" width={48} height={48} />
                  ) : (
                    <Text style={{ margin: 0, fontSize: "24px", color: colors.primary }}>
                      {"\u25CF"}
                    </Text>
                  )}
                </Column>
                <Column style={{ width: "85%" }}>
                  <Text style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "rgb(17,24,39)" }}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={{ margin: "4px 0 0 0", fontSize: "16px", color: "rgb(107,114,128)" }}>
                      {item.description}
                    </Text>
                  )}
                </Column>
              </Row>
            </Section>
          </React.Fragment>
        ))}
        <Hr style={{ borderColor: "#e5e7eb", borderWidth: "1px", margin: "0" }} />
      </Section>
    );
  }

  // Variant: numbered-circles — number in colored circle on left, title + description on right
  if (p.variant === "numbered-circles") {
    return (
      <Section style={{ padding: spacing[4] }}>
        {p.items.map((item, index) => (
          <Section key={index} style={{ marginBottom: "36px" }}>
            <Row style={{ paddingLeft: "12px", paddingRight: "32px" }}>
              <Column style={{ width: "24px", paddingRight: "18px" }}>
                <Row>
                  <Column
                    style={{
                      width: "24px",
                      height: "24px",
                      backgroundColor: "rgb(79,70,229)",
                      borderRadius: "9999px",
                      textAlign: "center" as const,
                    }}
                  >
                    <Text
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "12px",
                        fontWeight: 600,
                        lineHeight: "24px",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </Column>
                </Row>
              </Column>
              <Column>
                <Text style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "rgb(17,24,39)" }}>
                  {item.title}
                </Text>
                {item.description && (
                  <Text style={{ margin: "4px 0 0 0", fontSize: "14px", color: "rgb(107,114,128)" }}>
                    {item.description}
                  </Text>
                )}
              </Column>
            </Row>
          </Section>
        ))}
      </Section>
    );
  }

  // Default: "numbered" or "bulleted" variants
  return (
    <Section style={{ padding: spacing[4] }}>
      {p.items.map((item, index) => (
        <Row key={index} style={{ marginBottom: spacing[3] }}>
          <Column style={{ width: "32px", verticalAlign: "top" }}>
            <Text style={{ margin: 0, fontSize: "14px", color: colors.primary, fontWeight: "bold" }}>
              {p.variant === "numbered" ? `${index + 1}.` : "\u2022"}
            </Text>
          </Column>
          <Column>
            <Text style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: colors.text.primary }}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={{ margin: `4px 0 0 0`, fontSize: "14px", color: colors.text.muted }}>
                {item.description}
              </Text>
            )}
          </Column>
        </Row>
      ))}
    </Section>
  );
}

function renderRating(p: RatingProps) {
  return (
    <SurveyCTA
      question={p.question}
      surveyUrl={p.surveyUrl}
      showRatingScale={true}
      ratingLabels={{ low: p.lowLabel, high: p.highLabel }}
    />
  );
}

function renderCallout(p: CalloutProps) {
  return (
    <CalloutBox
      variant={p.variant === "success" ? "default" : p.variant}
      title={p.title || undefined}
    >
      {p.text}
    </CalloutBox>
  );
}

function renderList(p: ListProps) {
  return (
    <Section style={{ padding: `${spacing[2]} ${spacing[6]}` }}>
      <EmailList
        items={p.items}
        type={p.type}
        markerColor={p.markerColor}
      />
    </Section>
  );
}

function renderButtonGroup(p: ButtonGroupProps) {
  return (
    <EmailButtonGroup
      buttons={p.buttons.map(b => ({ href: b.href, label: b.text, variant: b.variant as "primary" | "secondary" | "ghost" | "inverse" }))}
      align={p.align}
      stackOnMobile={p.stackOnMobile}
    />
  );
}

function renderHero(p: HeroProps) {
  return (
    <HeroCTA
      headline={p.headline}
      subheadline={p.description || undefined}
      buttonText={p.buttonText}
      buttonUrl={p.buttonHref}
      imageUrl={p.imageUrl || undefined}
      imageAlt={p.imageAlt}
      imagePosition={p.imagePosition}
    />
  );
}

function renderGallery(p: GalleryProps) {
  const images = p.images ?? [];

  if (p.variant === "featured") {
    const img = images[0];
    return (
      <Section style={{ padding: spacing[6] }}>
        <Heading as="h2" style={{
          margin: 0,
          fontSize: typography.fontSize["2xl"],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: "8px",
        }}>
          {p.heading}
        </Heading>
        {p.description && (
          <Text style={{
            margin: 0,
            fontSize: typography.fontSize.base,
            color: colors.text.muted,
            marginBottom: spacing[4],
          }}>
            {p.description}
          </Text>
        )}
        {img ? (
          <Link href={img.href}>
            <Img
              src={img.src}
              alt={img.alt}
              width={600}
              style={{ borderRadius: "12px", width: "100%", objectFit: "cover" as const, maxHeight: "400px" }}
            />
          </Link>
        ) : (
          <Text style={{ color: colors.text.muted, fontSize: "14px" }}>
            [Featured image placeholder]
          </Text>
        )}
      </Section>
    );
  }

  // Grid variant (2x2)
  const gridImages = images.slice(0, 4);
  const rows: { src: string; alt: string; href: string }[][] = [];
  for (let i = 0; i < gridImages.length; i += 2) {
    rows.push(gridImages.slice(i, i + 2));
  }

  return (
    <Section style={{ padding: spacing[6] }}>
      <Heading as="h2" style={{
        margin: 0,
        fontSize: typography.fontSize["2xl"],
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: "8px",
      }}>
        {p.heading}
      </Heading>
      {p.description && (
        <Text style={{
          margin: 0,
          fontSize: typography.fontSize.base,
          color: colors.text.muted,
          marginBottom: spacing[4],
        }}>
          {p.description}
        </Text>
      )}
      {rows.map((row, rowIdx) => (
        <Row key={rowIdx} style={{ marginBottom: "12px" }}>
          {row.map((img, colIdx) => (
            <Column key={colIdx} style={{ width: "50%", padding: "0 6px" }}>
              <Link href={img.href}>
                <Img
                  src={img.src}
                  alt={img.alt}
                  width={280}
                  height={288}
                  style={{ borderRadius: "12px", objectFit: "cover" as const, width: "100%" }}
                />
              </Link>
            </Column>
          ))}
        </Row>
      ))}
    </Section>
  );
}

function renderArticle(p: ArticleProps) {
  const headingEl = (
    <Heading as="h1" style={{
      margin: 0,
      fontSize: p.variant === "hero" ? typography.fontSize["3xl"] : typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: "8px",
    }}>
      {p.heading}
    </Heading>
  );

  const descriptionEl = p.description ? (
    <Text style={{
      margin: 0,
      fontSize: typography.fontSize.base,
      color: colors.text.muted,
      lineHeight: "1.6",
      marginBottom: spacing[4],
    }}>
      {p.description}
    </Text>
  ) : null;

  const buttonEl = p.buttonText ? (
    <ReactEmailButton
      href={p.buttonHref}
      style={{
        display: "inline-block",
        padding: "12px 24px",
        backgroundColor: colors.primary,
        color: "#ffffff",
        borderRadius: "4px",
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.semibold,
        textDecoration: "none",
      }}
    >
      {p.buttonText}
    </ReactEmailButton>
  ) : null;

  const imageEl = p.imageUrl ? (
    <Img
      src={p.imageUrl}
      alt={p.imageAlt}
      width={600}
      style={{ borderRadius: "12px", width: "100%", display: "block" }}
    />
  ) : null;

  if (p.variant === "horizontal") {
    return (
      <Section style={{ padding: spacing[6] }}>
        <Row>
          <Column style={{ width: "50%", verticalAlign: "top", paddingRight: spacing[4] }}>
            {imageEl || (
              <Text style={{ color: colors.text.muted, fontSize: "14px" }}>
                [Image placeholder]
              </Text>
            )}
          </Column>
          <Column style={{ width: "50%", verticalAlign: "top" }}>
            {headingEl}
            {descriptionEl}
          </Column>
        </Row>
      </Section>
    );
  }

  // Hero variant (default)
  return (
    <Section style={{ padding: spacing[6] }}>
      {imageEl}
      <Section style={{ textAlign: "center", paddingTop: spacing[4] }}>
        {headingEl}
        {descriptionEl}
        {buttonEl}
      </Section>
    </Section>
  );
}

function renderAvatar(p: AvatarBlockProps) {
  const size = p.size ?? 44;
  const shape = p.shape ?? "circle";
  const radius = shape === "circle" ? "50%" : "8px";
  const images = p.images ?? [];

  if (p.variant === "stacked" && images.length > 1) {
    // Overlapping avatar stack using negative margins
    return (
      <Section style={{ padding: `${spacing[2]} ${spacing[6]}`, textAlign: "center" }}>
        <Row style={{ display: "inline-table" }}>
          {images.slice(0, 5).map((img, i) => (
            <Column key={i} style={{ display: "inline-block", marginLeft: i > 0 ? `-${size / 4}px` : "0" }}>
              <Img
                src={img.src}
                alt={img.alt || "Avatar"}
                width={size}
                height={size}
                style={{
                  borderRadius: radius,
                  objectFit: "cover" as const,
                  border: "2px solid #ffffff",
                  display: "block",
                }}
              />
            </Column>
          ))}
        </Row>
      </Section>
    );
  }

  if (p.variant === "profile") {
    const img = images[0];
    return (
      <Section style={{ padding: `${spacing[2]} ${spacing[6]}` }}>
        <Row>
          <Column style={{ width: `${size}px`, verticalAlign: "middle" }}>
            {img?.src ? (
              <Img
                src={img.src}
                alt={img.alt || "Avatar"}
                width={size}
                height={size}
                style={{ borderRadius: radius, objectFit: "cover" as const, display: "block" }}
              />
            ) : (
              <Section style={{
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: radius,
                backgroundColor: "#e5e7eb",
              }} />
            )}
          </Column>
          <Column style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
            {p.name && (
              <Text style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "rgb(17,24,39)" }}>
                {p.name}
              </Text>
            )}
            {p.title && (
              <Text style={{ margin: "2px 0 0 0", fontSize: "12px", color: "rgb(107,114,128)" }}>
                {p.title}
              </Text>
            )}
          </Column>
        </Row>
      </Section>
    );
  }

  // Single variant (default)
  const img = images[0];
  return (
    <Section style={{ padding: `${spacing[2]} ${spacing[6]}`, textAlign: "center" }}>
      {img?.src ? (
        <Img
          src={img.src}
          alt={img.alt || "Avatar"}
          width={size}
          height={size}
          style={{ borderRadius: radius, objectFit: "cover" as const, display: "inline-block" }}
        />
      ) : (
        <Section style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: radius,
          backgroundColor: "#e5e7eb",
          display: "inline-block",
        }} />
      )}
    </Section>
  );
}
