// Competitor comparison page types
// Foundational data contract for all competitor vs RepWell pages (E19)

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Call-to-action link */
export interface CtaLink {
  /** Button/link label */
  label: string;
  /** Destination URL */
  href: string;
}

/** Stat with value and label (e.g. "4.9 / 5" + "on G2") */
export interface StatItem {
  value: string;
  label: string;
}

/** Trust badge displayed near CTAs */
export interface TrustBadge {
  /** Icon name (Lucide) */
  icon: string;
  /** Badge label */
  label: string;
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

/** SEO metadata for a competitor comparison page */
export interface CompetitorSEO {
  /** Page title (appears in browser tab and search results) */
  title: string;
  /** Meta description */
  description: string;
  /** Target keywords */
  keywords: string[];
  /** Open Graph image URL */
  ogImage?: string;
  /** Canonical URL override */
  canonicalUrl?: string;
  /** Twitter card type */
  twitterCard?: "summary" | "summary_large_image";
}

// ---------------------------------------------------------------------------
// Section 1: Hero
// ---------------------------------------------------------------------------

/** Hero section configuration */
export interface CompetitorHero {
  /** Badge text (e.g. "#1 Alternative") */
  badge: string;
  /** Main headline (e.g. "[Competitor] vs RepWell") */
  h1: string;
  /** Supporting subheadline */
  subhead: string;
  /** Primary CTA (e.g. "Start Free Trial") */
  primaryCta: CtaLink;
  /** Secondary CTA (e.g. "See Pricing") */
  secondaryCta: CtaLink;
  /** Key stat displayed prominently */
  stat?: StatItem;
}

// ---------------------------------------------------------------------------
// Section 2: Logo Bar
// ---------------------------------------------------------------------------

/** Customer logo in the scrolling logo bar */
export interface LogoBarItem {
  /** Company name (used as alt text) */
  name: string;
  /** Logo image URL */
  logoUrl: string;
}

// ---------------------------------------------------------------------------
// Section 3: Pricing Tabs
// ---------------------------------------------------------------------------

/** Single row in the pricing comparison table */
export interface PricingComparisonRow {
  /** Feature name */
  feature: string;
  /** RepWell value (e.g. "Included", "$49/mo", true) */
  repwell: string | boolean;
  /** Competitor value */
  competitor: string | boolean;
}

/** One tab within the pricing comparison section */
export interface PricingTab {
  /** Tab label (e.g. "Starter", "Pro") */
  tabLabel: string;
  /** Tab headline */
  headline: string;
  /** Tab body copy */
  body: string;
  /** Feature comparison rows */
  comparisonRows: PricingComparisonRow[];
  /** CTA label for this tab */
  ctaLabel: string;
}

// ---------------------------------------------------------------------------
// Section 4: Transition
// ---------------------------------------------------------------------------

/** Single bullet item in the transition section */
export interface TransitionBullet {
  /** Bullet text */
  text: string;
}

/** Smooth transition / divider section between major blocks */
export interface TransitionSection {
  /** Headline text */
  headline: string;
  /** Supporting body text */
  body: string;
  /** Bullet list of items customers keep when switching */
  bullets?: TransitionBullet[];
  /** Optional background style hint */
  variant?: "gradient" | "dark" | "light";
}

// ---------------------------------------------------------------------------
// Section 5: Testimonials
// ---------------------------------------------------------------------------

/** Testimonial card from a customer who switched */
export interface TestimonialCard {
  /** Quoted text */
  quote: string;
  /** Author name */
  author: string;
  /** Author role/title */
  role: string;
  /** Author company */
  company: string;
  /** Star rating (1-5) */
  rating: number;
  /** Mention of the competitor they switched from */
  competitorMention?: string;
  /** Avatar image URL */
  avatarUrl?: string;
}

// ---------------------------------------------------------------------------
// Section 6: Differentiators
// ---------------------------------------------------------------------------

/** Card highlighting a key differentiator */
export interface DifferentiatorCard {
  /** Icon name (Lucide) */
  icon: string;
  /** Differentiator title */
  title: string;
  /** Differentiator description */
  description: string;
  /** RepWell's value/approach */
  repwellValue: string;
  /** Competitor's value/approach */
  competitorValue: string;
}

// ---------------------------------------------------------------------------
// Section 7: Feature Cards
// ---------------------------------------------------------------------------

/** Showcase card for a specific feature */
export interface FeatureCard {
  /** Screenshot or illustration URL */
  screenshot: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Optional badge (e.g. "New", "AI-Powered") */
  badge?: string;
}

// ---------------------------------------------------------------------------
// Section 8: AI Capabilities
// ---------------------------------------------------------------------------

/** Tab within the AI capabilities section */
export interface AICapabilityTab {
  /** Tab label */
  tabLabel: string;
  /** Headline for this capability */
  headline: string;
  /** Description */
  description: string;
  /** Feature bullet points */
  features: string[];
  /** Illustration or screenshot URL */
  illustration: string;
}

// ---------------------------------------------------------------------------
// Section 9: Integrations
// ---------------------------------------------------------------------------

/** Integration logo entry */
export interface IntegrationItem {
  /** Integration name */
  name: string;
  /** Logo image URL */
  logoUrl: string;
  /** Category (e.g. "CRM", "LOS", "Communication") */
  category: string;
}

// ---------------------------------------------------------------------------
// Section 10: Industry-Specific Features
// ---------------------------------------------------------------------------

/** Industry-specific feature */
export interface IndustryFeature {
  /** Icon name (Phosphor) */
  icon: string;
  /** Feature title */
  title: string;
  /** Feature description */
  description: string;
  /** Whether this is unique to RepWell */
  repwellExclusive?: boolean;
}

/** Section-level configuration for the industry-specific section */
export interface IndustrySectionConfig {
  /** Section headline */
  headline?: string;
  /** Section description */
  description?: string;
  /** CTA linking to industry landing page or demo */
  cta?: CtaLink;
  /** Visual stat callout (e.g. "500+" companies) */
  stat?: StatItem;
}

// ---------------------------------------------------------------------------
// Section 11: Migration Steps
// ---------------------------------------------------------------------------

/** Individual step in the migration process */
export interface MigrationStep {
  /** Step number (1-based) */
  number: number;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
}

/** Migration section configuration */
export interface MigrationSection {
  /** Ordered migration steps */
  steps: MigrationStep[];
  /** Contract buyout note (e.g. "We'll buy out your contract") */
  contractBuyoutNote?: string;
  /** Estimated migration timeline (e.g. "Under 2 weeks") */
  timeline: string;
}

// ---------------------------------------------------------------------------
// Section 12: Rating Comparison
// ---------------------------------------------------------------------------

/** Rating scores for a single platform set */
export interface PlatformRatings {
  /** G2 score (e.g. 4.9) */
  g2Score: number;
  /** Number of G2 reviews */
  g2ReviewCount: number;
  /** Capterra score */
  capterra?: number;
  /** Trustpilot score */
  trustpilot?: number;
}

/** Side-by-side rating comparison */
export interface RatingComparison {
  /** RepWell's ratings */
  repwell: PlatformRatings;
  /** Competitor's ratings */
  competitor: PlatformRatings;
}

// ---------------------------------------------------------------------------
// Section 13: Case Studies
// ---------------------------------------------------------------------------

/** Metric showing before/after results */
export interface CaseStudyMetric {
  /** Metric label (e.g. "Review Volume") */
  label: string;
  /** Before value (e.g. "12/month") */
  before: string;
  /** After value (e.g. "85/month") */
  after: string;
  /** Percentage change (e.g. "+608%") — displayed in green */
  percentageChange?: string;
}

/** Case study entry */
export interface CaseStudy {
  /** Company name */
  companyName: string;
  /** Industry vertical */
  industry: string;
  /** Company logo URL */
  logo: string;
  /** Before/after metrics */
  metrics: CaseStudyMetric[];
  /** Pull quote */
  quote: string;
  /** Link to full case study */
  ctaHref: string;
}

// ---------------------------------------------------------------------------
// Section 14: FAQ
// ---------------------------------------------------------------------------

/** Single FAQ item */
export interface FAQItem {
  /** Question text */
  question: string;
  /** Answer text (supports markdown) */
  answer: string;
}

/** FAQ section with standard and competitor-specific questions */
export interface FAQSection {
  /** General product questions */
  standard: FAQItem[];
  /** Questions specific to switching from this competitor */
  competitorSpecific: FAQItem[];
}

// ---------------------------------------------------------------------------
// Section 15: Social Proof
// ---------------------------------------------------------------------------

/** Social proof card (review from a third-party platform) */
export interface SocialProofCard {
  /** Quoted text */
  quote: string;
  /** Reviewer name */
  author: string;
  /** Reviewer role/title */
  role: string;
  /** Reviewer company */
  company: string;
  /** Star rating (1-5) */
  rating: number;
  /** Source platform (e.g. "G2", "Capterra") */
  platform: string;
  /** Review date (ISO string) */
  date: string;
}

// ---------------------------------------------------------------------------
// Section 16: Footer CTA
// ---------------------------------------------------------------------------

/** Footer call-to-action section */
export interface FooterCta {
  /** Section headline */
  headline: string;
  /** Supporting subheadline */
  subhead: string;
  /** Primary CTA */
  primaryCta: CtaLink;
  /** Secondary CTA */
  secondaryCta: CtaLink;
  /** Trust badges displayed near CTAs */
  trustBadges: TrustBadge[];
}

// ---------------------------------------------------------------------------
// Feature Comparison Table (standalone section)
// ---------------------------------------------------------------------------

/** Single feature within a comparison category */
export interface FeatureComparisonItem {
  /** Feature name */
  name: string;
  /** RepWell support (true = supported, string = details) */
  repwell: boolean | string;
  /** Competitor support */
  competitor: boolean | string;
}

/** Category grouping for the feature comparison table */
export interface FeatureComparisonCategory {
  /** Category name (e.g. "Review Management", "Analytics") */
  category: string;
  /** Features within this category */
  features: FeatureComparisonItem[];
}

// ---------------------------------------------------------------------------
// Root config
// ---------------------------------------------------------------------------

/**
 * Complete configuration for a competitor comparison page.
 *
 * Each field maps to a rendered section. The page template (S115)
 * consumes this config and renders all 16 sections in order.
 */
export interface CompetitorPageConfig {
  /** URL slug (e.g. "experience-com", "birdeye") */
  slug: string;
  /** Competitor display name */
  competitorName: string;
  /** Competitor logo URL */
  competitorLogo: string;

  // -- Page sections (rendered in order) --

  /** SEO metadata */
  seo: CompetitorSEO;
  /** Section 1: Hero */
  hero: CompetitorHero;
  /** Section 2: Scrolling logo bar */
  logoBar: LogoBarItem[];
  /** Section 3: Pricing comparison tabs */
  pricingTabs: PricingTab[];
  /** Section 4: Transition / divider */
  transitionSection: TransitionSection;
  /** Section 5: Customer testimonials */
  testimonials: TestimonialCard[];
  /** Section 6: Key differentiators */
  differentiators: DifferentiatorCard[];
  /** Section 7: Feature showcase cards */
  featureCards: FeatureCard[];
  /** Section 8: AI capability tabs */
  aiCapabilities: AICapabilityTab[];
  /** Section 9: Integration logos */
  integrations: IntegrationItem[];
  /** Section 10: Industry-specific features */
  industryFeatures: IndustryFeature[];
  /** Section 10: Industry section-level configuration (headline, CTA, stat) */
  industrySectionConfig?: IndustrySectionConfig;
  /** Section 11: Migration steps */
  migration: MigrationSection;
  /** Section 12: Rating comparison */
  ratingComparison: RatingComparison;
  /** Section 13: Case studies */
  caseStudies: CaseStudy[];
  /** Section 14: FAQ */
  faq: FAQSection;
  /** Section 15: Social proof wall */
  socialProof: SocialProofCard[];
  /** Section 16: Footer CTA */
  footerCta: FooterCta;
  /** Full feature comparison table */
  featureComparison: FeatureComparisonCategory[];
}
