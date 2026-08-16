import type { CompetitorPageConfig } from "../types";
import {
  getMarketingTierPriceLabel,
  MARKETING_TRIAL_FACTS,
} from "../../marketing/pricing-facts";

/**
 * Complete competitor page configuration for Birdeye.
 *
 * Positioning: Birdeye = general-purpose review platform that serves restaurants,
 * healthcare, auto dealers, and other local businesses. RepWell = focused
 * review management for client-facing teams.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: Birdeye pricing page, product docs, and public marketing pages.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const birdeyeConfig: CompetitorPageConfig = {
  slug: "birdeye",
  competitorName: "Birdeye",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title: "Birdeye Alternative for Client-Facing Teams | RepWell vs Birdeye",
    description:
      "Looking for a Birdeye alternative? RepWell offers transparent pricing, review automation, AI-powered insights, and team-level reputation workflows.",
    keywords: [
      "Birdeye alternative",
      "Birdeye competitor",
      "Birdeye vs RepWell",
      "Birdeye replacement",
      "review management platform",
      "client feedback platform",
      "team reputation management",
      "NPS survey tool",
      "birdeye pricing",
      "birdeye reviews",
    ],
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "Birdeye Alternative for Growing Teams",
    h1: "Birdeye vs RepWell",
    subhead:
      "Birdeye serves a wide range of local businesses. RepWell focuses on client-facing teams that need review collection, team visibility, AI-powered insights, and straightforward pricing.",
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
      headline: "Review collection without the per-location maze",
      body: "Birdeye packages broad local-business tools. RepWell starts with the review workflows client-facing teams need every day.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("basic"),
          competitor: "Published packages vary by location",
        },
        {
          feature: "Individual profile pages",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Team-level attribution",
          repwell: true,
          competitor: "Limited",
        },
        { feature: "Review request automation", repwell: true, competitor: true },
        { feature: "Google review integration", repwell: true, competitor: true },
        { feature: "NPS surveys", repwell: true, competitor: "Add-on" },
        { feature: "Automated survey triggers", repwell: true, competitor: true },
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
      headline: "Industry-specific tools, not one-size-fits-all",
      body: "Birdeye charges premium prices for broad local-business workflows. RepWell's Pro tier includes AI sentiment analysis, testimonial management, and leaderboards for sales-based teams.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("pro"),
          competitor: "Published packages vary by location",
        },
        { feature: "AI sentiment analysis", repwell: true, competitor: "Add-on" },
        {
          feature: "Testimonial management",
          repwell: true,
          competitor: "Limited",
        },
        { feature: "Team leaderboards", repwell: true, competitor: false },
        {
          feature: "Social media publishing",
          repwell: true,
          competitor: true,
        },
        {
          feature: "CRM integration",
          repwell: true,
          competitor: true,
        },
        { feature: "Custom survey builder", repwell: true, competitor: true },
        {
          feature: "Priority support",
          repwell: "Phone + chat",
          competitor: "Email + chat",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Enterprise",
      headline: "Enterprise reputation management without extra complexity",
      body: "Birdeye often centers pricing around locations. RepWell gives growing teams multi-branch management, team reporting, and governance without hiding the core plan structure.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("enterprise"),
          competitor: "Custom quote",
        },
        {
          feature: "Multi-branch management",
          repwell: true,
          competitor: true,
        },
        {
          feature: "Regional benchmarking",
          repwell: true,
          competitor: false,
        },
        { feature: "API access", repwell: true, competitor: true },
        { feature: "SSO / SAML", repwell: true, competitor: "Enterprise only" },
        {
          feature: "Compliance-safe AI responses",
          repwell: true,
          competitor: false,
        },
        {
          feature: "White-label options",
          repwell: true,
          competitor: "Enterprise add-on",
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
    headline: "Moving from Birdeye is straightforward",
    body: "Birdeye makes it possible to export your data. RepWell helps client-facing teams get running with clean profile, request, and reporting workflows.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "Birdeye CSV exports import directly into RepWell" },
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
      title: "Focused workflows, not one-size-fits-all",
      description:
        "Birdeye serves many local-business categories with a broad platform. RepWell is focused on review workflows for client-facing teams.",
      repwellValue:
        "Team profiles, review requests, NPS surveys, and AI-powered insights",
      competitorValue:
        "Broad local-business platform for many industries",
    },
    {
      icon: "Link",
      title: "CRM and workflow integrations",
      description:
        "RepWell connects review requests, survey workflows, and reporting to the systems your team already uses.",
      repwellValue:
        "CRM, Google Business Profile, Zapier, and API workflows",
      competitorValue: "Broad integrations across local-business tools",
    },
    {
      icon: "ShieldCheck",
      title: "Governance for growing teams",
      description:
        "Role-based access, approval workflows, and account-level controls help teams manage feedback consistently.",
      repwellValue: "Built-in team permissions, approval flows, and review controls",
      competitorValue: "Governance depends on package and configuration",
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
        title: "Export your Birdeye data",
        description:
          "Birdeye supports CSV exports for reviews, contacts, and survey data. We'll walk you through pulling everything you need.",
      },
      {
        number: 2,
        title: "We import and map your data",
        description:
          "Our migration team imports your reviews, contacts, and templates into RepWell, then creates team profiles with review history.",
      },
      {
        number: 3,
        title: "Connect your CRM and review channels",
        description:
          "Connect Google Business Profile, your CRM, Zapier, or API workflows with guided setup.",
      },
      {
        number: 4,
        title: "Train your team",
        description:
          "Live training for admins, managers, and team members, plus on-demand video tutorials and a searchable knowledge base.",
      },
      {
        number: 5,
        title: "Go live with RepWell workflows",
        description:
          "Your migration specialist stays available after launch to handle issues and optimize your setup.",
      },
    ],
    contractBuyoutNote:
      "In a Birdeye contract? Ask about our contract buyout program for qualifying teams.",
    timeline: "Guided migration",
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
        question: "How is RepWell different from Birdeye?",
        answer:
          "Birdeye is a broad local-business review platform. RepWell focuses on review management for client-facing teams: individual profiles, NPS surveys, team reporting, AI-powered insights, and transparent Basic/Pro/Enterprise pricing.",
      },
      {
        question: "Can I migrate my data from Birdeye?",
        answer:
          "Yes. Birdeye supports CSV data exports. Our migration team imports your reviews, contacts, survey templates, and historical data into RepWell, then helps map profiles and reporting to your team structure.",
      },
      {
        question: "Why would a client-facing team switch from Birdeye?",
        answer:
          "Teams switch when they want profile-level review workflows, NPS surveys, AI-powered insights, and simpler pricing without buying a broader local-business platform.",
      },
      {
        question: "How does RepWell pricing compare with Birdeye?",
        answer:
          `RepWell publishes Basic at ${getMarketingTierPriceLabel("basic")} and Pro at ${getMarketingTierPriceLabel("pro")}, with custom Enterprise pricing. Birdeye pricing varies by package and location, so teams should compare the exact workflows they need before switching.`,
      },
      {
        question: "Will I lose my Google reviews if I switch from Birdeye?",
        answer:
          "No. Your Google reviews belong to your Google Business Profile, not to Birdeye. They stay exactly where they are. RepWell connects to your existing GBP listing and picks up right where you left off.",
      },
      {
        question: "Does Birdeye have individual profile pages?",
        answer:
          "Birdeye is primarily organized around business locations. RepWell supports individual profile pages, team-level attribution, review history, and contact workflows.",
      },
      {
        question: "Can Birdeye connect to my operating systems?",
        answer:
          "Birdeye offers integrations for many local-business workflows. RepWell supports CRM, Zapier, Google Business Profile, and API-based connections for review request automation.",
      },
      {
        question: "How does RepWell help teams govern review workflows?",
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
    headline: "Ready to move from broad reviews to focused workflows?",
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
        { name: "Google review monitoring", repwell: true, competitor: true },
        { name: "Zillow review integration", repwell: true, competitor: false },
        { name: "Automated review requests", repwell: true, competitor: true },
        {
          name: "AI review response suggestions",
          repwell: true,
          competitor: "Basic",
        },
        { name: "Review response templates", repwell: true, competitor: true },
        {
          name: "Multi-platform review aggregation",
          repwell: true,
          competitor: true,
        },
        { name: "Review widget for website", repwell: true, competitor: true },
      ],
    },
    {
      category: "Surveys & NPS",
      features: [
        { name: "NPS surveys", repwell: true, competitor: "Add-on" },
        { name: "CSAT surveys", repwell: true, competitor: "Add-on" },
        {
          name: "Post-close survey automation",
          repwell: true,
          competitor: false,
        },
        {
          name: "Conditional logic / branching",
          repwell: true,
          competitor: true,
        },
        { name: "LOS-triggered surveys", repwell: true, competitor: false },
        { name: "Survey analytics dashboard", repwell: true, competitor: true },
      ],
    },
    {
      category: "AI & Analytics",
      features: [
        { name: "Sentiment analysis", repwell: "Included", competitor: "Add-on" },
        { name: "Key phrase extraction", repwell: true, competitor: "Limited" },
        { name: "Predictive NPS trending", repwell: true, competitor: false },
        { name: "Branch benchmarking", repwell: true, competitor: "Basic" },
        { name: "AI executive summaries", repwell: true, competitor: false },
        { name: "Compliance-safe AI responses", repwell: true, competitor: false },
        { name: "Custom report builder", repwell: true, competitor: true },
      ],
    },
    {
      category: "Team & Engagement",
      features: [
        { name: "Individual profile pages", repwell: true, competitor: false },
        { name: "Team-level attribution", repwell: true, competitor: false },
        {
          name: "Team leaderboards",
          repwell: true,
          competitor: false,
        },
        { name: "Gamification & badges", repwell: true, competitor: false },
        {
          name: "Performance contests",
          repwell: true,
          competitor: false,
        },
        { name: "Social media publishing", repwell: true, competitor: true },
      ],
    },
    {
      category: "Testimonials",
      features: [
        {
          name: "Written testimonial collection",
          repwell: true,
          competitor: "Limited",
        },
        {
          name: "Video testimonial collection",
          repwell: true,
          competitor: false,
        },
        {
          name: "Approval workflow",
          repwell: true,
          competitor: false,
        },
        { name: "Website testimonial widget", repwell: true, competitor: false },
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
        { name: "Transparent published pricing", repwell: true, competitor: true },
        { name: "Per-user pricing (not per-location)", repwell: true, competitor: false },
        { name: "Month-to-month billing", repwell: true, competitor: true },
        { name: "Phone support", repwell: true, competitor: "Enterprise only" },
        { name: "Live chat support", repwell: true, competitor: true },
        { name: "Onboarding under 1 week", repwell: true, competitor: false },
        { name: "API access", repwell: true, competitor: true },
        { name: "99.9% uptime SLA", repwell: true, competitor: "99.5%" },
      ],
    },
  ],
};
