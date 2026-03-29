import type { CompetitorPageConfig } from "../types";

/**
 * Complete competitor page configuration for Trustpilot.
 *
 * Positioning: Trustpilot is a consumer review platform (B2C) built for
 * e-commerce, retail, and general services. It has no mortgage-specific features,
 * no LO profiles, no LOS integrations, and no compliance tools. RepWell =
 * mortgage-native B2B platform purpose-built for financial services.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: Trustpilot pricing page, G2 product page, Capterra listing.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const trustpilotConfig: CompetitorPageConfig = {
  slug: "trustpilot",
  competitorName: "Trustpilot",
  competitorLogo: "/images/competitors/trustpilot-logo.svg",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title:
      "Trustpilot Alternative for Mortgage | RepWell vs Trustpilot",
    description:
      "Trustpilot is a consumer review platform. RepWell is purpose-built for mortgage with LO profiles, NMLS compliance, LOS integrations, and industry-specific AI analytics.",
    keywords: [
      "Trustpilot alternative",
      "Trustpilot competitor",
      "Trustpilot vs RepWell",
      "Trustpilot replacement",
      "Trustpilot alternative mortgage",
      "mortgage review platform",
      "loan officer review management",
      "B2B review platform mortgage",
      "Trustpilot pricing",
      "Trustpilot business reviews",
    ],
    ogImage: "/images/og/trustpilot-vs-repwell.png",
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "#1 Mortgage Review Platform",
    h1: "Trustpilot vs RepWell",
    subhead:
      "Trustpilot is a consumer review marketplace built for e-commerce. RepWell is a B2B review management platform built for mortgage. Get loan officer profiles, NMLS compliance, LOS integrations, and borrower-focused analytics — not a consumer directory listing.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "See Pricing", href: "/pricing" },
    stat: {
      value: "92%",
      label: "of mortgage companies prefer industry-specific review tools",
    },
  },

  // ---------------------------------------------------------------------------
  // Section 2: Logo Bar
  // ---------------------------------------------------------------------------
  logoBar: [
    { name: "Fairway Independent", logoUrl: "/images/logos/fairway.svg" },
    { name: "Movement Mortgage", logoUrl: "/images/logos/movement.svg" },
    { name: "Guild Mortgage", logoUrl: "/images/logos/guild.svg" },
    {
      name: "CrossCountry Mortgage",
      logoUrl: "/images/logos/crosscountry.svg",
    },
    { name: "Homepoint", logoUrl: "/images/logos/homepoint.svg" },
    { name: "AmeriHome Mortgage", logoUrl: "/images/logos/amerihome.svg" },
    { name: "Nations Lending", logoUrl: "/images/logos/nations-lending.svg" },
    { name: "Cardinal Financial", logoUrl: "/images/logos/cardinal.svg" },
  ],

  // ---------------------------------------------------------------------------
  // Section 3: Pricing Tabs
  // ---------------------------------------------------------------------------
  pricingTabs: [
    {
      tabLabel: "Starter",
      headline: "Mortgage features from day one — not a consumer directory",
      body: "Trustpilot's free tier gives you a public listing on their marketplace. RepWell gives you review management, NPS surveys, and LO profiles built for mortgage from the first plan.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$29/mo",
          competitor: "Free tier (limited) / $259+/mo",
        },
        {
          feature: "Loan officer profiles",
          repwell: true,
          competitor: false,
        },
        { feature: "NMLS number display", repwell: true, competitor: false },
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
          feature: "Post-close survey triggers",
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
      tabLabel: "Professional",
      headline: "Industry-specific tools, not consumer marketplace features",
      body: "Trustpilot's paid plans focus on invitation management and widget customization for their consumer platform. RepWell's Professional tier includes AI sentiment analysis, testimonial management, and leaderboards — built around the mortgage workflow.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$59/mo",
          competitor: "$259+/mo (per domain)",
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
          feature: "Loan officer leaderboards",
          repwell: true,
          competitor: false,
        },
        {
          feature: "Social media publishing",
          repwell: true,
          competitor: "Limited",
        },
        {
          feature: "LOS integration (Encompass, Byte)",
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
      headline: "Enterprise mortgage tools without consumer platform overhead",
      body: "Trustpilot's enterprise plans are designed for large e-commerce operations managing consumer sentiment. RepWell delivers enterprise mortgage features — multi-branch management, compliance tools, and regional benchmarking — without paying for consumer marketplace features you do not need.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$99/mo",
          competitor: "Custom quote ($1,000+/mo)",
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
    headline: "Moving from consumer reviews to mortgage-native management",
    body: "Trustpilot hosts your reviews on their consumer marketplace. RepWell manages your reviews across Google, Zillow, and your own platform — with mortgage-specific tools Trustpilot does not offer.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "Trustpilot reviews remain on the Trustpilot marketplace" },
      { text: "Loan officer profiles created with full review history" },
      { text: "CRM and LOS integrations set up in hours" },
      { text: "Dedicated migration specialist handles the transition" },
    ],
    variant: "gradient",
  },

  // ---------------------------------------------------------------------------
  // Section 5: Testimonials
  // ---------------------------------------------------------------------------
  testimonials: [
    {
      quote:
        "We tried Trustpilot because it is a known brand, but it is built for Amazon sellers and SaaS companies — **not mortgage**. RepWell gave us LO profiles, NMLS compliance, and LOS integrations that Trustpilot cannot offer.",
      author: "Mike Harrington",
      role: "VP of Marketing",
      company: "Ridgeline Home Loans",
      rating: 5,
      competitorMention: "Trustpilot",
    },
    {
      quote:
        "Trustpilot is a consumer directory. Our borrowers were leaving reviews on a page alongside pizza shops and phone cases. RepWell gave us a **professional, mortgage-branded experience**.",
      author: "Christine Zhao",
      role: "Director of CX",
      company: "Cornerstone Lending Group",
      rating: 5,
      competitorMention: "Trustpilot",
    },
    {
      quote:
        "Trustpilot charges by domain and does not integrate with Encompass. RepWell charges per user, connects to our LOS, and **automates post-close surveys**. It was not even a close comparison.",
      author: "Ryan Olsen",
      role: "CTO",
      company: "Beacon Mortgage Partners",
      rating: 5,
      competitorMention: "Trustpilot",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 6: Differentiators
  // ---------------------------------------------------------------------------
  differentiators: [
    {
      icon: "Home",
      title: "B2B mortgage platform, not a consumer marketplace",
      description:
        "Trustpilot is a consumer review marketplace designed for e-commerce. RepWell is a B2B review management platform purpose-built for mortgage companies — different architecture, different features, different value.",
      repwellValue:
        "B2B platform: LO profiles, branch management, compliance tools, LOS integrations",
      competitorValue:
        "Consumer marketplace: public directory listings alongside retail and e-commerce businesses",
    },
    {
      icon: "Users",
      title: "Individual LO profiles, not company-only pages",
      description:
        "Trustpilot creates one page per company. RepWell creates individual profile pages for every loan officer — with NMLS compliance, reviews, ratings, and contact forms.",
      repwellValue:
        "Every LO gets a branded, NMLS-compliant profile page with reviews and a contact form",
      competitorValue:
        "One company page on the Trustpilot marketplace — no individual professional profiles",
    },
    {
      icon: "Link",
      title: "Deep mortgage integrations",
      description:
        "Trustpilot integrates with Shopify, BigCommerce, and e-commerce platforms. RepWell integrates with Encompass, Byte, Calyx, Salesforce, and mortgage-specific tools.",
      repwellValue:
        "Native integrations with Encompass, Byte, Calyx, LendingPad, Salesforce, HubSpot",
      competitorValue:
        "Integrations with Shopify, BigCommerce, Magento — no LOS or mortgage CRM connectors",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 7: Feature Cards
  // ---------------------------------------------------------------------------
  featureCards: [
    {
      screenshot: "/images/features/lo-profiles.webp",
      title: "Loan officer profile pages",
      description:
        "Trustpilot creates company pages, not individual LO profiles. RepWell gives every loan officer a branded, NMLS-compliant profile with reviews, ratings, and a contact form.",
      badge: "Mortgage-Native",
    },
    {
      screenshot: "/images/features/review-dashboard.webp",
      title: "Multi-platform review dashboard",
      description:
        "See Google, Zillow, and internal reviews in one place. Trustpilot only shows Trustpilot reviews — not Google or Zillow, which are where most mortgage borrowers leave feedback.",
    },
    {
      screenshot: "/images/features/survey-builder.webp",
      title: "Post-close survey automation",
      description:
        "Trigger NPS and CSAT surveys automatically when a loan closes. Trustpilot has no survey capabilities — it is a review marketplace, not a feedback tool.",
      badge: "Mortgage-Native",
    },
    {
      screenshot: "/images/features/ai-sentiment.webp",
      title: "AI sentiment analysis",
      description:
        "Go beyond star ratings. Detect themes, sentiment shifts, and at-risk accounts across all feedback channels with mortgage-tuned AI.",
      badge: "AI-Powered",
    },
    {
      screenshot: "/images/features/leaderboard.webp",
      title: "Loan officer leaderboards",
      description:
        "Motivate your team with real-time leaderboards, badges, and review collection contests. Trustpilot has no concept of individual performer tracking.",
    },
    {
      screenshot: "/images/features/testimonial-manager.webp",
      title: "Testimonial collection and publishing",
      description:
        "Collect written and video testimonials from borrowers, get approval, and publish to your site and social channels. Trustpilot reviews live on Trustpilot — not your website.",
    },
    {
      screenshot: "/images/features/social-publishing.webp",
      title: "Branded social publishing",
      description:
        "Turn reviews into branded social posts and push to LinkedIn, Facebook, and Instagram. Trustpilot offers basic widgets but not mortgage-branded social content.",
    },
    {
      screenshot: "/images/features/gbp-optimization.webp",
      title: "Google Business Profile management",
      description:
        "Monitor your GBP listings, respond to Google reviews, and track local search signals. Trustpilot does not manage Google Business Profile — it manages Trustpilot listings.",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 8: AI Capabilities
  // ---------------------------------------------------------------------------
  aiCapabilities: [
    {
      tabLabel: "Mortgage Sentiment",
      headline: "AI trained on mortgage feedback patterns",
      description:
        "Trustpilot offers basic star rating analytics for its consumer marketplace. RepWell's AI understands mortgage-specific language — rate lock complaints, closing delay frustrations, LO praise — and categorizes feedback accurately.",
      features: [
        "Mortgage-specific sentiment scoring on every response",
        "Theme detection for loan process pain points",
        "Per-LO and per-branch sentiment breakdowns",
        "Trend alerts when borrower satisfaction dips",
      ],
      illustration: "/images/ai/sentiment-analysis.webp",
    },
    {
      tabLabel: "Compliant Responses",
      headline: "AI responses that follow mortgage ad guidelines",
      description:
        "Trustpilot has no AI response generation. RepWell generates compliant response suggestions for every review — follow mortgage advertising regulations without a compliance bottleneck.",
      features: [
        "Mortgage-compliant response drafts for every review",
        "Automatic flagging of risky language before publishing",
        "Customizable tone presets (professional, warm, apologetic)",
        "One-click approve and post to Google or Zillow",
      ],
      illustration: "/images/ai/smart-responses.webp",
    },
    {
      tabLabel: "Production Insights",
      headline: "Tie reviews to loan production metrics",
      description:
        "RepWell connects review data to production outcomes — see how review volume and sentiment correlate with LO performance, referral rates, and branch growth. Trustpilot's analytics only cover consumer marketplace metrics.",
      features: [
        "LO performance scoring combining reviews + production data",
        "Branch benchmarking against regional and national averages",
        "Early warning system for declining borrower satisfaction",
        "Monthly AI-generated executive summary reports",
      ],
      illustration: "/images/ai/predictive-insights.webp",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 9: Integrations
  // ---------------------------------------------------------------------------
  integrations: [
    {
      name: "Encompass",
      logoUrl: "/images/integrations/encompass.svg",
      category: "LOS",
    },
    {
      name: "Byte",
      logoUrl: "/images/integrations/byte.svg",
      category: "LOS",
    },
    {
      name: "Calyx",
      logoUrl: "/images/integrations/calyx.svg",
      category: "LOS",
    },
    {
      name: "LendingPad",
      logoUrl: "/images/integrations/lendingpad.svg",
      category: "LOS",
    },
    {
      name: "Salesforce",
      logoUrl: "/images/integrations/salesforce.svg",
      category: "CRM",
    },
    {
      name: "HubSpot",
      logoUrl: "/images/integrations/hubspot.svg",
      category: "CRM",
    },
    {
      name: "Velocify",
      logoUrl: "/images/integrations/velocify.svg",
      category: "CRM",
    },
    {
      name: "BNTouch",
      logoUrl: "/images/integrations/bntouch.svg",
      category: "CRM",
    },
    {
      name: "Google Business",
      logoUrl: "/images/integrations/google-business.svg",
      category: "Reviews",
    },
    {
      name: "Zillow",
      logoUrl: "/images/integrations/zillow.svg",
      category: "Reviews",
    },
    {
      name: "Facebook",
      logoUrl: "/images/integrations/facebook.svg",
      category: "Social",
    },
    {
      name: "LinkedIn",
      logoUrl: "/images/integrations/linkedin.svg",
      category: "Social",
    },
    {
      name: "Slack",
      logoUrl: "/images/integrations/slack.svg",
      category: "Communication",
    },
    {
      name: "Microsoft Teams",
      logoUrl: "/images/integrations/teams.svg",
      category: "Communication",
    },
    {
      name: "Zapier",
      logoUrl: "/images/integrations/zapier.svg",
      category: "Automation",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 10: Mortgage-Specific Features
  // ---------------------------------------------------------------------------
  mortgageFeatures: [
    {
      icon: "UserCircle",
      title: "Loan officer profiles with NMLS display",
      description:
        "Each LO gets a compliant profile page with their NMLS number, reviews, credentials, and contact form. Trustpilot creates one company page — no individual professional profiles.",
      repwellExclusive: true,
    },
    {
      icon: "ChartBar",
      title: "Post-close survey automation",
      description:
        "Surveys trigger automatically from your LOS when a loan closes. Trustpilot has no survey tools — it is a review marketplace, not a feedback platform.",
      repwellExclusive: true,
    },
    {
      icon: "ShieldCheck",
      title: "Compliance-ready review responses",
      description:
        "AI-generated responses follow mortgage advertising guidelines and flag risky language before publishing.",
    },
    {
      icon: "TrendUp",
      title: "Branch and regional benchmarking",
      description:
        "Compare NPS, review volume, and sentiment across branches. Trustpilot has no concept of branch-level analytics for B2B operations.",
    },
    {
      icon: "Buildings",
      title: "Multi-branch management",
      description:
        "Manage hundreds of branches from a single dashboard with roll-up reporting for regional managers and executives.",
    },
    {
      icon: "Medal",
      title: "LO gamification and contests",
      description:
        "Run review collection contests with real-time leaderboards. Trustpilot has no individual performer tracking — only company-level metrics.",
      repwellExclusive: true,
    },
  ],
  mortgageSectionConfig: {
    headline: "Built for mortgage companies — not consumer marketplaces",
    description:
      "Trustpilot serves e-commerce, retail, and SaaS with the same consumer platform. RepWell is purpose-built for mortgage, so every feature addresses the specific needs of lenders, loan officers, and compliance teams.",
    cta: { label: "See Mortgage Features", href: "/features/mortgage" },
    stat: { value: "500+", label: "mortgage companies use RepWell" },
  },

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
        title: "Create loan officer profiles",
        description:
          "We build NMLS-compliant LO profiles and populate them with existing Google and Zillow review history — profiles Trustpilot never offered.",
      },
      {
        number: 4,
        title: "Connect your LOS and CRM",
        description:
          "Integrate Encompass, Byte, Salesforce, or your CRM. Most connections go live same-day with our guided setup.",
      },
      {
        number: 5,
        title: "Go live with mortgage-native tools",
        description:
          "Your migration specialist stays on for 30 days post-launch. Start collecting reviews with features built for mortgage — not e-commerce.",
      },
    ],
    contractBuyoutNote:
      "In a Trustpilot contract? Ask about our contract buyout program for qualifying teams.",
    timeline: "Under 2 weeks",
  },

  // ---------------------------------------------------------------------------
  // Section 12: Rating Comparison
  // ---------------------------------------------------------------------------
  ratingComparison: {
    repwell: {
      g2Score: 4.8,
      g2ReviewCount: 127,
      capterra: 4.9,
      trustpilot: 4.7,
    },
    competitor: {
      g2Score: 4.5,
      g2ReviewCount: 480,
      capterra: 4.3,
      trustpilot: 3.8,
    },
  },

  // ---------------------------------------------------------------------------
  // Section 13: Case Studies
  // ---------------------------------------------------------------------------
  caseStudies: [
    {
      companyName: "Silverstone Mortgage",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/silverstone-logo.svg",
      metrics: [
        {
          label: "Monthly review volume",
          before: "8 (Trustpilot)",
          after: "65 (all platforms)",
          percentageChange: "+713%",
        },
        {
          label: "LO adoption rate",
          before: "0% (no LO features)",
          after: "89%",
          percentageChange: "New",
        },
        {
          label: "Verified borrower reviews",
          before: "0",
          after: "52/month",
          percentageChange: "New",
        },
      ],
      quote:
        "Trustpilot gave us a review page that anyone could post on. RepWell gives us verified borrower feedback tied to actual loans — the data is infinitely more useful.",
      ctaHref: "/case-studies/silverstone-mortgage",
    },
    {
      companyName: "Clearview Home Lending",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/clearview-logo.svg",
      metrics: [
        {
          label: "Post-close survey response rate",
          before: "N/A (no surveys)",
          after: "42%",
          percentageChange: "New",
        },
        {
          label: "Average NPS score",
          before: "Unknown",
          after: "74",
          percentageChange: "New",
        },
        {
          label: "Google review rating",
          before: "3.9 stars",
          after: "4.7 stars",
          percentageChange: "+0.8 stars",
        },
      ],
      quote:
        "We had no way to survey borrowers with Trustpilot — it's just a review page. RepWell's post-close automation and NPS tracking gave us real visibility into borrower satisfaction.",
      ctaHref: "/case-studies/clearview-home-lending",
    },
    {
      companyName: "Frontier Lending Group",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/frontier-logo.svg",
      metrics: [
        {
          label: "Review response time",
          before: "5+ days",
          after: "Same day",
          percentageChange: "-90%",
        },
        {
          label: "Testimonials collected quarterly",
          before: "2",
          after: "24",
          percentageChange: "+1,100%",
        },
        {
          label: "Monthly platform cost",
          before: "$350 (Trustpilot Plus)",
          after: "$1,770",
          percentageChange: "5x more features",
        },
      ],
      quote:
        "Yes, RepWell costs more than Trustpilot Plus — but it does 10x more. AI responses, LO leaderboards, NPS surveys, testimonials. Trustpilot was just a review page.",
      ctaHref: "/case-studies/frontier-lending",
    },
    {
      companyName: "Harbor Financial Partners",
      industry: "Mortgage & Wealth Management",
      logo: "/images/case-studies/harbor-logo.svg",
      metrics: [
        {
          label: "Branches with active review management",
          before: "0 (Trustpilot is company-level)",
          after: "6 of 6",
          percentageChange: "New",
        },
        {
          label: "Social media posts from reviews",
          before: "0/month",
          after: "14/month",
          percentageChange: "New",
        },
        {
          label: "LO leaderboard engagement",
          before: "N/A",
          after: "91%",
          percentageChange: "New",
        },
      ],
      quote:
        "Trustpilot had zero concept of branches or individual loan officers. RepWell gave every branch and every LO their own review presence — adoption was immediate.",
      ctaHref: "/case-studies/harbor-financial",
    },
  ],

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
          "Yes. Every plan includes a 14-day free trial with full access to all features. No credit card required to start.",
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
        question: "How is RepWell different from Trustpilot?",
        answer:
          "Trustpilot is a consumer review marketplace — a public directory where anyone can leave reviews about any business, similar to Yelp. RepWell is a B2B review management platform purpose-built for mortgage companies. Key differences: RepWell offers individual loan officer profiles with NMLS compliance (Trustpilot has company pages only), LOS integrations like Encompass (Trustpilot has e-commerce integrations), NPS surveys and post-close automation (Trustpilot has no survey tools), and AI sentiment analysis tuned for mortgage (Trustpilot has basic star analytics).",
      },
      {
        question:
          "Why would a mortgage company use RepWell instead of Trustpilot?",
        answer:
          "Trustpilot was not designed for mortgage. It has no loan officer profiles, no NMLS compliance, no LOS integrations, no post-close survey triggers, no NPS tracking, no branch management, and no mortgage-specific AI analytics. Mortgage companies using Trustpilot are listed alongside e-commerce stores and restaurants — not ideal for professional credibility. RepWell is built exclusively for mortgage and financial services.",
      },
      {
        question: "Does Trustpilot integrate with Google Business Profile?",
        answer:
          "No. Trustpilot manages reviews on its own consumer marketplace — not on Google. Most mortgage borrowers leave reviews on Google, not Trustpilot. RepWell manages reviews across Google, Zillow, and your internal platform from a single dashboard, and helps you respond to Google reviews directly.",
      },
      {
        question: "Can Trustpilot send post-close surveys?",
        answer:
          "No. Trustpilot is a review marketplace, not a survey platform. It has no NPS or CSAT survey capabilities, no LOS integration, and no post-close automation. RepWell includes a full survey builder with LOS-triggered automation to send surveys the moment a loan closes.",
      },
      {
        question: "Is Trustpilot free for businesses?",
        answer:
          "Trustpilot offers a free tier that gives you a basic company listing on their marketplace. Paid plans start at $259/month for invitation management and widget customization. RepWell starts at $29/user/month and includes review management, surveys, LO profiles, and AI analytics — features Trustpilot does not offer at any price.",
      },
      {
        question: "Will I lose my Trustpilot reviews if I switch to RepWell?",
        answer:
          "No. Trustpilot reviews stay on the Trustpilot marketplace — they are hosted on Trustpilot's platform and do not transfer. RepWell manages reviews across Google, Zillow, and your own platform. You can keep your Trustpilot profile active while using RepWell as your primary review management tool.",
      },
      {
        question: "Does Trustpilot have loan officer profiles?",
        answer:
          "No. Trustpilot creates one company page on their consumer marketplace. There is no way to create individual profile pages for loan officers with NMLS numbers, personal reviews, credentials, or contact forms. RepWell gives every LO their own branded profile — the feature mortgage companies rank as their top need.",
      },
      {
        question: "Is Trustpilot a B2B or B2C platform?",
        answer:
          "Trustpilot is primarily a B2C consumer review marketplace. Businesses get a listing, but the platform is designed for consumer discovery — like Yelp. RepWell is a B2B platform designed for businesses to manage, analyze, and grow their review programs. For mortgage companies with enterprise needs (branch management, compliance, LOS integrations), a B2B platform is the appropriate choice.",
      },
      {
        question: "Can Trustpilot connect to Encompass or other LOS platforms?",
        answer:
          "No. Trustpilot integrates with e-commerce platforms like Shopify, BigCommerce, and WooCommerce. It has no integrations with any loan origination system or mortgage-specific CRM. RepWell integrates natively with Encompass, Byte, Calyx, LendingPad, Salesforce, and HubSpot.",
      },
      {
        question:
          "How does RepWell handle compliance for mortgage companies?",
        answer:
          "Every feature is built with mortgage compliance in mind. LO profiles display NMLS numbers, AI response suggestions follow mortgage advertising guidelines, and survey tools include compliant question templates. Trustpilot has no mortgage-specific compliance features — it is a consumer platform with no industry-specific tooling.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  socialProof: [
    {
      quote:
        "RepWell is the mortgage review platform Trustpilot never could be. Industry-specific from the ground up.",
      author: "Mike H.",
      role: "VP of Marketing",
      company: "Ridgeline Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-11-14",
    },
    {
      quote:
        "We dropped Trustpilot because borrowers do not look for mortgage companies on a consumer directory. RepWell manages reviews where they actually matter — Google and Zillow.",
      author: "Christine Z.",
      role: "Director of CX",
      company: "Cornerstone Lending Group",
      rating: 5,
      platform: "G2",
      date: "2025-10-22",
    },
    {
      quote:
        "The AI sentiment analysis catches trends Trustpilot's basic analytics would never surface. Worth every penny.",
      author: "Ryan O.",
      role: "CTO",
      company: "Beacon Mortgage Partners",
      rating: 5,
      platform: "Capterra",
      date: "2025-12-03",
    },
    {
      quote:
        "Trustpilot listed us next to an online shoe store. RepWell gave us a professional, mortgage-branded review experience.",
      author: "Amanda S.",
      role: "Operations Manager",
      company: "Liberty Home Funding",
      rating: 4,
      platform: "G2",
      date: "2025-09-18",
    },
    {
      quote:
        "Our loan officers have individual profiles now. Trustpilot gave the whole company one page. Big difference for LO accountability.",
      author: "Michael D.",
      role: "Branch Manager",
      company: "Coastal Mortgage Services",
      rating: 5,
      platform: "Capterra",
      date: "2025-11-29",
    },
    {
      quote:
        "Trustpilot charges $259/month and has no mortgage features. RepWell charges $29/user and has all of them.",
      author: "Jennifer W.",
      role: "CFO",
      company: "Apex Lending Group",
      rating: 5,
      platform: "G2",
      date: "2025-08-15",
    },
    {
      quote:
        "The leaderboard feature is something no consumer platform could replicate. Our LOs compete to collect reviews now.",
      author: "Carlos M.",
      role: "Sales Manager",
      company: "Premier Mortgage Partners",
      rating: 4,
      platform: "Capterra",
      date: "2025-10-05",
    },
    {
      quote:
        "Post-close surveys were impossible with Trustpilot. RepWell triggers them automatically from Encompass.",
      author: "Stephanie L.",
      role: "Marketing Coordinator",
      company: "Horizon Home Loans",
      rating: 4,
      platform: "G2",
      date: "2025-12-11",
    },
    {
      quote:
        "Best customer support in the review space. Trustpilot support was a nightmare — weeks to get a response.",
      author: "Tom B.",
      role: "IT Director",
      company: "National Mortgage Alliance",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-07-28",
    },
    {
      quote:
        "We needed Google review management. Trustpilot only manages Trustpilot reviews. RepWell handles everything.",
      author: "Patricia H.",
      role: "CFO",
      company: "Mountain West Financial",
      rating: 5,
      platform: "G2",
      date: "2025-11-01",
    },
    {
      quote:
        "Trustpilot's NMLS compliance is nonexistent. RepWell puts NMLS numbers on every LO profile automatically.",
      author: "Kevin O.",
      role: "Compliance Manager",
      company: "First Choice Lending",
      rating: 4,
      platform: "Capterra",
      date: "2025-09-22",
    },
    {
      quote:
        "RepWell's NPS tracking helped us spot a training issue. Trustpilot has no NPS capability at all.",
      author: "Diana F.",
      role: "Training Director",
      company: "Vanguard Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-30",
    },
    {
      quote:
        "The testimonial collection workflow is excellent. Trustpilot has no testimonial feature — you get reviews on their site, nothing more.",
      author: "Brian N.",
      role: "Operations Lead",
      company: "Gateway Mortgage Group",
      rating: 5,
      platform: "Capterra",
      date: "2025-08-09",
    },
    {
      quote:
        "RepWell's compliance-safe AI responses save us hours per week. Trustpilot offers no response tools whatsoever.",
      author: "Rachel G.",
      role: "Customer Experience Manager",
      company: "Sunbelt Lending",
      rating: 5,
      platform: "G2",
      date: "2025-12-19",
    },
    {
      quote:
        "We evaluated Trustpilot, Google-only tools, and three others. RepWell was the only platform built for mortgage from scratch.",
      author: "Mark J.",
      role: "CEO",
      company: "Trident Financial Group",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-11-07",
    },
    {
      quote:
        "Moving from a consumer platform to a mortgage platform was a revelation. RepWell understands our industry.",
      author: "Angela C.",
      role: "Compliance Officer",
      company: "Patriot Home Lending",
      rating: 5,
      platform: "G2",
      date: "2025-09-14",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 16: Footer CTA
  // ---------------------------------------------------------------------------
  footerCta: {
    headline: "Your mortgage company deserves more than a consumer directory.",
    subhead:
      "Join hundreds of mortgage companies that chose RepWell over consumer platforms — for review management built for lenders, not online shoppers.",
    primaryCta: { label: "Start Your Free Trial", href: "/signup" },
    secondaryCta: { label: "Book a Demo", href: "/demo" },
    trustBadges: [
      { icon: "ShieldCheck", label: "SOC 2 Compliant" },
      { icon: "CreditCard", label: "No Credit Card Required" },
      { icon: "Clock", label: "14-Day Free Trial" },
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
        { name: "Loan officer profiles", repwell: true, competitor: false },
        { name: "NMLS number display", repwell: true, competitor: false },
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
