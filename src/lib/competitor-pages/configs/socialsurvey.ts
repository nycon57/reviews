import type { CompetitorPageConfig } from "../types";

/**
 * Complete competitor page configuration for SocialSurvey.
 *
 * Positioning: SocialSurvey was acquired by Experience.com and sunset as a
 * standalone product. Former SocialSurvey customers face forced migration to
 * Experience.com's platform or finding an alternative. RepWell = mortgage-native
 * platform that future-proofs their review program without vendor lock-in risk.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: SocialSurvey sunset notice, Experience.com migration docs, G2 archive.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const socialSurveyConfig: CompetitorPageConfig = {
  slug: "socialsurvey-alternative",
  competitorName: "SocialSurvey",
  competitorLogo: "/images/competitors/socialsurvey-logo.svg",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title:
      "SocialSurvey Alternative for Mortgage | Future-Proof Your Reviews with RepWell",
    description:
      "SocialSurvey was acquired and sunset by Experience.com. RepWell is the mortgage-native alternative with LO profiles, NMLS compliance, and no vendor lock-in risk.",
    keywords: [
      "SocialSurvey alternative",
      "SocialSurvey replacement",
      "SocialSurvey shutdown",
      "SocialSurvey acquired",
      "SocialSurvey Experience.com migration",
      "SocialSurvey sunset",
      "mortgage review platform",
      "loan officer review management",
      "NPS survey tool mortgage",
      "review management migration",
    ],
    ogImage: "/images/og/socialsurvey-vs-repwell.png",
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "Future-Proof Your Review Platform",
    h1: "SocialSurvey Is Sunsetting. RepWell Is Your Next Move.",
    subhead:
      "SocialSurvey was acquired by Experience.com and is being phased out. Instead of migrating to another enterprise platform with opaque pricing, move to RepWell — purpose-built for mortgage with transparent pricing and zero vendor lock-in risk.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "See Migration Plan", href: "#migration" },
    stat: {
      value: "0",
      label: "days of downtime during migration to RepWell",
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
      headline: "Transparent pricing from day one",
      body: "SocialSurvey never published pricing — you had to talk to sales. Experience.com is the same. RepWell publishes every plan online with no hidden fees.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$29/mo",
          competitor: "Not published (sales call required)",
        },
        {
          feature: "Loan officer profiles",
          repwell: true,
          competitor: "Limited",
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
          competitor: true,
        },
        { feature: "NPS surveys", repwell: true, competitor: true },
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
      headline: "Mortgage-native tools, not recycled enterprise features",
      body: "SocialSurvey's survey-centric approach lacked review management depth. RepWell combines surveys, reviews, testimonials, and AI analytics in a single mortgage-focused platform.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$59/mo",
          competitor: "Not published",
        },
        {
          feature: "AI sentiment analysis",
          repwell: true,
          competitor: "Basic",
        },
        { feature: "Testimonial management", repwell: true, competitor: false },
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
        { feature: "Custom survey builder", repwell: true, competitor: true },
        {
          feature: "Priority support",
          repwell: "Phone + chat",
          competitor: "Email",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Enterprise",
      headline: "Enterprise features without enterprise lock-in",
      body: "SocialSurvey locked customers into long contracts and then sold to Experience.com. RepWell offers enterprise-grade tools on flexible monthly billing with no acquisition risk.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$99/mo",
          competitor: "Custom quote (annual contract)",
        },
        { feature: "Multi-branch management", repwell: true, competitor: true },
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
          competitor: "Add-on",
        },
        {
          feature: "Month-to-month billing",
          repwell: true,
          competitor: false,
        },
      ],
      ctaLabel: "Talk to Sales",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 4: Transition
  // ---------------------------------------------------------------------------
  transitionSection: {
    headline: "SocialSurvey is sunsetting. Here is your migration path.",
    body: "You do not have to follow SocialSurvey to Experience.com. RepWell provides a dedicated migration path that preserves your data and gets you running on a mortgage-native platform.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "SocialSurvey data exports import directly into RepWell" },
      { text: "Historical survey responses and NPS data preserved" },
      { text: "Loan officer profiles created with full review history" },
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
        "When SocialSurvey announced the acquisition, we panicked. Then we found RepWell — it had everything SocialSurvey offered **plus loan officer profiles and LOS integrations** we never had.",
      author: "Karen Mitchell",
      role: "VP of Operations",
      company: "Pacific Crest Lending",
      rating: 5,
      competitorMention: "SocialSurvey",
    },
    {
      quote:
        "Experience.com wanted us to sign a 2-year contract after the SocialSurvey acquisition. RepWell offered month-to-month billing, transparent pricing, and a **free migration**. Easy decision.",
      author: "David Nakamura",
      role: "Director of Marketing",
      company: "Inland Empire Home Loans",
      rating: 5,
      competitorMention: "SocialSurvey",
    },
    {
      quote:
        "We were SocialSurvey customers for 4 years. The migration to RepWell took 5 business days and we **gained mortgage features** SocialSurvey never built — NMLS profiles, post-close triggers, leaderboards.",
      author: "Lisa Brennan",
      role: "Branch Manager",
      company: "Keystone Mortgage Group",
      rating: 5,
      competitorMention: "SocialSurvey",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 6: Differentiators
  // ---------------------------------------------------------------------------
  differentiators: [
    {
      icon: "ShieldCheck",
      title: "No vendor lock-in risk",
      description:
        "SocialSurvey customers learned the hard way what happens when a vendor gets acquired. RepWell is independently operated with month-to-month billing and full data portability.",
      repwellValue:
        "Month-to-month billing, full data export, no acquisition risk",
      competitorValue:
        "Acquired by Experience.com, forced migration, long-term contracts",
    },
    {
      icon: "Home",
      title: "Mortgage-native, not survey-only",
      description:
        "SocialSurvey focused on surveys and NPS. RepWell combines surveys with review management, testimonials, AI analytics, and LO profiles — all built for mortgage.",
      repwellValue:
        "Full review + survey + testimonial platform with LO profiles and LOS integrations",
      competitorValue:
        "Survey and NPS focused — no review aggregation, no LO profiles, no testimonials",
    },
    {
      icon: "Eye",
      title: "Transparent pricing",
      description:
        "SocialSurvey required a sales call to learn pricing. RepWell publishes every plan online — no surprises, no negotiation games.",
      repwellValue:
        "Published pricing starting at $29/user/month, no setup fees",
      competitorValue:
        "Pricing hidden behind sales calls, typically $500+/mo for enterprise plans",
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
        "SocialSurvey never offered individual LO profiles. RepWell gives every loan officer a branded, NMLS-compliant profile with reviews, ratings, and a contact form.",
      badge: "SocialSurvey Didn't Have This",
    },
    {
      screenshot: "/images/features/review-dashboard.webp",
      title: "Review aggregation dashboard",
      description:
        "SocialSurvey focused on surveys — not reviews. RepWell aggregates Google, Zillow, and internal reviews in one place with loan officer and branch filters.",
    },
    {
      screenshot: "/images/features/survey-builder.webp",
      title: "Post-close survey automation",
      description:
        "Like SocialSurvey's surveys but integrated with your LOS. Trigger NPS and CSAT surveys automatically when loans close — no manual uploads.",
      badge: "Mortgage-Native",
    },
    {
      screenshot: "/images/features/ai-sentiment.webp",
      title: "AI sentiment analysis",
      description:
        "Go beyond the NPS score. Detect themes, sentiment shifts, and at-risk accounts across all feedback channels with mortgage-tuned AI.",
      badge: "AI-Powered",
    },
    {
      screenshot: "/images/features/leaderboard.webp",
      title: "Loan officer leaderboards",
      description:
        "Turn review collection into a team sport with real-time leaderboards, badges, and contests. SocialSurvey had no equivalent.",
    },
    {
      screenshot: "/images/features/testimonial-manager.webp",
      title: "Testimonial management",
      description:
        "Collect written and video testimonials, get approval, and publish to your site and social channels — a workflow SocialSurvey never built.",
    },
    {
      screenshot: "/images/features/social-publishing.webp",
      title: "Branded social publishing",
      description:
        "Turn reviews and testimonials into branded social posts. Push to LinkedIn, Facebook, and Instagram from a single workflow.",
    },
    {
      screenshot: "/images/features/gbp-optimization.webp",
      title: "Google Business Profile management",
      description:
        "Monitor GBP listings, respond to reviews, and track local search signals. Manage all branch locations from a single dashboard.",
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
        "SocialSurvey offered basic NPS analytics. RepWell's AI understands mortgage-specific language — rate lock complaints, closing delay frustrations, LO praise — and categorizes feedback accurately.",
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
        "SocialSurvey had no AI response tools. RepWell generates compliant response suggestions for every review — follow mortgage advertising regulations without a compliance bottleneck.",
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
        "RepWell connects review data to production outcomes — see how review volume and sentiment correlate with LO performance, referral rates, and branch growth.",
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
        "Each LO gets a compliant profile page with their NMLS number, reviews, credentials, and contact form. SocialSurvey never offered individual profiles.",
      repwellExclusive: true,
    },
    {
      icon: "ChartBar",
      title: "Post-close survey automation",
      description:
        "Surveys trigger automatically from your LOS when a loan closes. Preserve the survey workflow you had with SocialSurvey — and make it automatic.",
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
        "Compare NPS, review volume, and sentiment across branches — granularity SocialSurvey's reporting could not match.",
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
        "Run review collection contests with real-time leaderboards. SocialSurvey had no individual performer tracking.",
      repwellExclusive: true,
    },
  ],
  mortgageSectionConfig: {
    headline: "Everything SocialSurvey offered — and everything it didn't",
    description:
      "SocialSurvey was a solid survey tool but lacked review aggregation, LO profiles, and mortgage-specific integrations. RepWell covers the full customer experience lifecycle.",
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
        title: "Export your SocialSurvey data",
        description:
          "Pull your survey responses, NPS data, contacts, and review history from SocialSurvey before the platform sunsets. We provide step-by-step export instructions.",
      },
      {
        number: 2,
        title: "We import and map your data",
        description:
          "Our migration team imports your historical surveys, NPS scores, reviews, and contacts into RepWell — preserving your data continuity.",
      },
      {
        number: 3,
        title: "Create loan officer profiles",
        description:
          "We build NMLS-compliant LO profiles populated with existing review history — a feature SocialSurvey never offered.",
      },
      {
        number: 4,
        title: "Connect your LOS and CRM",
        description:
          "Integrate Encompass, Byte, Salesforce, or your CRM. Most connections go live same-day with our guided setup.",
      },
      {
        number: 5,
        title: "Go live before the SocialSurvey deadline",
        description:
          "Your migration specialist ensures a seamless cutover with zero downtime. Start collecting reviews with mortgage-native tools from day one.",
      },
    ],
    contractBuyoutNote:
      "Stuck in a SocialSurvey or Experience.com contract? Ask about our contract buyout program.",
    timeline: "5 business days",
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
      g2Score: 4.3,
      g2ReviewCount: 85,
      capterra: 4.2,
    },
  },

  // ---------------------------------------------------------------------------
  // Section 13: Case Studies
  // ---------------------------------------------------------------------------
  caseStudies: [
    {
      companyName: "Pacific Crest Lending",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/pacific-crest-logo.svg",
      metrics: [
        {
          label: "Monthly review volume",
          before: "15 (SocialSurvey)",
          after: "72",
          percentageChange: "+380%",
        },
        {
          label: "LO adoption rate",
          before: "35%",
          after: "88%",
          percentageChange: "+151%",
        },
        {
          label: "Migration downtime",
          before: "N/A",
          after: "0 days",
        },
      ],
      quote:
        "The SocialSurvey acquisition forced our hand, but switching to RepWell was the best thing that could have happened. We gained features we didn't know we were missing.",
      ctaHref: "/case-studies/pacific-crest-lending",
    },
    {
      companyName: "Inland Empire Home Loans",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/inland-empire-logo.svg",
      metrics: [
        {
          label: "Post-close survey response rate",
          before: "18% (SocialSurvey)",
          after: "47%",
          percentageChange: "+161%",
        },
        {
          label: "Average NPS score",
          before: "42",
          after: "76",
          percentageChange: "+81%",
        },
        {
          label: "Time to deploy surveys",
          before: "Manual CSV upload",
          after: "Automatic via LOS",
          percentageChange: "-100%",
        },
      ],
      quote:
        "SocialSurvey made us upload CSVs for every survey batch. RepWell's LOS integration triggers surveys the moment loans close — we never touch it.",
      ctaHref: "/case-studies/inland-empire-home-loans",
    },
    {
      companyName: "Keystone Mortgage Group",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/keystone-logo.svg",
      metrics: [
        {
          label: "Google review rating",
          before: "4.2 stars",
          after: "4.8 stars",
          percentageChange: "+0.6 stars",
        },
        {
          label: "Testimonials collected per quarter",
          before: "3",
          after: "28",
          percentageChange: "+833%",
        },
        {
          label: "Annual platform cost",
          before: "$18,000/yr (SocialSurvey)",
          after: "$10,800/yr",
          percentageChange: "-40%",
        },
      ],
      quote:
        "We were paying SocialSurvey $18K/year for surveys alone. RepWell gives us surveys, reviews, testimonials, and AI analytics for 40% less.",
      ctaHref: "/case-studies/keystone-mortgage",
    },
    {
      companyName: "Sierra Vista Financial",
      industry: "Mortgage & Financial Services",
      logo: "/images/case-studies/sierra-vista-logo.svg",
      metrics: [
        {
          label: "Branches on platform",
          before: "8 (SocialSurvey)",
          after: "8 (single dashboard)",
          percentageChange: "Unified",
        },
        {
          label: "Social proof posts from reviews",
          before: "0/month",
          after: "15/month",
          percentageChange: "+15/mo",
        },
        {
          label: "Data migration time",
          before: "N/A",
          after: "4 business days",
        },
      ],
      quote:
        "SocialSurvey had no social publishing tools. RepWell turns our best reviews into branded social posts automatically. Our LinkedIn engagement tripled.",
      ctaHref: "/case-studies/sierra-vista-financial",
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
        question: "What happened to SocialSurvey?",
        answer:
          "SocialSurvey was acquired by Experience.com and is being sunset as a standalone product. Existing SocialSurvey customers are being migrated to Experience.com's platform or need to find an alternative. RepWell provides a dedicated migration path for former SocialSurvey customers.",
      },
      {
        question:
          "Do I have to migrate to Experience.com after the SocialSurvey shutdown?",
        answer:
          "No. You have the option to migrate to any platform. Experience.com will offer a migration path, but you are not obligated to follow it. RepWell provides a free migration for SocialSurvey customers that includes full data import and a dedicated migration specialist.",
      },
      {
        question: "Can I migrate my SocialSurvey data to RepWell?",
        answer:
          "Yes. We support full data import from SocialSurvey including survey responses, NPS data, contacts, and review history. Our migration team handles the import and maps your data into RepWell's structure. Most migrations complete in under a week.",
      },
      {
        question: "Will I lose my historical NPS data from SocialSurvey?",
        answer:
          "No. Export your data from SocialSurvey before the shutdown deadline, and our migration team will import your full NPS history into RepWell. You will retain continuity for trend analysis and reporting.",
      },
      {
        question: "How is RepWell different from SocialSurvey?",
        answer:
          "SocialSurvey was primarily a survey and NPS tool. RepWell is a complete customer experience platform that includes surveys, review aggregation (Google, Zillow), testimonial management, AI sentiment analysis, loan officer profiles with NMLS compliance, and LOS integrations. You get everything SocialSurvey offered — plus the review and testimonial features it lacked.",
      },
      {
        question: "Is RepWell more expensive than SocialSurvey was?",
        answer:
          "For most teams, RepWell costs less. SocialSurvey's enterprise pricing was typically $500-$1,500+/month depending on volume. RepWell starts at $29/user/month with transparent published pricing. Most former SocialSurvey customers see a 30-50% cost reduction while gaining additional features.",
      },
      {
        question: "What does RepWell have that SocialSurvey did not?",
        answer:
          "RepWell adds review aggregation (Google, Zillow, internal), loan officer profile pages with NMLS compliance, LOS integrations (Encompass, Byte, Calyx), testimonial collection and publishing, AI-powered sentiment analysis, team leaderboards and gamification, and social media publishing. SocialSurvey was limited to surveys and NPS tracking.",
      },
      {
        question:
          "How quickly can I migrate before the SocialSurvey deadline?",
        answer:
          "Our average SocialSurvey migration takes 5 business days from data export to go-live. We assign a dedicated migration specialist who handles the import, sets up integrations, creates LO profiles, and trains your team. Contact us to schedule your migration window.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  socialProof: [
    {
      quote:
        "When SocialSurvey announced the shutdown, RepWell was the obvious choice. Mortgage-native from top to bottom.",
      author: "Karen M.",
      role: "VP of Operations",
      company: "Pacific Crest Lending",
      rating: 5,
      platform: "G2",
      date: "2025-11-20",
    },
    {
      quote:
        "We migrated from SocialSurvey in under a week. The RepWell team handled everything — data import, LOS setup, team training.",
      author: "David N.",
      role: "Director of Marketing",
      company: "Inland Empire Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-15",
    },
    {
      quote:
        "SocialSurvey was good for surveys, but RepWell gives us surveys AND reviews AND testimonials in one platform.",
      author: "Lisa B.",
      role: "Branch Manager",
      company: "Keystone Mortgage Group",
      rating: 5,
      platform: "Capterra",
      date: "2025-12-01",
    },
    {
      quote:
        "The LO profiles alone make RepWell worth the switch from SocialSurvey. Our loan officers finally have their own review pages.",
      author: "Tony R.",
      role: "Sales Manager",
      company: "Sierra Vista Financial",
      rating: 5,
      platform: "G2",
      date: "2025-09-28",
    },
    {
      quote:
        "Experience.com wanted a 2-year contract. RepWell offered month-to-month with no commitment. That is how you earn trust after a vendor acquisition.",
      author: "Shannon P.",
      role: "COO",
      company: "Pinnacle Home Lending",
      rating: 5,
      platform: "Capterra",
      date: "2025-11-05",
    },
    {
      quote:
        "RepWell's AI sentiment analysis is miles ahead of anything SocialSurvey had. We catch issues before they become patterns.",
      author: "Marcus J.",
      role: "Regional Manager",
      company: "Evergreen Lending",
      rating: 5,
      platform: "G2",
      date: "2025-10-22",
    },
    {
      quote:
        "Our NPS data migrated perfectly. Full history preserved — no gaps in our trend analysis.",
      author: "Jennifer H.",
      role: "CX Director",
      company: "Commonwealth Mortgage",
      rating: 4,
      platform: "Capterra",
      date: "2025-12-10",
    },
    {
      quote:
        "SocialSurvey never had leaderboards. RepWell's gamification increased our review collection by 300% in the first month.",
      author: "Derek W.",
      role: "VP of Sales",
      company: "Patriot Home Lending",
      rating: 5,
      platform: "G2",
      date: "2025-08-30",
    },
    {
      quote:
        "Post-close surveys run automatically through our LOS now. With SocialSurvey we were manually uploading lists every week.",
      author: "Rachel T.",
      role: "Marketing Coordinator",
      company: "Horizon Home Loans",
      rating: 4,
      platform: "G2",
      date: "2025-11-18",
    },
    {
      quote:
        "The transparent pricing was refreshing. SocialSurvey made us negotiate on every renewal.",
      author: "Paul D.",
      role: "CFO",
      company: "Mountain West Financial",
      rating: 5,
      platform: "Capterra",
      date: "2025-09-12",
    },
    {
      quote:
        "Best migration experience I have had with any SaaS. RepWell assigned a specialist who knew mortgage inside out.",
      author: "Angela F.",
      role: "Operations Lead",
      company: "Gateway Mortgage Group",
      rating: 5,
      platform: "G2",
      date: "2025-10-08",
    },
    {
      quote:
        "We went from SocialSurvey's survey-only tool to a complete customer experience platform. No regrets.",
      author: "Brian C.",
      role: "CEO",
      company: "Trident Financial Group",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-11-25",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 16: Footer CTA
  // ---------------------------------------------------------------------------
  footerCta: {
    headline: "SocialSurvey is sunsetting. Secure your review program now.",
    subhead:
      "Join hundreds of mortgage companies that moved from SocialSurvey to RepWell — gaining mortgage-native features and transparent pricing with zero migration downtime.",
    primaryCta: { label: "Start Your Free Trial", href: "/signup" },
    secondaryCta: { label: "Schedule Migration Call", href: "/demo" },
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
        { name: "Google review monitoring", repwell: true, competitor: false },
        { name: "Zillow review integration", repwell: true, competitor: false },
        {
          name: "Automated review requests",
          repwell: true,
          competitor: "Limited",
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
        { name: "Review widget for website", repwell: true, competitor: false },
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
        {
          name: "Sentiment analysis",
          repwell: "Included",
          competitor: "Basic",
        },
        {
          name: "Key phrase extraction",
          repwell: true,
          competitor: false,
        },
        { name: "Predictive NPS trending", repwell: true, competitor: false },
        { name: "Branch benchmarking", repwell: true, competitor: "Basic" },
        { name: "AI executive summaries", repwell: true, competitor: false },
        {
          name: "Compliance-safe AI responses",
          repwell: true,
          competitor: false,
        },
        { name: "Custom report builder", repwell: true, competitor: "Limited" },
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
          competitor: false,
        },
        {
          name: "Per-user pricing (not per-location)",
          repwell: true,
          competitor: false,
        },
        { name: "Month-to-month billing", repwell: true, competitor: false },
        {
          name: "Phone support",
          repwell: true,
          competitor: "Enterprise only",
        },
        { name: "Live chat support", repwell: true, competitor: "Limited" },
        { name: "Onboarding under 1 week", repwell: true, competitor: false },
        { name: "API access", repwell: true, competitor: true },
        { name: "99.9% uptime SLA", repwell: true, competitor: "Unknown" },
      ],
    },
  ],
};
