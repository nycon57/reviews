import * as React from "react";
import { Heading, Text, Link } from "@react-email/components";
import { colors, typography, spacing } from "../theme";

// =============================================================================
// HEADING COMPONENTS
// =============================================================================

export interface EmailHeadingProps {
  /** Heading level (h1-h6) */
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Children text content */
  children: React.ReactNode;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Custom color */
  color?: string;
  /** Add margin bottom */
  marginBottom?: string;
  /** Use display font (serif) */
  displayFont?: boolean;
}

/**
 * Styled heading component following Repwell typography guidelines.
 * Uses display font (serif) for h1-h2, body font (sans) for h3-h6.
 */
export function EmailHeading({
  as = "h1",
  children,
  align = "left",
  color,
  marginBottom,
  displayFont,
}: EmailHeadingProps) {
  // Determine font family - h1/h2 use display font by default
  const useDisplayFont = displayFont ?? (as === "h1" || as === "h2");

  const headingStyles: Record<string, React.CSSProperties> = {
    h1: {
      fontFamily: useDisplayFont ? typography.fontFamily.display : typography.fontFamily.body,
      fontSize: typography.fontSize["4xl"],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: color || colors.repwell.teal[500],
      margin: `0 0 ${marginBottom || spacing[4]} 0`,
      textAlign: align,
    },
    h2: {
      fontFamily: useDisplayFont ? typography.fontFamily.display : typography.fontFamily.body,
      fontSize: typography.fontSize["3xl"],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight,
      letterSpacing: typography.letterSpacing.tight,
      color: color || colors.repwell.teal[500],
      margin: `0 0 ${marginBottom || spacing[4]} 0`,
      textAlign: align,
    },
    h3: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize["2xl"],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: color || colors.repwell.teal[400],
      margin: `0 0 ${marginBottom || spacing[3]} 0`,
      textAlign: align,
    },
    h4: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: color || colors.repwell.teal[400],
      margin: `0 0 ${marginBottom || spacing[3]} 0`,
      textAlign: align,
    },
    h5: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: color || colors.repwell.teal[400],
      margin: `0 0 ${marginBottom || spacing[2]} 0`,
      textAlign: align,
    },
    h6: {
      fontFamily: typography.fontFamily.body,
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal,
      color: color || colors.repwell.teal[400],
      margin: `0 0 ${marginBottom || spacing[2]} 0`,
      textAlign: align,
    },
  };

  return (
    <Heading as={as} style={headingStyles[as]}>
      {children}
    </Heading>
  );
}

// =============================================================================
// PARAGRAPH COMPONENTS
// =============================================================================

export interface EmailParagraphProps {
  /** Children text content */
  children: React.ReactNode;
  /** Size variant */
  size?: "sm" | "base" | "lg";
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Custom color */
  color?: string;
  /** Muted text style */
  muted?: boolean;
  /** Add margin bottom */
  marginBottom?: string;
  /** Add margin top */
  marginTop?: string;
}

/**
 * Styled paragraph component following Repwell typography guidelines.
 */
export function EmailParagraph({
  children,
  size = "base",
  align = "left",
  color,
  muted = false,
  marginBottom,
  marginTop,
}: EmailParagraphProps) {
  const sizeStyles = {
    sm: {
      fontSize: typography.fontSize.sm,
      lineHeight: typography.lineHeight.relaxed,
    },
    base: {
      fontSize: typography.fontSize.base,
      lineHeight: typography.lineHeight.relaxed,
    },
    lg: {
      fontSize: typography.fontSize.lg,
      lineHeight: typography.lineHeight.relaxed,
    },
  };

  return (
    <Text
      style={{
        fontFamily: typography.fontFamily.body,
        ...sizeStyles[size],
        color: color || (muted ? colors.repwell.teal[300] : colors.repwell.teal[400]),
        margin: `${marginTop || "0"} 0 ${marginBottom || spacing[4]} 0`,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

// =============================================================================
// EYEBROW / LABEL COMPONENT
// =============================================================================

export interface EmailEyebrowProps {
  /** Children text content */
  children: React.ReactNode;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Custom color */
  color?: string;
  /** Add margin bottom */
  marginBottom?: string;
}

/**
 * Eyebrow/label text - small uppercase text for section headers.
 */
export function EmailEyebrow({
  children,
  align = "left",
  color,
  marginBottom = spacing[3],
}: EmailEyebrowProps) {
  return (
    <Text
      style={{
        fontFamily: typography.fontFamily.body,
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.semibold,
        textTransform: "uppercase",
        letterSpacing: typography.letterSpacing.wider,
        color: color || colors.repwell.teal[300],
        margin: `0 0 ${marginBottom} 0`,
        textAlign: align,
      }}
    >
      {children}
    </Text>
  );
}

// =============================================================================
// LINK COMPONENT
// =============================================================================

export interface EmailLinkProps {
  /** Link URL */
  href: string;
  /** Link text */
  children: React.ReactNode;
  /** Custom color */
  color?: string;
  /** Show underline */
  underline?: boolean;
  /** Font weight */
  fontWeight?: "normal" | "medium" | "semibold" | "bold";
}

/**
 * Styled link component with brand colors.
 */
export function EmailLink({
  href,
  children,
  color,
  underline = true,
  fontWeight = "normal",
}: EmailLinkProps) {
  return (
    <Link
      href={href}
      style={{
        fontFamily: typography.fontFamily.body,
        color: color || colors.primary,
        textDecoration: underline ? "underline" : "none",
        fontWeight: typography.fontWeight[fontWeight],
      }}
    >
      {children}
    </Link>
  );
}

// =============================================================================
// INLINE TEXT STYLES
// =============================================================================

export interface EmailStrongProps {
  /** Children text content */
  children: React.ReactNode;
  /** Custom color */
  color?: string;
}

/**
 * Bold/strong text.
 */
export function EmailStrong({ children, color }: EmailStrongProps) {
  return (
    <span
      style={{
        fontWeight: typography.fontWeight.semibold,
        color: color || "inherit",
      }}
    >
      {children}
    </span>
  );
}

export interface EmailEmphasisProps {
  /** Children text content */
  children: React.ReactNode;
  /** Custom color */
  color?: string;
}

/**
 * Emphasized/italic text.
 */
export function EmailEmphasis({ children, color }: EmailEmphasisProps) {
  return (
    <span
      style={{
        fontStyle: "italic",
        color: color || "inherit",
      }}
    >
      {children}
    </span>
  );
}

export interface EmailHighlightProps {
  /** Children text content */
  children: React.ReactNode;
  /** Highlight variant */
  variant?: "sage" | "teal" | "warning" | "success";
}

/**
 * Highlighted text with background color.
 */
export function EmailHighlight({
  children,
  variant = "sage",
}: EmailHighlightProps) {
  const variantStyles = {
    sage: {
      backgroundColor: colors.repwell.sage[100],
      color: colors.repwell.teal[500],
    },
    teal: {
      backgroundColor: colors.repwell.teal[300],
      color: colors.text.inverse,
    },
    warning: {
      backgroundColor: "#fef3c7",
      color: "#92400e",
    },
    success: {
      backgroundColor: "#dcfce7",
      color: "#166534",
    },
  };

  return (
    <span
      style={{
        ...variantStyles[variant],
        padding: `${spacing[1]} ${spacing[2]}`,
        borderRadius: "4px",
        fontWeight: typography.fontWeight.medium,
      }}
    >
      {children}
    </span>
  );
}

// =============================================================================
// LIST COMPONENT
// =============================================================================

export interface EmailListProps {
  /** List items */
  items: React.ReactNode[];
  /** List type */
  type?: "bullet" | "number" | "check";
  /** Custom bullet/check color */
  markerColor?: string;
  /** Text color */
  textColor?: string;
}

/**
 * Styled list component with various marker types.
 */
export function EmailList({
  items,
  type = "bullet",
  markerColor,
  textColor,
}: EmailListProps) {
  const markers = {
    bullet: "\u2022", // •
    number: "", // Will use index
    check: "\u2713", // ✓
  };

  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{ width: "100%" }}
    >
      <tbody>
        {items.map((item, index) => (
          <tr key={index}>
            <td
              style={{
                width: "24px",
                verticalAlign: "top",
                paddingTop: spacing[1],
                paddingBottom: spacing[2],
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                color: markerColor || colors.repwell.sage[200],
                fontWeight: type === "check" ? typography.fontWeight.bold : typography.fontWeight.normal,
              }}
            >
              {type === "number" ? `${index + 1}.` : markers[type]}
            </td>
            <td
              style={{
                paddingLeft: spacing[2],
                paddingBottom: spacing[2],
                verticalAlign: "top",
                fontFamily: typography.fontFamily.body,
                fontSize: typography.fontSize.base,
                lineHeight: typography.lineHeight.relaxed,
                color: textColor || colors.repwell.teal[400],
              }}
            >
              {item}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// =============================================================================
// QUOTE COMPONENT
// =============================================================================

export interface EmailQuoteProps {
  /** Quote text */
  children: React.ReactNode;
  /** Quote author */
  author?: string;
  /** Author title/role */
  authorTitle?: string;
  /** Show decorative quote mark */
  showQuoteMark?: boolean;
}

/**
 * Styled blockquote component following Repwell design.
 * Uses display font for a refined, editorial look.
 * Uses table-based layout for Outlook email client compatibility.
 */
export function EmailQuote({
  children,
  author,
  authorTitle,
  showQuoteMark = true,
}: EmailQuoteProps) {
  // Quote content component to avoid duplication
  const QuoteContent = () => (
    <>
      <Text
        style={{
          fontFamily: typography.fontFamily.display,
          fontSize: typography.fontSize.xl,
          fontStyle: "italic",
          lineHeight: typography.lineHeight.relaxed,
          color: colors.repwell.teal[500],
          margin: 0,
        }}
      >
        {children}
      </Text>
      {(author || authorTitle) && (
        <Text
          style={{
            fontFamily: typography.fontFamily.body,
            fontSize: typography.fontSize.sm,
            color: colors.repwell.teal[300],
            marginTop: spacing[3],
            marginBottom: 0,
          }}
        >
          {author && (
            <span style={{ fontWeight: typography.fontWeight.semibold }}>
              {author}
            </span>
          )}
          {author && authorTitle && " — "}
          {authorTitle}
        </Text>
      )}
    </>
  );

  return (
    <table
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={{
        width: "100%",
        borderLeft: `4px solid ${colors.repwell.sage[200]}`,
        paddingLeft: spacing[5],
        marginTop: spacing[4],
        marginBottom: spacing[4],
      }}
    >
      <tbody>
        <tr>
          <td>
            {showQuoteMark ? (
              // Table-based layout for Outlook compatibility (no absolute positioning)
              <table cellPadding={0} cellSpacing={0} role="presentation" style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "40px", verticalAlign: "top" }}>
                      <Text
                        style={{
                          fontFamily: typography.fontFamily.display,
                          fontSize: "48px",
                          color: colors.repwell.sage[100],
                          lineHeight: "1",
                          margin: 0,
                        }}
                      >
                        &ldquo;
                      </Text>
                    </td>
                    <td style={{ verticalAlign: "top" }}>
                      <QuoteContent />
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <QuoteContent />
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// =============================================================================
// PREHEADER TEXT
// =============================================================================

export interface EmailPreheaderProps {
  /** Preview text */
  text: string;
}

/**
 * Hidden preheader text for email preview in clients.
 * This text appears in the inbox preview but is hidden in the email body.
 */
export function EmailPreheader({ text }: EmailPreheaderProps) {
  // Note: msoHide is a valid MSO-specific CSS property for Outlook email clients
  const preheaderStyle = {
    display: "none",
    maxWidth: 0,
    maxHeight: 0,
    overflow: "hidden",
    msoHide: "all",
    visibility: "hidden",
    opacity: 0,
    color: "transparent",
    height: 0,
    width: 0,
  } as React.CSSProperties;

  return (
    <Text style={preheaderStyle}>
      {text}
      {/* Add whitespace to prevent other text from showing in preview */}
      {"\u200C".repeat(Math.max(0, 150 - text.length))}
    </Text>
  );
}
