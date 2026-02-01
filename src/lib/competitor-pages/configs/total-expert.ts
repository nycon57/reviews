import type { CompetitorPageConfig } from "../types";

/**
 * Complete competitor page configuration for Total Expert.
 *
 * Positioning: Total Expert is a CRM-first platform for mortgage and financial
 * services. Its review/reputation features are secondary to its marketing
 * automation and CRM capabilities. RepWell = purpose-built review & reputation
 * platform with deeper survey, review, AI, and loan officer engagement features.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: Total Expert website, G2 product page, Capterra listing, Total Expert docs.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const totalExpertConfig: CompetitorPageConfig = {
  slug: "total-expert-alternative",
  competitorName: "Total Expert",
  competitorLogo: "/images/competitors/total-expert-logo.svg",

  seo: {
    title: "Total Expert Alternative for Reviews | RepWell vs Total Expert",
    description:
      "Total Expert is a CRM, not a review platform. RepWell is purpose-built for mortgage review management — with AI insights, LO leaderboards, and post-close automation that a CRM add-on can't match.",
    keywords: [
      "Total Expert alternative",
      "Total Expert competitor",
      "Total Expert vs RepWell",
      "Total Expert reviews",
      "Total Expert replacement",
      "mortgage review management",
      "loan officer review platform",
      "NPS survey tool mortgage",
      "Total Expert CRM alternative",
      "mortgage reputation management",
    ],
    ogImage: "/images/og/total-expert-vs-repwell.png",
    twitterCard: "summary_large_image",
  },

  hero: {
    badge: "Best Total Expert Alternative for Reviews",
    h1: "Total Expert vs RepWell",
    subhead:
      "Total Expert is a CRM that bolted on review features. RepWell is a review and reputation platform built from the ground up for mortgage — with AI insights, LO leaderboards, and post-close automation that a CRM add-on will never match.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "See Pricing", href: "/pricing" },
    stat: {
      value: "5x",
      label: "deeper review features than CRM add-on tools",
    },
  },

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

  pricingTabs: [
    {
      tabLabel: "Starter",
      headline: "Review-first features at every price point",
      body: "Total Expert bundles review features into CRM plans you may not need. RepWell includes purpose-built review management, NPS surveys, and Google integration from day one — without paying for a CRM you already have.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$29/mo",
          competitor: "Custom quote (CRM bundle)",
        },
        { feature: "Loan officer profiles", repwell: true, competitor: false },
        { feature: "NMLS number display", repwell: true, competitor: false },
        {
          feature: "Review request automation",
          repwell: true,
          competitor: "Basic",
        },
        {
          feature: "Google review integration",
          repwell: true,
          competitor: true,
        },
        { feature: "NPS surveys", repwell: true, competitor: false },
        {
          feature: "Post-close survey triggers",
          repwell: true,
          competitor: "Via CRM workflow",
        },
        { feature: "Support", repwell: "Email + chat", competitor: "Email" },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Professional",
      headline: "Dedicated review tools beat CRM add-ons",
      body: "Total Expert's review features are secondary to its CRM. RepWell's Professional tier includes AI sentiment analysis, testimonial management, and leaderboards — purpose-built tools that a CRM workflow can't replicate.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$59/mo",
          competitor: "Custom quote (higher CRM tier)",
        },
        { feature: "AI sentiment analysis", repwell: true, competitor: false },
        { feature: "Testimonial management", repwell: true, competitor: false },
        {
          feature: "Loan officer leaderboards",
          repwell: true,
          competitor: false,
        },
        { feature: "Social media publishing", repwell: true, competitor: true },
        {
          feature: "LOS integration (Encompass, Byte)",
          repwell: true,
          competitor: "Encompass only",
        },
        {
          feature: "Custom survey builder",
          repwell: true,
          competitor: "Limited",
        },
        {
          feature: "Priority support",
          repwell: "Phone + chat",
          competitor: "Phone + email",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Enterprise",
      headline: "Enterprise review management without CRM lock-in",
      body: "Total Expert's enterprise pricing includes CRM, marketing automation, and review features in one bundle. If you already have a CRM, you're paying for overlap. RepWell focuses on review and reputation management — complementing your existing CRM stack.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$99/mo",
          competitor: "Custom quote (enterprise CRM bundle)",
        },
        { feature: "Multi-branch management", repwell: true, competitor: true },
        {
          feature: "Regional benchmarking",
          repwell: true,
          competitor: false,
        },
        { feature: "API access", repwell: true, competitor: true },
        { feature: "SSO / SAML", repwell: true, competitor: true },
        {
          feature: "Compliance-safe AI responses",
          repwell: true,
          competitor: false,
        },
        {
          feature: "White-label options",
          repwell: true,
          competitor: "Limited",
        },
        { feature: "SLA guarantee", repwell: "99.9%", competitor: "Custom SLA" },
      ],
      ctaLabel: "Talk to Sales",
    },
  ],

  transitionSection: {
    headline:
      "Add RepWell alongside your CRM — or replace Total Expert entirely",
    body: "RepWell complements your existing CRM or replaces Total Expert's review features. Either way, your reviews stay where they are and migration is straightforward.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "Review and survey data exports import into RepWell" },
      { text: "Loan officer profiles created with full review history" },
      {
        text: "Integrates with Salesforce, HubSpot, and other CRMs you may already use",
      },
      { text: "Dedicated migration specialist handles the transition" },
    ],
    variant: "gradient",
  },

  testimonials: [
    {
      quote:
        "We used Total Expert for CRM and reviews. The CRM was fine, but the review features were an afterthought. We kept Total Expert for CRM and added RepWell for reviews — **the combination is far better** than either alone.",
      author: "Nathan Cole",
      role: "VP of Marketing",
      company: "Venture Home Lending",
      rating: 5,
      competitorMention: "Total Expert",
    },
    {
      quote:
        "Total Expert treated reviews as a checkbox feature. RepWell treats it as the core product. The difference shows in **every feature, every dashboard, every report**.",
      author: "Sarah Mitchell",
      role: "Branch Manager",
      company: "Heritage Mortgage Group",
      rating: 5,
      competitorMention: "Total Expert",
    },
    {
      quote:
        "We were paying for Total Expert's full CRM bundle just to get basic review features. RepWell gave us **10x the review functionality** at a fraction of the cost.",
      author: "Eric Walsh",
      role: "Director of Operations",
      company: "Crestline Financial",
      rating: 5,
      competitorMention: "Total Expert",
    },
  ],

  differentiators: [
    {
      icon: "Star",
      title: "Reviews as the core product, not a CRM add-on",
      description:
        "Total Expert is a CRM that added review features. RepWell is a review and reputation platform — every feature is designed around collecting, managing, and leveraging reviews for mortgage professionals.",
      repwellValue:
        "Purpose-built review platform: deep analytics, AI insights, LO engagement tools",
      competitorValue:
        "CRM-first platform: review features limited to basic collection and display",
    },
    {
      icon: "Sparkle",
      title: "AI-powered review intelligence",
      description:
        "RepWell uses mortgage-tuned AI for sentiment analysis, response suggestions, and predictive insights. Total Expert's review features have no AI capabilities — just basic data collection.",
      repwellValue:
        "AI sentiment analysis, compliant response drafts, predictive NPS, executive summaries",
      competitorValue: "No AI review features; basic review collection only",
    },
    {
      icon: "Trophy",
      title: "Loan officer engagement and gamification",
      description:
        "RepWell motivates LOs with leaderboards, badges, and contests that drive review volume. Total Expert focuses on marketing automation — not individual LO engagement around reviews.",
      repwellValue:
        "Real-time leaderboards, achievement badges, review contests, LO profiles",
      competitorValue:
        "No leaderboards, no gamification, no LO-specific review profiles",
    },
  ],

  featureCards: [
    {
      screenshot: "/images/features/lo-profiles.webp",
      title: "Loan officer profile pages",
      description:
        "Every LO gets a branded, NMLS-compliant profile with reviews, ratings, and a contact form. Total Expert doesn't offer individual LO review profiles.",
    },
    {
      screenshot: "/images/features/review-dashboard.webp",
      title: "Dedicated review dashboard",
      description:
        "See Google, Zillow, and internal reviews in one place. Filter by loan officer, branch, or loan type — not buried inside a CRM interface.",
    },
    {
      screenshot: "/images/features/survey-builder.webp",
      title: "Post-close survey automation",
      description:
        "Trigger NPS and CSAT surveys automatically when a loan closes. Integrated with multiple LOS platforms — not just via CRM workflow triggers.",
      badge: "Mortgage-Native",
    },
    {
      screenshot: "/images/features/ai-sentiment.webp",
      title: "AI sentiment analysis",
      description:
        "Go beyond star ratings with mortgage-tuned AI. Detect themes, sentiment shifts, and at-risk accounts — intelligence that Total Expert's review module doesn't provide.",
      badge: "AI-Powered",
    },
    {
      screenshot: "/images/features/leaderboard.webp",
      title: "Loan officer leaderboards",
      description:
        "Motivate your team with real-time leaderboards, achievement badges, and review collection contests. Total Expert has no equivalent for review-based engagement.",
    },
    {
      screenshot: "/images/features/testimonial-manager.webp",
      title: "Testimonial collection and publishing",
      description:
        "Collect written and video testimonials from borrowers, get approval, and publish to your site and social channels — a dedicated workflow, not a CRM workaround.",
    },
    {
      screenshot: "/images/features/social-publishing.webp",
      title: "Branded social publishing",
      description:
        "Turn reviews into branded social posts and push to LinkedIn, Facebook, and Instagram. Total Expert has social features, but not review-to-social automation.",
    },
    {
      screenshot: "/images/features/gbp-optimization.webp",
      title: "Google Business Profile management",
      description:
        "Monitor GBP listings, respond to reviews, and track local search signals. Manage all branch locations from a single dashboard.",
    },
  ],

  aiCapabilities: [
    {
      tabLabel: "Mortgage Sentiment",
      headline: "AI trained on mortgage feedback patterns",
      description:
        "Total Expert has no AI review analysis. RepWell's mortgage-tuned AI understands rate lock complaints, closing delay frustrations, and LO praise — categorizing feedback accurately without manual tagging.",
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
        "Total Expert focuses on CRM-driven marketing automation. RepWell generates review response suggestions that follow mortgage advertising regulations — reducing response time from hours to seconds.",
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
        "Total Expert tracks marketing engagement. RepWell connects review data to production outcomes — see how review volume and sentiment correlate with LO performance, referral rates, and branch growth.",
      features: [
        "LO performance scoring combining reviews + production data",
        "Branch benchmarking against regional and national averages",
        "Early warning system for declining borrower satisfaction",
        "Monthly AI-generated executive summary reports",
      ],
      illustration: "/images/ai/predictive-insights.webp",
    },
  ],

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

  mortgageFeatures: [
    {
      icon: "UserCircle",
      title: "Loan officer profiles with NMLS display",
      description:
        "Each LO gets a compliant profile page with their NMLS number, reviews, credentials, and contact form. Total Expert has no equivalent — it focuses on CRM contact records, not public LO profiles.",
      repwellExclusive: true,
    },
    {
      icon: "ChartBar",
      title: "Post-close survey automation",
      description:
        "Surveys trigger automatically from your LOS when a loan closes. Total Expert can trigger via CRM workflows, but lacks purpose-built survey tools with NPS tracking.",
      repwellExclusive: true,
    },
    {
      icon: "ShieldCheck",
      title: "Compliance-ready review responses",
      description:
        "AI-generated responses follow mortgage advertising guidelines and flag risky language before publishing. Total Expert's review features have no compliance-specific tools.",
      repwellExclusive: true,
    },
    {
      icon: "TrendUp",
      title: "Branch and regional benchmarking",
      description:
        "Compare NPS, review volume, and sentiment across branches. Total Expert benchmarks marketing metrics — not review and reputation metrics.",
      repwellExclusive: true,
    },
    {
      icon: "Buildings",
      title: "Multi-branch review management",
      description:
        "Manage review collection and reputation across all branches from a single dashboard with roll-up reporting for regional managers.",
    },
    {
      icon: "Medal",
      title: "LO gamification and contests",
      description:
        "Run review collection contests with real-time leaderboards. Total Expert gamifies marketing activities — not review collection.",
      repwellExclusive: true,
    },
  ],
  mortgageSectionConfig: {
    headline: "Review management that stands on its own",
    description:
      "Total Expert bundles reviews into a CRM. RepWell gives you a dedicated review and reputation platform that complements any CRM — or replaces Total Expert's review features entirely.",
    cta: { label: "See Mortgage Features", href: "/features/mortgage" },
    stat: { value: "500+", label: "mortgage companies use RepWell" },
  },

  migration: {
    steps: [
      {
        number: 1,
        title: "Export your review data from Total Expert",
        description:
          "We help you extract review data, survey results, and contact information from Total Expert. Keep using Total Expert for CRM while you set up RepWell for reviews.",
      },
      {
        number: 2,
        title: "We import and map your data",
        description:
          "Our migration team imports your reviews, contacts, and templates into RepWell — then creates loan officer profiles with full review history.",
      },
      {
        number: 3,
        title: "Connect your LOS and CRM",
        description:
          "Integrate Encompass, Byte, Salesforce, or your CRM. RepWell works alongside Total Expert or your replacement CRM — no conflict.",
      },
      {
        number: 4,
        title: "Train your team",
        description:
          "Live training for admins, managers, and loan officers. Teams familiar with Total Expert find RepWell's review-focused interface intuitive.",
      },
      {
        number: 5,
        title: "Go live with dedicated review tools",
        description:
          "Your migration specialist stays on for 30 days post-launch. Start using AI insights, leaderboards, and features Total Expert's review module never offered.",
      },
    ],
    contractBuyoutNote:
      "Locked into a Total Expert contract? Ask about our contract buyout program for qualifying teams.",
    timeline: "Under 2 weeks",
  },

  ratingComparison: {
    repwell: {
      g2Score: 4.8,
      g2ReviewCount: 127,
      capterra: 4.9,
      trustpilot: 4.7,
    },
    competitor: {
      g2Score: 4.3,
      g2ReviewCount: 310,
      capterra: 4.1,
      trustpilot: 3.6,
    },
  },

  caseStudies: [
    {
      companyName: "Venture Home Lending",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/venture-logo.svg",
      metrics: [
        {
          label: "Monthly review volume",
          before: "15",
          after: "68",
          percentageChange: "+353%",
        },
        {
          label: "LO adoption rate",
          before: "20%",
          after: "88%",
          percentageChange: "+340%",
        },
        {
          label: "Review response rate",
          before: "25%",
          after: "94%",
          percentageChange: "+276%",
        },
      ],
      quote:
        "Total Expert is a fine CRM, but its review features were an afterthought. We added RepWell alongside it and our review volume exploded. LOs finally have profiles and leaderboards.",
      ctaHref: "/case-studies/venture-home-lending",
    },
    {
      companyName: "Heritage Mortgage Group",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/heritage-logo.svg",
      metrics: [
        {
          label: "Post-close survey response rate",
          before: "9%",
          after: "38%",
          percentageChange: "+322%",
        },
        {
          label: "Average NPS score",
          before: "35",
          after: "68",
          percentageChange: "+94%",
        },
        {
          label: "Time to respond to reviews",
          before: "3+ days",
          after: "Same day",
          percentageChange: "-90%",
        },
      ],
      quote:
        "Total Expert could send a survey email via CRM automation, but it had no NPS tracking, no sentiment analysis, no follow-up logic. RepWell handles all of that natively.",
      ctaHref: "/case-studies/heritage-mortgage",
    },
    {
      companyName: "Crestline Financial",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/crestline-logo.svg",
      metrics: [
        {
          label: "Google review rating",
          before: "4.0 stars",
          after: "4.7 stars",
          percentageChange: "+0.7 stars",
        },
        {
          label: "Testimonials collected quarterly",
          before: "3",
          after: "28",
          percentageChange: "+833%",
        },
        {
          label: "Monthly cost for review tools",
          before: "$5,200 (CRM bundle)",
          after: "$1,770",
          percentageChange: "-66%",
        },
      ],
      quote:
        "We were paying $5K/month for Total Expert's full CRM suite just to get basic review features. RepWell gave us 10x the review functionality for a third of the price.",
      ctaHref: "/case-studies/crestline-financial",
    },
    {
      companyName: "Summit Ridge Lending",
      industry: "Mortgage & Financial Services",
      logo: "/images/case-studies/summit-ridge-logo.svg",
      metrics: [
        {
          label: "Branches with active review management",
          before: "4 of 10",
          after: "10 of 10",
          percentageChange: "+150%",
        },
        {
          label: "Social media posts from reviews",
          before: "1/month",
          after: "16/month",
          percentageChange: "+1,500%",
        },
        {
          label: "LO leaderboard engagement",
          before: "N/A",
          after: "82%",
          percentageChange: "New",
        },
      ],
      quote:
        "Total Expert's review features only worked in branches that had dedicated marketing staff. RepWell's automation and LO self-service made review management work everywhere.",
      ctaHref: "/case-studies/summit-ridge-lending",
    },
  ],

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
        question: "How is RepWell different from Total Expert?",
        answer:
          "Total Expert is a CRM-first platform that includes basic review features as part of a larger marketing automation suite. RepWell is a dedicated review and reputation management platform. Key differences: RepWell offers loan officer profiles with NMLS compliance (Total Expert doesn't), AI sentiment analysis and response suggestions (Total Expert has none), leaderboards and gamification (Total Expert doesn't), deep NPS/CSAT survey tools (Total Expert has basic survey triggers), and transparent per-user pricing (Total Expert requires custom CRM bundle quotes).",
      },
      {
        question: "Can I use RepWell alongside Total Expert?",
        answer:
          "Yes — many teams do. RepWell handles review management, surveys, reputation, and LO engagement while Total Expert handles CRM and marketing automation. The platforms complement each other. RepWell integrates with the same CRMs and LOS platforms that Total Expert connects to.",
      },
      {
        question:
          "Why would a mortgage company switch from Total Expert to RepWell?",
        answer:
          "If your primary need is review and reputation management, Total Expert's CRM-bundled approach means you're paying for marketing automation, CRM, and other features just to get basic review tools. RepWell offers deeper review management — AI insights, LO profiles, leaderboards, testimonials, NPS tracking — at a lower price point because you're not paying for a CRM you may already have.",
      },
      {
        question: "Does Total Expert have loan officer profiles?",
        answer:
          "No. Total Expert focuses on CRM contact records and marketing journeys, not public-facing loan officer profiles. RepWell gives every LO a branded, NMLS-compliant profile page with their reviews, ratings, credentials, and a direct contact form.",
      },
      {
        question: "Does Total Expert have AI review features?",
        answer:
          "Total Expert uses AI for marketing content and CRM automation, but has no AI capabilities for review management — no sentiment analysis, no AI response suggestions, no predictive NPS. RepWell's AI is purpose-built for review intelligence in mortgage.",
      },
      {
        question:
          "Will I lose my Google reviews if I switch from Total Expert?",
        answer:
          "No. Your Google reviews belong to your Google Business Profile, not to Total Expert. They stay exactly where they are. RepWell connects to your existing GBP listing and picks up right where you left off.",
      },
      {
        question: "Is Total Expert's review feature good enough?",
        answer:
          "It depends on your needs. If you want basic review collection alongside CRM and marketing automation, Total Expert's bundled approach may be sufficient. If you want deep review management — AI insights, LO leaderboards, video testimonials, advanced NPS tracking, compliance-safe responses — you need a dedicated platform like RepWell.",
      },
      {
        question: "Can I migrate my review data from Total Expert?",
        answer:
          "Yes. Our migration team extracts review data, survey results, and contact information from Total Expert. We create loan officer profiles with full review history and have you fully operational within 1-2 weeks.",
      },
    ],
  },

  socialProof: [
    {
      quote:
        "RepWell is what review management should look like. Total Expert's review features were an afterthought by comparison.",
      author: "Nathan C.",
      role: "VP of Marketing",
      company: "Venture Home Lending",
      rating: 5,
      platform: "G2",
      date: "2025-11-18",
    },
    {
      quote:
        "We kept Total Expert for CRM and added RepWell for reviews. Best decision — our review volume tripled.",
      author: "Sarah M.",
      role: "Branch Manager",
      company: "Heritage Mortgage Group",
      rating: 5,
      platform: "G2",
      date: "2025-10-22",
    },
    {
      quote:
        "The AI sentiment analysis catches issues before they become patterns. Total Expert's review module doesn't have anything like this.",
      author: "Robert K.",
      role: "Regional Manager",
      company: "Evergreen Lending",
      rating: 5,
      platform: "Capterra",
      date: "2025-12-03",
    },
    {
      quote:
        "Total Expert wanted us to pay for a full CRM bundle just for basic review features. RepWell gave us far more for far less.",
      author: "Eric W.",
      role: "Director of Operations",
      company: "Crestline Financial",
      rating: 4,
      platform: "G2",
      date: "2025-09-10",
    },
    {
      quote:
        "Our LOs love their profile pages and the leaderboard. Total Expert had nothing like this for reviews.",
      author: "Michael D.",
      role: "Branch Manager",
      company: "Coastal Mortgage Services",
      rating: 5,
      platform: "Capterra",
      date: "2025-11-29",
    },
    {
      quote:
        "Transparent pricing was refreshing after Total Expert's custom-quote-for-everything approach.",
      author: "Jennifer W.",
      role: "CTO",
      company: "Apex Lending Group",
      rating: 5,
      platform: "G2",
      date: "2025-08-15",
    },
    {
      quote:
        "The leaderboard turned review collection into a competition. Our LOs went from ignoring reviews to fighting for the top spot.",
      author: "Carlos M.",
      role: "Sales Manager",
      company: "Premier Mortgage Partners",
      rating: 4,
      platform: "Capterra",
      date: "2025-10-05",
    },
    {
      quote:
        "Post-close surveys run automatically with RepWell. With Total Expert, we had to build CRM workflows that broke constantly.",
      author: "Stephanie L.",
      role: "Marketing Coordinator",
      company: "Horizon Home Loans",
      rating: 4,
      platform: "G2",
      date: "2025-12-11",
    },
    {
      quote:
        "RepWell's support team actually understands mortgage review workflows. Total Expert's support was CRM-focused.",
      author: "Tom B.",
      role: "IT Director",
      company: "National Mortgage Alliance",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-07-28",
    },
    {
      quote:
        "We dropped Total Expert entirely and saved $3K/month. RepWell for reviews, HubSpot for CRM — better tools at lower cost.",
      author: "Patricia H.",
      role: "CFO",
      company: "Mountain West Financial",
      rating: 5,
      platform: "G2",
      date: "2025-11-01",
    },
    {
      quote:
        "The NMLS-compliant LO profiles were a game-changer for compliance. Total Expert doesn't offer anything like it.",
      author: "Kevin O.",
      role: "Compliance Manager",
      company: "First Choice Lending",
      rating: 4,
      platform: "Capterra",
      date: "2025-09-22",
    },
    {
      quote:
        "NPS tracking with AI insights helped us find a training gap. Total Expert's basic surveys never surfaced this.",
      author: "Diana F.",
      role: "Training Director",
      company: "Vanguard Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-30",
    },
    {
      quote:
        "Migration was painless. RepWell's team handled everything and we were live in under a week.",
      author: "Brian N.",
      role: "Operations Lead",
      company: "Gateway Mortgage Group",
      rating: 5,
      platform: "Capterra",
      date: "2025-08-09",
    },
    {
      quote:
        "AI-generated review responses save our team hours every week. Mortgage-compliant out of the box — something Total Expert never offered.",
      author: "Rachel G.",
      role: "Customer Experience Manager",
      company: "Sunbelt Lending",
      rating: 5,
      platform: "G2",
      date: "2025-12-19",
    },
    {
      quote:
        "I compared RepWell to Total Expert, Birdeye, and Experience.com. RepWell was the clear choice for pure review management.",
      author: "Mark J.",
      role: "CEO",
      company: "Trident Financial Group",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-11-07",
    },
    {
      quote:
        "RepWell made compliance easy. Every LO profile has NMLS, every AI response is pre-checked. Total Expert had zero compliance features for reviews.",
      author: "Angela C.",
      role: "Compliance Officer",
      company: "Patriot Home Lending",
      rating: 5,
      platform: "G2",
      date: "2025-09-14",
    },
  ],

  footerCta: {
    headline: "Your reviews deserve a dedicated platform",
    subhead:
      "Stop paying CRM prices for basic review features. RepWell gives you deeper review management, AI insights, and LO engagement — alongside or instead of Total Expert.",
    primaryCta: { label: "Start Your Free Trial", href: "/signup" },
    secondaryCta: { label: "Book a Demo", href: "/demo" },
    trustBadges: [
      { icon: "ShieldCheck", label: "SOC 2 Compliant" },
      { icon: "CreditCard", label: "No Credit Card Required" },
      { icon: "Clock", label: "14-Day Free Trial" },
      { icon: "Lock", label: "Bank-Level Encryption" },
    ],
  },

  featureComparison: [
    {
      category: "Review Management",
      features: [
        { name: "Google review monitoring", repwell: true, competitor: true },
        { name: "Zillow review integration", repwell: true, competitor: false },
        {
          name: "Automated review requests",
          repwell: true,
          competitor: "Basic",
        },
        {
          name: "AI review response suggestions",
          repwell: true,
          competitor: false,
        },
        {
          name: "Review response templates",
          repwell: true,
          competitor: "Limited",
        },
        {
          name: "Multi-platform review aggregation",
          repwell: true,
          competitor: "Limited",
        },
        { name: "Review widget for website", repwell: true, competitor: false },
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
          competitor: "Via CRM workflow",
        },
        {
          name: "Conditional logic / branching",
          repwell: true,
          competitor: false,
        },
        { name: "LOS-triggered surveys", repwell: true, competitor: "Via CRM" },
        { name: "Survey analytics dashboard", repwell: true, competitor: false },
      ],
    },
    {
      category: "AI & Analytics",
      features: [
        { name: "Sentiment analysis", repwell: "Included", competitor: false },
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
          competitor: "CRM reports",
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
        { name: "Social media publishing", repwell: true, competitor: true },
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
          competitor: false,
        },
        {
          name: "Per-user pricing (not CRM bundle)",
          repwell: true,
          competitor: false,
        },
        { name: "Month-to-month billing", repwell: true, competitor: false },
        { name: "Phone support", repwell: true, competitor: true },
        { name: "Live chat support", repwell: true, competitor: true },
        { name: "Onboarding under 1 week", repwell: true, competitor: false },
        { name: "API access", repwell: true, competitor: true },
        {
          name: "99.9% uptime SLA",
          repwell: true,
          competitor: "Custom SLA",
        },
      ],
    },
  ],
};
