import type { CompetitorPageConfig } from "../types";
import {
  getMarketingTierPriceLabel,
  MARKETING_TRIAL_FACTS,
} from "../../marketing/pricing-facts";

/**
 * Complete competitor page configuration for Trustpilot.
 *
 * Positioning: Trustpilot is a consumer review platform (B2C) built for
 * e-commerce, retail, and general services. RepWell is a B2B review management
 * platform for client-facing teams that need owned workflows and team visibility.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: Trustpilot pricing page, product docs, and public marketing pages.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const trustpilotConfig: CompetitorPageConfig = {
  slug: "trustpilot",
  competitorName: "Trustpilot",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title:
      "Trustpilot Alternative for Client-Facing Teams | RepWell vs Trustpilot",
    description:
      "Trustpilot is a consumer review marketplace. RepWell is a B2B review management platform with team profiles, survey workflows, and AI-powered insights.",
    keywords: [
      "Trustpilot alternative",
      "Trustpilot competitor",
      "Trustpilot vs RepWell",
      "Trustpilot replacement",
      "B2B review platform",
      "review management platform",
      "client feedback platform",
      "team reputation management",
      "Trustpilot pricing",
      "Trustpilot business reviews",
    ],
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "B2B Review Management Platform",
    h1: "Trustpilot vs RepWell",
    subhead:
      "Trustpilot is a consumer review marketplace built for broad public discovery. RepWell is a B2B review management platform for teams that need owned profiles, survey workflows, and actionable feedback.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "See Pricing", href: "/pricing" },
  },

  // ---------------------------------------------------------------------------
  // Section 2: Logo Bar
  // ---------------------------------------------------------------------------
  // Section 3: Pricing Tabs
  // ---------------------------------------------------------------------------
  pricingTabs: [
    {
      tabLabel: "Basic",
      headline: "Review management from day one",
      body: "Trustpilot's free tier gives you a public listing on its marketplace. RepWell gives you review management, NPS surveys, and team profile workflows from the first plan.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("basic"),
          competitor: "Free tier and paid plans",
        },
        {
          feature: "Individual profile pages",
          repwell: true,
          competitor: false,
        },
        { feature: "Team-level attribution", repwell: true, competitor: false },
        {
          feature: "Review request automation",
          repwell: true,
          competitor: true,
        },
        {
          feature: "Google review integration",
          repwell: true,
          competitor: false,
        },
        { feature: "NPS surveys", repwell: true, competitor: false },
        {
          feature: "Automated survey triggers",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Support",
          repwell: "Email + chat",
          competitor: "Email only",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Pro",
      headline: "Industry-specific tools, not consumer marketplace features",
      body: "Trustpilot's paid plans focus on invitation management and widget customization for its consumer platform. RepWell's Pro tier includes AI sentiment analysis, testimonial management, and leaderboards for sales-based teams.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("pro"),
          competitor: "Paid plans by package",
        },
        {
          feature: "AI sentiment analysis",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Testimonial management",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Team leaderboards",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Social media publishing",
          repwell: true,
          competitor: "Limited",
        },
        {
          feature: "CRM integration",
          repwell: true,
          competitor: false,
        },
        { feature: "Custom survey builder", repwell: true, competitor: false },
        {
          feature: "Priority support",
          repwell: "Phone + chat",
          competitor: "Email only",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Enterprise",
      headline: "Enterprise tools without consumer marketplace overhead",
      body: "Trustpilot's enterprise plans are designed for large brands managing consumer sentiment. RepWell delivers multi-branch management, governance, and reporting for client-facing teams.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("enterprise"),
          competitor: "Custom quote",
        },
        {
          feature: "Multi-branch management",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Regional benchmarking",
          repwell: true,
          competitor: false,
        },
        { feature: "API access", repwell: true, competitor: true },
        {
          feature: "SSO / SAML",
          repwell: true,
          competitor: "Enterprise only",
        },
        {
          feature: "Compliance-safe AI responses",
          repwell: true,
          competitor: false,
        },
        {
          feature: "White-label options",
          repwell: true,
          competitor: false,
        },
        { feature: "SLA guarantee", repwell: "99.9%", competitor: "99.5%" },
      ],
      ctaLabel: "Talk to Sales",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 4: Transition
  // ---------------------------------------------------------------------------
  transitionSection: {
    headline: "Moving from consumer reviews to owned management",
    body: "Trustpilot hosts reviews on its consumer marketplace. RepWell helps you manage reviews across public channels and your own review workflows.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "Trustpilot reviews remain on the Trustpilot marketplace" },
      { text: "Team profiles created with review history" },
      { text: "CRM integrations configured for your workflow" },
      { text: "Dedicated migration specialist handles the transition" },
    ],
    variant: "gradient",
  },

  // ---------------------------------------------------------------------------
  // Section 5: Testimonials
  // ---------------------------------------------------------------------------
  // Section 6: Differentiators
  // ---------------------------------------------------------------------------
  differentiators: [
    {
      icon: "Home",
      title: "B2B workflows, not a consumer marketplace",
      description:
        "Trustpilot is a consumer review marketplace designed for broad public discovery. RepWell is a B2B review management platform for teams that own their feedback workflows.",
      repwellValue:
        "B2B platform: individual profiles, branch management, governance, and reporting",
      competitorValue:
        "Consumer marketplace: public directory listings alongside retail and e-commerce businesses",
    },
    {
      icon: "Users",
      title: "Individual profiles, not company-only pages",
      description:
        "Trustpilot creates one page per company. RepWell supports individual profile pages with reviews, team attribution, and contact workflows.",
      repwellValue:
        "Every team member can have a branded profile page with reviews and a contact form",
      competitorValue:
        "One company page on the Trustpilot marketplace — no individual professional profiles",
    },
    {
      icon: "Link",
      title: "CRM and workflow integrations",
      description:
        "Trustpilot integrates with e-commerce platforms. RepWell connects review requests, survey workflows, and reporting to the systems your team already uses.",
      repwellValue:
        "CRM, Google Business Profile, Zapier, and API workflows",
      competitorValue:
        "Integrations centered on e-commerce and consumer review collection",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 7: Feature Cards
  // ---------------------------------------------------------------------------
  // Section 8: AI Capabilities
  // ---------------------------------------------------------------------------
  // Section 9: Integrations
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Section 11: Migration
  // ---------------------------------------------------------------------------
  migration: {
    steps: [
      {
        number: 1,
        title: "Audit your current review landscape",
        description:
          "We assess your Trustpilot profile, Google Business Profile, Zillow reviews, and any other review sources to plan a comprehensive migration.",
      },
      {
        number: 2,
        title: "We set up your RepWell account",
        description:
          "Our migration team configures your account, connects Google and Zillow, and imports contacts. Trustpilot reviews stay on the Trustpilot marketplace.",
      },
      {
        number: 3,
        title: "Create team profiles",
        description:
          "We build team profile workflows and connect them with existing public review history where available.",
      },
      {
        number: 4,
        title: "Connect your CRM and review channels",
        description:
          "Connect Google Business Profile, your CRM, Zapier, or API workflows with guided setup.",
      },
      {
        number: 5,
        title: "Go live with RepWell workflows",
        description:
          "Your migration specialist stays available after launch. Start collecting reviews with workflows built for client-facing teams.",
      },
    ],
    contractBuyoutNote:
      "In a Trustpilot contract? Ask about our contract buyout program for qualifying teams.",
    timeline: "Under 2 weeks",
  },

  // ---------------------------------------------------------------------------
  // Section 12: Rating Comparison
  // ---------------------------------------------------------------------------
  // Section 13: Case Studies
  // ---------------------------------------------------------------------------
  // Section 14: FAQ
  // ---------------------------------------------------------------------------
  faq: {
    standard: [
      {
        question: "How much does RepWell cost?",
        answer:
          `RepWell Basic is ${getMarketingTierPriceLabel("basic")}, Pro is ${getMarketingTierPriceLabel("pro")}, and Enterprise is ${getMarketingTierPriceLabel("enterprise")}. All plans include core review management, NPS surveys, and Google integration. See our [pricing page](/pricing) for full details.`,
      },
      {
        question: "Is there a free trial?",
        answer:
          `Yes. Every plan includes a ${MARKETING_TRIAL_FACTS.shortCopy}. ${MARKETING_TRIAL_FACTS.creditCardCopy}`,
      },
      {
        question: "How long does it take to get set up?",
        answer:
          "Most teams are fully operational within 3-5 business days. This includes data migration, integration setup, and team training.",
      },
      {
        question: "Do you integrate with my CRM?",
        answer:
          "RepWell connects with common CRM, Google Business Profile, Zapier, and API workflows so your review requests and reporting fit your existing process.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. RepWell is month-to-month with no long-term contracts. You can cancel anytime from your account settings. We also offer annual plans with a discount if you prefer.",
      },
    ],
    competitorSpecific: [
      {
        question: "How is RepWell different from Trustpilot?",
        answer:
          "Trustpilot is a consumer review marketplace where anyone can leave reviews about many kinds of businesses. RepWell is a B2B review management platform for owned workflows: individual profiles, NPS surveys, team reporting, AI-powered insights, and transparent Basic/Pro/Enterprise pricing.",
      },
      {
        question:
          "Why would a client-facing team use RepWell instead of Trustpilot?",
        answer:
          "RepWell is built for teams that want to request, manage, analyze, and route feedback from their own workflows instead of relying on a consumer directory listing.",
      },
      {
        question: "Does Trustpilot integrate with Google Business Profile?",
        answer:
          "Trustpilot manages reviews on its own consumer marketplace. RepWell helps teams manage reviews across Google Business Profile and internal review workflows from a single dashboard.",
      },
      {
        question: "Can Trustpilot send NPS or CSAT surveys?",
        answer:
          "Trustpilot is primarily a review marketplace. RepWell includes survey workflows for NPS and CSAT, plus automation options for review requests.",
      },
      {
        question: "Is Trustpilot free for businesses?",
        answer:
          `Trustpilot offers a free tier with a basic company listing and paid packages for more features. RepWell Basic is ${getMarketingTierPriceLabel("basic")}, Pro is ${getMarketingTierPriceLabel("pro")}, and Enterprise is ${getMarketingTierPriceLabel("enterprise")}.`,
      },
      {
        question: "Will I lose my Trustpilot reviews if I switch to RepWell?",
        answer:
          "No. Trustpilot reviews stay on the Trustpilot marketplace — they are hosted on Trustpilot's platform and do not transfer. RepWell manages reviews across Google, Zillow, and your own platform. You can keep your Trustpilot profile active while using RepWell as your primary review management tool.",
      },
      {
        question: "Does Trustpilot have individual profile pages?",
        answer:
          "Trustpilot creates one company page on its consumer marketplace. RepWell supports individual profile pages with review history, team attribution, and contact workflows.",
      },
      {
        question: "Is Trustpilot a B2B or B2C platform?",
        answer:
          "Trustpilot is primarily a B2C consumer review marketplace. Businesses get a listing, but the platform is designed for consumer discovery. RepWell is a B2B platform designed for businesses to manage, analyze, and grow their review programs.",
      },
      {
        question: "Can Trustpilot connect to operating systems?",
        answer:
          "Trustpilot integrates with e-commerce platforms like Shopify, BigCommerce, and WooCommerce. RepWell supports CRM, Zapier, Google Business Profile, and API-based connections for review request automation.",
      },
      {
        question:
          "How does RepWell help teams govern review workflows?",
        answer:
          "RepWell includes role-based permissions, approval workflows, profile controls, and reporting so managers can keep review requests and responses consistent across the team.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  // Section 16: Footer CTA
  // ---------------------------------------------------------------------------
  footerCta: {
    headline: "Your team deserves more than a consumer directory.",
    subhead:
      "Use RepWell for team profiles, review requests, NPS surveys, AI-powered insights, and straightforward pricing.",
    primaryCta: { label: "Start Your Free Trial", href: "/signup" },
    secondaryCta: { label: "Book a Demo", href: "/demo" },
    trustBadges: [
      { icon: "ShieldCheck", label: "SOC 2 (in progress)" },
      { icon: "CreditCard", label: MARKETING_TRIAL_FACTS.shortCopy },
      { icon: "Lock", label: "Bank-Level Encryption" },
    ],
  },

  // ---------------------------------------------------------------------------
  // Feature Comparison Table
  // ---------------------------------------------------------------------------
  featureComparison: [
    {
      category: "Review Management",
      features: [
        {
          name: "Google review monitoring",
          repwell: true,
          competitor: false,
        },
        {
          name: "Zillow review integration",
          repwell: true,
          competitor: false,
        },
        {
          name: "Automated review requests",
          repwell: true,
          competitor: true,
        },
        {
          name: "AI review response suggestions",
          repwell: true,
          competitor: false,
        },
        {
          name: "Review response templates",
          repwell: true,
          competitor: false,
        },
        {
          name: "Multi-platform review aggregation",
          repwell: true,
          competitor: false,
        },
        { name: "Review widget for website", repwell: true, competitor: true },
      ],
    },
    {
      category: "Surveys & NPS",
      features: [
        { name: "NPS surveys", repwell: true, competitor: false },
        { name: "CSAT surveys", repwell: true, competitor: false },
        {
          name: "Post-close survey automation",
          repwell: true,
          competitor: false,
        },
        {
          name: "Conditional logic / branching",
          repwell: true,
          competitor: false,
        },
        { name: "LOS-triggered surveys", repwell: true, competitor: false },
        {
          name: "Survey analytics dashboard",
          repwell: true,
          competitor: false,
        },
      ],
    },
    {
      category: "AI & Analytics",
      features: [
        {
          name: "Sentiment analysis",
          repwell: "Included",
          competitor: false,
        },
        { name: "Key phrase extraction", repwell: true, competitor: false },
        { name: "Predictive NPS trending", repwell: true, competitor: false },
        { name: "Branch benchmarking", repwell: true, competitor: false },
        { name: "AI executive summaries", repwell: true, competitor: false },
        {
          name: "Compliance-safe AI responses",
          repwell: true,
          competitor: false,
        },
        {
          name: "Custom report builder",
          repwell: true,
          competitor: "Basic",
        },
      ],
    },
    {
      category: "Team & Engagement",
      features: [
        { name: "Individual profile pages", repwell: true, competitor: false },
        { name: "Team-level attribution", repwell: true, competitor: false },
        { name: "Team leaderboards", repwell: true, competitor: false },
        { name: "Gamification & badges", repwell: true, competitor: false },
        { name: "Performance contests", repwell: true, competitor: false },
        {
          name: "Social media publishing",
          repwell: true,
          competitor: "Limited",
        },
      ],
    },
    {
      category: "Testimonials",
      features: [
        {
          name: "Written testimonial collection",
          repwell: true,
          competitor: false,
        },
        {
          name: "Video testimonial collection",
          repwell: true,
          competitor: false,
        },
        { name: "Approval workflow", repwell: true, competitor: false },
        {
          name: "Website testimonial widget",
          repwell: true,
          competitor: false,
        },
        {
          name: "Social publishing from testimonials",
          repwell: true,
          competitor: false,
        },
      ],
    },
    {
      category: "Platform & Support",
      features: [
        {
          name: "Transparent published pricing",
          repwell: true,
          competitor: true,
        },
        {
          name: "Per-user pricing (not per-domain)",
          repwell: true,
          competitor: false,
        },
        {
          name: "Month-to-month billing",
          repwell: true,
          competitor: true,
        },
        {
          name: "Phone support",
          repwell: true,
          competitor: "Enterprise only",
        },
        { name: "Live chat support", repwell: true, competitor: "Limited" },
        { name: "Onboarding under 1 week", repwell: true, competitor: false },
        { name: "API access", repwell: true, competitor: true },
        { name: "99.9% uptime SLA", repwell: true, competitor: "99.5%" },
      ],
    },
  ],
};
