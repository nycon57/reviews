import * as React from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Row,
  Column,
} from "@react-email/components";
import { colors, typography, spacing, layout } from "../theme";

// =============================================================================
// BASE EMAIL LAYOUT
// =============================================================================

export interface EmailLayoutProps {
  /** Preview text shown in email clients */
  preview?: string;
  /** Children components */
  children: React.ReactNode;
  /** Background color for the body */
  bodyBackgroundColor?: string;
  /** Background color for the container */
  containerBackgroundColor?: string;
  /** Custom width for the container */
  maxWidth?: string;
}

/**
 * Base email layout wrapper with proper HTML structure and styling.
 * Provides consistent structure for all Repwell emails.
 */
export function EmailLayout({
  preview,
  children,
  bodyBackgroundColor = colors.background.subtle,
  containerBackgroundColor = colors.background.white,
  maxWidth = layout.maxWidth.email,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
        <style>
          {`
            /* Prevent Apple Mail dark mode color inversion */
            :root { color-scheme: light only; }

            /* Responsive adjustments */
            @media only screen and (max-width: 620px) {
              .email-container {
                width: 100% !important;
                max-width: 100% !important;
              }
              .mobile-padding {
                padding-left: 16px !important;
                padding-right: 16px !important;
              }
              .mobile-stack {
                display: block !important;
                width: 100% !important;
              }
            }
          `}
        </style>
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body
        className="email-body"
        style={{
          backgroundColor: bodyBackgroundColor,
          fontFamily: typography.fontFamily.body,
          margin: 0,
          padding: 0,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <Container
          className="email-container"
          style={{
            maxWidth,
            margin: "0 auto",
            padding: `${spacing[10]} ${spacing[4]}`,
          }}
        >
          <Section
            style={{
              backgroundColor: containerBackgroundColor,
              borderRadius: layout.borderRadius.xl,
              overflow: "hidden",
              boxShadow:
                "0 2px 8px -2px rgba(47, 62, 70, 0.1), 0 4px 16px -4px rgba(47, 62, 70, 0.1)",
            }}
          >
            {children}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// =============================================================================
// RESPONSIVE LAYOUT COMPONENTS
// =============================================================================

export interface SingleColumnLayoutProps {
  /** Children components */
  children: React.ReactNode;
  /** Padding for the section */
  padding?: string;
  /** Background color */
  backgroundColor?: string;
  /** Center content */
  center?: boolean;
}

/**
 * Single column layout - the most common email layout pattern.
 * Mobile-responsive by default (600px max-width).
 */
export function SingleColumnLayout({
  children,
  padding = spacing[8],
  backgroundColor,
  center = false,
}: SingleColumnLayoutProps) {
  return (
    <Section
      className="mobile-padding"
      style={{
        padding,
        backgroundColor,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </Section>
  );
}

export interface TwoColumnLayoutProps {
  /** Left column content */
  left: React.ReactNode;
  /** Right column content */
  right: React.ReactNode;
  /** Gap between columns */
  gap?: string;
  /** Left column width (e.g., "40%", "200px") */
  leftWidth?: string;
  /** Padding for the section */
  padding?: string;
  /** Background color */
  backgroundColor?: string;
  /** Stack columns on mobile */
  stackOnMobile?: boolean;
  /** Reverse order when stacked on mobile */
  reverseOnMobile?: boolean;
}

/**
 * Two column layout - useful for content + image layouts.
 * Stacks to single column on mobile by default.
 */
export function TwoColumnLayout({
  left,
  right,
  gap = spacing[6],
  leftWidth = "50%",
  padding = spacing[8],
  backgroundColor,
  stackOnMobile = true,
}: TwoColumnLayoutProps) {
  const rightWidth = `calc(100% - ${leftWidth} - ${gap})`;

  return (
    <Section
      className="mobile-padding"
      style={{
        padding,
        backgroundColor,
      }}
    >
      <Row>
        <Column
          className={stackOnMobile ? "mobile-stack" : undefined}
          style={{
            width: leftWidth,
            paddingRight: parseInt(gap, 10) / 2 + "px",
            verticalAlign: "top",
          }}
        >
          {left}
        </Column>
        <Column
          className={stackOnMobile ? "mobile-stack" : undefined}
          style={{
            width: rightWidth,
            paddingLeft: parseInt(gap, 10) / 2 + "px",
            verticalAlign: "top",
          }}
        >
          {right}
        </Column>
      </Row>
    </Section>
  );
}

export interface CardGridLayoutProps {
  /** Array of card contents */
  cards: React.ReactNode[];
  /** Number of columns (2 or 3) */
  columns?: 2 | 3;
  /** Gap between cards */
  gap?: string;
  /** Padding for the section */
  padding?: string;
  /** Background color */
  backgroundColor?: string;
}

/**
 * Card grid layout - useful for feature lists, product grids.
 * Renders cards in a responsive grid that stacks on mobile.
 */
export function CardGridLayout({
  cards,
  columns = 2,
  gap = spacing[4],
  padding = spacing[8],
  backgroundColor,
}: CardGridLayoutProps) {
  const columnWidth = columns === 2 ? "50%" : "33.33%";
  const rows: React.ReactNode[][] = [];

  // Group cards into rows
  for (let i = 0; i < cards.length; i += columns) {
    rows.push(cards.slice(i, i + columns));
  }

  return (
    <Section
      className="mobile-padding"
      style={{
        padding,
        backgroundColor,
      }}
    >
      {rows.map((row, rowIndex) => (
        <Row key={rowIndex} style={{ marginBottom: gap }}>
          {row.map((card, colIndex) => (
            <Column
              key={colIndex}
              className="mobile-stack"
              style={{
                width: columnWidth,
                padding: `0 ${parseInt(gap, 10) / 2}px`,
                verticalAlign: "top",
              }}
            >
              {card}
            </Column>
          ))}
          {/* Fill empty columns if row is incomplete */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <Column
                key={`empty-${i}`}
                className="mobile-stack"
                style={{
                  width: columnWidth,
                  padding: `0 ${parseInt(gap, 10) / 2}px`,
                }}
              />
            ))}
        </Row>
      ))}
    </Section>
  );
}

// =============================================================================
// SECTION WRAPPER
// =============================================================================

export interface EmailSectionProps {
  /** Children components */
  children: React.ReactNode;
  /** Padding for the section */
  padding?: string;
  /** Background color */
  backgroundColor?: string;
  /** Add top border */
  borderTop?: boolean;
  /** Add bottom border */
  borderBottom?: boolean;
  /** Border color */
  borderColor?: string;
  /** Center content */
  center?: boolean;
}

/**
 * Generic section wrapper with consistent styling.
 */
export function EmailSection({
  children,
  padding = spacing[6],
  backgroundColor,
  borderTop = false,
  borderBottom = false,
  borderColor = colors.border.default,
  center = false,
}: EmailSectionProps) {
  return (
    <Section
      className="mobile-padding"
      style={{
        padding,
        backgroundColor,
        borderTop: borderTop ? `1px solid ${borderColor}` : undefined,
        borderBottom: borderBottom ? `1px solid ${borderColor}` : undefined,
        textAlign: center ? "center" : "left",
      }}
    >
      {children}
    </Section>
  );
}
