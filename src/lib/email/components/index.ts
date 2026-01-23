/**
 * Email Design System Components
 *
 * This module exports all email components following the Repwell design system.
 * Built with @react-email/components for maximum email client compatibility.
 */

// =============================================================================
// THEME
// =============================================================================
export {
  colors,
  typography,
  spacing,
  layout,
  shadows,
  gradients,
  emailStyles,
  buttonStyles,
  inlineStyles,
  mergeStyles,
  emailTheme,
  type EmailTheme,
} from "../theme";

// =============================================================================
// LAYOUT COMPONENTS
// =============================================================================
export {
  EmailLayout,
  SingleColumnLayout,
  TwoColumnLayout,
  CardGridLayout,
  EmailSection,
  type EmailLayoutProps,
  type SingleColumnLayoutProps,
  type TwoColumnLayoutProps,
  type CardGridLayoutProps,
  type EmailSectionProps,
} from "./email-layout";

// =============================================================================
// HEADER COMPONENTS
// =============================================================================
export {
  EmailHeader,
  RepwellHeader,
  OrganizationHeader,
  StatusHeader,
  type EmailHeaderProps,
  type RepwellHeaderProps,
  type OrganizationHeaderProps,
  type StatusHeaderProps,
} from "./email-header";

// =============================================================================
// FOOTER COMPONENTS
// =============================================================================
export {
  EmailFooter,
  RepwellFooter,
  PoweredByFooter,
  type EmailFooterProps,
  type RepwellFooterProps,
  type PoweredByFooterProps,
} from "./email-footer";

// =============================================================================
// TYPOGRAPHY COMPONENTS
// =============================================================================
export {
  EmailHeading,
  EmailParagraph,
  EmailEyebrow,
  EmailLink,
  EmailStrong,
  EmailEmphasis,
  EmailHighlight,
  EmailList,
  EmailQuote,
  EmailPreheader,
  type EmailHeadingProps,
  type EmailParagraphProps,
  type EmailEyebrowProps,
  type EmailLinkProps,
  type EmailStrongProps,
  type EmailEmphasisProps,
  type EmailHighlightProps,
  type EmailListProps,
  type EmailQuoteProps,
  type EmailPreheaderProps,
} from "./email-typography";

// =============================================================================
// BUTTON COMPONENTS
// =============================================================================
export {
  EmailButton,
  EmailButtonGroup,
  IconButton,
  TextLinkButton,
  PrimaryButton,
  SecondaryButton,
  GhostButton,
  type EmailButtonProps,
  type EmailButtonGroupProps,
  type IconButtonProps,
  type TextLinkButtonProps,
} from "./email-button";

// =============================================================================
// CARD COMPONENTS
// =============================================================================
export {
  EmailCard,
  FeatureCard,
  InfoCard,
  SummaryCard,
  ImageCard,
  type EmailCardProps,
  type FeatureCardProps,
  type InfoCardProps,
  type SummaryCardProps,
  type ImageCardProps,
} from "./email-card";

// =============================================================================
// SOCIAL PROOF COMPONENTS
// =============================================================================
export {
  Testimonial,
  ReviewCard,
  SocialProofBar,
  LogoCloud,
  NPSScoreDisplay,
  type TestimonialProps,
  type ReviewCardProps,
  type SocialProofBarProps,
  type LogoCloudProps,
  type NPSScoreDisplayProps,
} from "./email-social-proof";

// =============================================================================
// STATS & METRICS COMPONENTS
// =============================================================================
export {
  StatItem,
  StatsRow,
  StatsCard,
  ProgressBar,
  MetricComparison,
  LeaderboardItem,
  Leaderboard,
  type StatItemProps,
  type StatsRowProps,
  type StatsCardProps,
  type ProgressBarProps,
  type MetricComparisonProps,
  type LeaderboardItemProps,
  type LeaderboardProps,
} from "./email-stats";

// =============================================================================
// CTA COMPONENTS
// =============================================================================
export {
  CTASection,
  HeroCTA,
  InlineCTA,
  BannerCTA,
  SurveyCTA,
  type CTASectionProps,
  type HeroCTAProps,
  type InlineCTAProps,
  type BannerCTAProps,
  type SurveyCTAProps,
} from "./email-cta";

// =============================================================================
// UTILITY COMPONENTS
// =============================================================================
export {
  Spacer,
  Divider,
  TextDivider,
  AccentBar,
  Badge,
  Pill,
  CalloutBox,
  HiddenPreheader,
  ResponsiveHide,
  EmptyState,
  type SpacerProps,
  type DividerProps,
  type TextDividerProps,
  type AccentBarProps,
  type BadgeProps,
  type PillProps,
  type CalloutBoxProps,
  type HiddenPreheaderProps,
  type ResponsiveHideProps,
  type EmptyStateProps,
} from "./email-utilities";

// =============================================================================
// REFERRAL SHARED COMPONENTS
// =============================================================================
export {
  ReferralLinkBox,
  SocialShareButtons,
  SocialShareSection,
  type ReferralLinkBoxProps,
  type SocialShareButtonsProps,
  type SocialShareSectionProps,
  type SocialShareLinksType,
} from "./referral-shared";
