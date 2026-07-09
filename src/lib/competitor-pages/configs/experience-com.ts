import type { CompetitorPageConfig } from "../types";
import {
  getMarketingTierPriceLabel,
  MARKETING_TRIAL_FACTS,
} from "../../marketing/pricing-facts";

/**
 * Complete competitor page configuration for Experience.com.
 *
 * Positioning: Experience.com = expensive enterprise platform with opaque pricing,
 * complex setup, and long-term contracts. RepWell = transparent, mortgage-native,
 * easy to use, fast to deploy.
 */
export const experienceComConfig: CompetitorPageConfig = {
  slug: "experience-com",
  competitorName: "Experience.com",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title:
      "Experience.com Alternative for Mortgage | RepWell vs Experience.com",
    description:
      "Looking for an Experience.com alternative? RepWell offers transparent pricing, mortgage-native review management, and faster setup — without long-term contracts.",
    keywords: [
      "Experience.com alternative",
      "Experience.com competitor",
      "Experience.com vs RepWell",
      "Experience.com replacement",
      "mortgage review management",
      "review management platform",
      "loan officer reviews",
      "NPS survey tool mortgage",
      "experience.com pricing",
      "experience.com reviews",
    ],
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "#1 Experience.com Alternative",
    h1: "Experience.com vs RepWell",
    subhead:
      "Stop overpaying for enterprise complexity. RepWell gives mortgage teams the review management they need — with transparent pricing, faster setup, and support that actually responds.",
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
      headline: "Get started without the enterprise price tag",
      body: "Experience.com requires custom quotes and annual contracts. RepWell starts at a flat monthly rate with no surprises.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("basic"),
          competitor: "Custom quote only",
        },
        { feature: "Annual contract required", repwell: false, competitor: true },
        {
          feature: "Setup fee",
          repwell: "$0",
          competitor: "$2,000+ (reported)",
        },
        { feature: "Review request automation", repwell: true, competitor: true },
        { feature: "NPS surveys", repwell: true, competitor: true },
        { feature: "Google review integration", repwell: true, competitor: true },
        { feature: "Basic analytics", repwell: true, competitor: true },
        {
          feature: "Dedicated support rep",
          repwell: "Email + chat",
          competitor: "Email only",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Pro",
      headline: "Everything a growing team needs",
      body: "Experience.com charges extra for features RepWell includes at every tier — AI insights, testimonial management, and loan officer profiles.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("pro"),
          competitor: "Custom quote only",
        },
        { feature: "AI sentiment analysis", repwell: true, competitor: "Add-on" },
        { feature: "Testimonial management", repwell: true, competitor: "Add-on" },
        { feature: "Loan officer profiles", repwell: true, competitor: "Limited" },
        {
          feature: "Social media publishing",
          repwell: true,
          competitor: "Add-on",
        },
        {
          feature: "Team leaderboards",
          repwell: true,
          competitor: "Enterprise only",
        },
        { feature: "Custom survey builder", repwell: true, competitor: true },
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
      headline: "Enterprise power without enterprise headaches",
      body: "For larger teams, RepWell delivers the same enterprise capabilities at a fraction of the cost — with onboarding measured in days, not months.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: getMarketingTierPriceLabel("enterprise"),
          competitor: "Custom quote only",
        },
        {
          feature: "Onboarding timeline",
          repwell: "3-5 business days",
          competitor: "4-8 weeks",
        },
        { feature: "API access", repwell: true, competitor: true },
        { feature: "SSO / SAML", repwell: true, competitor: true },
        {
          feature: "Custom integrations",
          repwell: "Included",
          competitor: "Professional services required",
        },
        {
          feature: "White-label options",
          repwell: true,
          competitor: "Enterprise add-on",
        },
        {
          feature: "Dedicated success manager",
          repwell: true,
          competitor: true,
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
    headline: "Switching is simpler than you think",
    body: "We handle the heavy lifting so your team can keep doing what they do best — closing loans and earning reviews.",
    bullets: [
      { text: "Your existing Google and Zillow reviews stay intact" },
      { text: "Loan officer profiles migrate with full review history" },
      { text: "CRM and LOS integrations reconnect in hours, not weeks" },
      { text: "Survey templates transfer — no rebuilding from scratch" },
      { text: "Dedicated migration specialist assigned to your account" },
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
      icon: "DollarSign",
      title: "Transparent pricing",
      description:
        "Know exactly what you'll pay before you sign up. No custom quotes, no hidden fees, no surprise invoices.",
      repwellValue: "Published pricing starting at $29/user/mo",
      competitorValue: "Custom quotes only — pricing not disclosed publicly",
    },
    {
      icon: "Zap",
      title: "Set up in days, not months",
      description:
        "Get your team running on RepWell in under a week. Experience.com implementations routinely take 4-8 weeks.",
      repwellValue: "Average setup: 3-5 business days",
      competitorValue: "Average setup: 4-8 weeks with dedicated project manager",
    },
    {
      icon: "Headphones",
      title: "Support that actually responds",
      description:
        "Reach a real person by phone or chat when you need help. No ticketing queues or week-long wait times.",
      repwellValue: "Phone + live chat, < 2 hr average response",
      competitorValue: "Email-only support with 24-48 hr response times",
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
        title: "Schedule your migration call",
        description:
          "We'll review your current Experience.com setup, map your data, and build a migration plan tailored to your team.",
      },
      {
        number: 2,
        title: "We export and import your data",
        description:
          "Our team handles the data transfer — reviews, survey templates, LO profiles, and historical metrics all come over.",
      },
      {
        number: 3,
        title: "Reconnect your integrations",
        description:
          "LOS, CRM, and social connections are re-linked. Most integrations reconnect same-day with our guided setup.",
      },
      {
        number: 4,
        title: "Train your team",
        description:
          "Live training sessions for admins, managers, and loan officers. Plus on-demand video tutorials for future hires.",
      },
      {
        number: 5,
        title: "Go live with confidence",
        description:
          "Your dedicated migration specialist stays on for 30 days post-launch to handle any issues and optimize your setup.",
      },
    ],
    contractBuyoutNote:
      "Stuck in an Experience.com contract? Ask about our contract buyout program.",
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
          "RepWell starts at $29 per user per month with no setup fees and no annual contract required. All plans include core review management, NPS surveys, and Google integration. See our [pricing page](/pricing) for full details.",
      },
      {
        question: "Is there a free trial?",
        answer:
          `Yes. Every plan includes a ${MARKETING_TRIAL_FACTS.shortCopy}. A credit card is required to activate the trial.`,
      },
      {
        question: "How long does it take to get set up?",
        answer:
          "Most teams are fully operational within 3-5 business days. This includes data migration, integration setup, and team training.",
      },
      {
        question: "Do you integrate with my LOS?",
        answer:
          "RepWell integrates with all major loan origination systems including Encompass, Byte, Calyx, and LendingPad. We also connect with CRMs like Salesforce, HubSpot, and BNTouch.",
      },
      {
        question: "Can I cancel anytime?",
        answer:
          "Yes. RepWell is month-to-month with no long-term contracts. You can cancel anytime from your account settings. We also offer annual plans with a discount if you prefer.",
      },
    ],
    competitorSpecific: [
      {
        question: "How is RepWell different from Experience.com?",
        answer:
          "RepWell is purpose-built for mortgage and financial services, while Experience.com is a general-purpose platform adapted for many industries. Key differences: transparent published pricing (vs. custom quotes), setup in days (vs. weeks), phone and chat support (vs. email-only), and mortgage-native features like NMLS-compliant LO profiles and post-close survey automation.",
      },
      {
        question: "Can I migrate my data from Experience.com?",
        answer:
          "Yes. Our migration team handles the full data transfer — including reviews, survey templates, LO profiles, and historical metrics. Most migrations from Experience.com complete within 1-2 weeks with zero downtime.",
      },
      {
        question:
          "I'm in a contract with Experience.com. Can I still switch?",
        answer:
          "We offer a contract buyout program for teams switching from Experience.com. Contact our sales team to discuss your specific situation — we'll work with you to make the transition financially viable.",
      },
      {
        question:
          "Will I lose my Google reviews if I switch from Experience.com?",
        answer:
          "No. Your Google reviews belong to your Google Business Profile, not to Experience.com. They stay exactly where they are. RepWell connects to your existing GBP listing and picks up right where you left off.",
      },
      {
        question:
          "Does RepWell have the same reporting capabilities as Experience.com?",
        answer:
          "RepWell offers comparable reporting with several advantages: real-time dashboards (vs. delayed data), AI-powered sentiment analysis included at every tier, per-LO and per-branch drill-downs, and exportable reports in multiple formats. Most customers find our reporting more actionable and easier to navigate.",
      },
      {
        question: "How does RepWell handle compliance for mortgage companies?",
        answer:
          "RepWell supports mortgage-aware workflows such as NMLS profile fields, configurable survey prompts, and approval steps for AI-assisted responses. Your team stays in control of final review and posting decisions.",
      },
      {
        question:
          "What if my team found Experience.com too complicated — is RepWell easier?",
        answer:
          "Simplicity is a core design principle. RepWell's interface is built so loan officers can request reviews, review feedback, and respond without heavy training or custom implementation work.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  // Section 16: Footer CTA
  // ---------------------------------------------------------------------------
  footerCta: {
    headline: "Ready to leave Experience.com behind?",
    subhead:
      "Move to a simpler review platform with mortgage-aware workflows, transparent pricing, and a setup path your team can understand.",
    primaryCta: { label: "Start Your Free Trial", href: "/signup" },
    secondaryCta: { label: "Book a Demo", href: "/demo" },
    trustBadges: [
      { icon: "ShieldCheck", label: "SOC 2 (in progress)" },
      { icon: "CreditCard", label: MARKETING_TRIAL_FACTS.shortCopy },
      { icon: "Clock", label: "Cancel anytime" },
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
        { name: "Zillow review integration", repwell: true, competitor: true },
        {
          name: "Automated review requests",
          repwell: true,
          competitor: true,
        },
        {
          name: "AI review response suggestions",
          repwell: true,
          competitor: "Add-on",
        },
        {
          name: "Review response templates",
          repwell: true,
          competitor: true,
        },
        {
          name: "Multi-platform review aggregation",
          repwell: true,
          competitor: true,
        },
        {
          name: "Review widget for website",
          repwell: true,
          competitor: "Enterprise only",
        },
      ],
    },
    {
      category: "Surveys & NPS",
      features: [
        { name: "NPS surveys", repwell: true, competitor: true },
        { name: "CSAT surveys", repwell: true, competitor: true },
        {
          name: "Post-close survey automation",
          repwell: true,
          competitor: "Manual setup",
        },
        { name: "Conditional logic / branching", repwell: true, competitor: true },
        {
          name: "LOS-triggered surveys",
          repwell: true,
          competitor: "Custom integration",
        },
        { name: "Survey analytics dashboard", repwell: true, competitor: true },
      ],
    },
    {
      category: "AI & Analytics",
      features: [
        {
          name: "Sentiment analysis",
          repwell: "Included",
          competitor: "Add-on",
        },
        {
          name: "Key phrase extraction",
          repwell: true,
          competitor: "Enterprise only",
        },
        {
          name: "Predictive NPS trending",
          repwell: true,
          competitor: false,
        },
        {
          name: "Branch benchmarking",
          repwell: true,
          competitor: true,
        },
        {
          name: "AI executive summaries",
          repwell: true,
          competitor: false,
        },
        {
          name: "Custom report builder",
          repwell: true,
          competitor: "Enterprise only",
        },
      ],
    },
    {
      category: "Team & Engagement",
      features: [
        { name: "Loan officer profiles", repwell: true, competitor: "Limited" },
        {
          name: "NMLS number display",
          repwell: true,
          competitor: "Custom config",
        },
        {
          name: "Team leaderboards",
          repwell: true,
          competitor: "Enterprise only",
        },
        { name: "Gamification & badges", repwell: true, competitor: false },
        {
          name: "Performance contests",
          repwell: true,
          competitor: false,
        },
        {
          name: "Social media publishing",
          repwell: true,
          competitor: "Add-on",
        },
      ],
    },
    {
      category: "Testimonials",
      features: [
        {
          name: "Written testimonial collection",
          repwell: true,
          competitor: "Add-on",
        },
        {
          name: "Video testimonial collection",
          repwell: true,
          competitor: false,
        },
        {
          name: "Approval workflow",
          repwell: true,
          competitor: "Manual",
        },
        {
          name: "Website testimonial widget",
          repwell: true,
          competitor: "Enterprise only",
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
          competitor: false,
        },
        {
          name: "Month-to-month billing",
          repwell: true,
          competitor: false,
        },
        {
          name: "Phone support",
          repwell: true,
          competitor: "Enterprise only",
        },
        { name: "Live chat support", repwell: true, competitor: false },
        {
          name: "Onboarding under 1 week",
          repwell: true,
          competitor: false,
        },
        { name: "API access", repwell: true, competitor: true },
        { name: "SSO / SAML", repwell: "Pro+", competitor: "Enterprise only" },
        { name: "99.9% uptime SLA", repwell: true, competitor: "99.5%" },
      ],
    },
  ],
};
