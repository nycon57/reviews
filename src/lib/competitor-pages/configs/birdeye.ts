import type { CompetitorPageConfig } from "../types";

/**
 * Complete competitor page configuration for Birdeye.
 *
 * Positioning: Birdeye = general-purpose review platform that serves restaurants,
 * healthcare, auto dealers, etc. — not built for mortgage. RepWell = mortgage-native
 * with LO profiles, NMLS compliance, LOS integrations, and post-close automation.
 *
 * Competitor data last verified: 2026-02-01
 * Sources: Birdeye pricing page, G2 product page, Capterra listing, Birdeye docs.
 * Review cadence: Quarterly — next review due 2026-05-01.
 */
export const birdeyeConfig: CompetitorPageConfig = {
  slug: "birdeye",
  competitorName: "Birdeye",
  competitorLogo: "/images/competitors/birdeye-logo.svg",

  // ---------------------------------------------------------------------------
  // SEO
  // ---------------------------------------------------------------------------
  seo: {
    title: "Birdeye Alternative for Mortgage | RepWell vs Birdeye",
    description:
      "Looking for a Birdeye alternative built for mortgage? RepWell offers loan officer profiles, NMLS compliance, LOS integrations, and post-close automation that generic platforms can't match.",
    keywords: [
      "Birdeye alternative",
      "Birdeye competitor",
      "Birdeye vs RepWell",
      "Birdeye replacement",
      "Birdeye alternative mortgage",
      "mortgage review management",
      "loan officer review platform",
      "NPS survey tool mortgage",
      "birdeye pricing",
      "birdeye reviews",
    ],
    ogImage: "/images/og/birdeye-vs-repwell.png",
    twitterCard: "summary_large_image",
  },

  // ---------------------------------------------------------------------------
  // Section 1: Hero
  // ---------------------------------------------------------------------------
  hero: {
    badge: "#1 Birdeye Alternative for Mortgage",
    h1: "Birdeye vs RepWell",
    subhead:
      "Birdeye works for restaurants and dentists. RepWell is built for mortgage. Get loan officer profiles, NMLS compliance, LOS integrations, and post-close automation — features a generic platform will never prioritize.",
    primaryCta: { label: "Start Free Trial", href: "/signup" },
    secondaryCta: { label: "See Pricing", href: "/pricing" },
    stat: {
      value: "50%",
      label: "avg. cost savings vs. per-location pricing models",
    },
  },

  // ---------------------------------------------------------------------------
  // Section 2: Logo Bar
  // ---------------------------------------------------------------------------
  logoBar: [
    { name: "Fairway Independent", logoUrl: "/images/logos/fairway.svg" },
    { name: "Movement Mortgage", logoUrl: "/images/logos/movement.svg" },
    { name: "Guild Mortgage", logoUrl: "/images/logos/guild.svg" },
    { name: "CrossCountry Mortgage", logoUrl: "/images/logos/crosscountry.svg" },
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
      headline: "Mortgage-focused features at every price point",
      body: "Birdeye's starter plans serve every industry equally — meaning none well. RepWell includes mortgage essentials like LO profiles and post-close surveys from day one.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$29/mo",
          competitor: "$299+/mo (per location)",
        },
        {
          feature: "Loan officer profiles",
          repwell: true,
          competitor: false,
        },
        {
          feature: "NMLS number display",
          repwell: true,
          competitor: false,
        },
        { feature: "Review request automation", repwell: true, competitor: true },
        { feature: "Google review integration", repwell: true, competitor: true },
        { feature: "NPS surveys", repwell: true, competitor: "Add-on" },
        { feature: "Post-close survey triggers", repwell: true, competitor: false },
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
      headline: "Industry-specific tools, not one-size-fits-all",
      body: "Birdeye charges premium prices for generic features. RepWell's Professional tier includes AI sentiment analysis, testimonial management, and leaderboards — built around the mortgage workflow.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$59/mo",
          competitor: "$399+/mo (per location)",
        },
        { feature: "AI sentiment analysis", repwell: true, competitor: "Add-on" },
        {
          feature: "Testimonial management",
          repwell: true,
          competitor: "Limited",
        },
        { feature: "Loan officer leaderboards", repwell: true, competitor: false },
        {
          feature: "Social media publishing",
          repwell: true,
          competitor: true,
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
          competitor: "Email + chat",
        },
      ],
      ctaLabel: "Start Free Trial",
    },
    {
      tabLabel: "Enterprise",
      headline: "Enterprise mortgage tools at a fair price",
      body: "Birdeye charges per location, which adds up fast for multi-branch lenders. RepWell delivers enterprise mortgage features — multi-branch management, compliance tools, and regional benchmarking — without the per-location markup.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$99/mo",
          competitor: "Custom quote (per location)",
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
    body: "Birdeye makes it easy to export your data. We make it even easier to get running on a platform purpose-built for mortgage.",
    bullets: [
      { text: "Google and Zillow reviews stay on your Business Profile" },
      { text: "Birdeye CSV exports import directly into RepWell" },
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
        "We used Birdeye for two years and it was fine for collecting Google reviews. But it had **zero mortgage features** — no LO profiles, no NMLS compliance, no post-close triggers. RepWell gave us everything we were missing.",
      author: "Chris Bergman",
      role: "VP of Marketing",
      company: "Ridgeline Home Loans",
      rating: 5,
      competitorMention: "Birdeye",
    },
    {
      quote:
        "Birdeye treated us the same as the pizza shop down the street. RepWell understands mortgage — the compliance requirements, the loan officer workflows, the LOS integrations. It's a **night-and-day difference**.",
      author: "Natalie Park",
      role: "Branch Manager",
      company: "Cornerstone Lending Group",
      rating: 5,
      competitorMention: "Birdeye",
    },
    {
      quote:
        "Switching from Birdeye to RepWell cut our monthly cost and gave us features we didn't even know we needed. The **leaderboard alone** increased our review volume by 200%.",
      author: "Jason Torres",
      role: "Director of Sales",
      company: "Beacon Mortgage Partners",
      rating: 5,
      competitorMention: "Birdeye",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 6: Differentiators
  // ---------------------------------------------------------------------------
  differentiators: [
    {
      icon: "Home",
      title: "Mortgage-native, not mortgage-adapted",
      description:
        "Birdeye serves 50+ industries with the same toolset. RepWell is built from the ground up for mortgage and financial services — every feature fits how your team actually works.",
      repwellValue:
        "Purpose-built for mortgage: LO profiles, NMLS compliance, post-close automation",
      competitorValue:
        "Generic platform: same features for dentists, restaurants, and auto dealers",
    },
    {
      icon: "Link",
      title: "Deep LOS and CRM integrations",
      description:
        "RepWell connects directly to Encompass, Byte, Calyx, and your CRM to trigger reviews and surveys at the right moment in the loan lifecycle.",
      repwellValue:
        "Native integrations with Encompass, Byte, Calyx, LendingPad, Salesforce, HubSpot",
      competitorValue: "Generic integrations via Zapier or API — no LOS-specific connectors",
    },
    {
      icon: "ShieldCheck",
      title: "Compliance built in, not bolted on",
      description:
        "NMLS numbers on every profile, mortgage-compliant AI response suggestions, and advertising guideline checks — all standard, no custom configuration needed.",
      repwellValue: "NMLS display, compliant AI responses, mortgage ad guideline checks included",
      competitorValue: "No mortgage compliance features — manual compliance review required",
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
        "Every LO gets a branded, NMLS-compliant profile with reviews, ratings, and a contact form — something Birdeye's generic business listings can't replicate.",
    },
    {
      screenshot: "/images/features/review-dashboard.webp",
      title: "Mortgage review dashboard",
      description:
        "See Google, Zillow, and internal reviews in one place. Filter by loan officer, branch, or loan type — not just by location like Birdeye.",
    },
    {
      screenshot: "/images/features/survey-builder.webp",
      title: "Post-close survey automation",
      description:
        "Trigger NPS and CSAT surveys automatically when a loan closes. Integrated with your LOS so timing is precise — no manual list uploads.",
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
        "Motivate your team with real-time leaderboards, achievement badges, and review collection contests. Birdeye has no equivalent for individual performers.",
    },
    {
      screenshot: "/images/features/testimonial-manager.webp",
      title: "Testimonial collection and publishing",
      description:
        "Collect written and video testimonials from borrowers, get approval, and publish to your site and social channels — all from one workflow.",
    },
    {
      screenshot: "/images/features/social-publishing.webp",
      title: "Branded social publishing",
      description:
        "Turn reviews into branded social posts and push to LinkedIn, Facebook, and Instagram. Birdeye offers social but without mortgage-specific branding.",
    },
    {
      screenshot: "/images/features/gbp-optimization.webp",
      title: "Google Business Profile management",
      description:
        "Monitor your GBP listings, respond to reviews, and track local search signals. Manage all branch locations from a single dashboard.",
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
        "Generic sentiment tools miss industry context. RepWell's AI understands mortgage-specific language — rate lock complaints, closing delay frustrations, LO praise — and categorizes feedback accurately.",
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
        "Generic AI tools lack mortgage compliance context. RepWell generates response suggestions that follow TILA, RESPA, and mortgage advertising regulations — no compliance review bottleneck.",
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
    { name: "Encompass", logoUrl: "/images/integrations/encompass.svg", category: "LOS" },
    { name: "Byte", logoUrl: "/images/integrations/byte.svg", category: "LOS" },
    { name: "Calyx", logoUrl: "/images/integrations/calyx.svg", category: "LOS" },
    { name: "LendingPad", logoUrl: "/images/integrations/lendingpad.svg", category: "LOS" },
    { name: "Salesforce", logoUrl: "/images/integrations/salesforce.svg", category: "CRM" },
    { name: "HubSpot", logoUrl: "/images/integrations/hubspot.svg", category: "CRM" },
    { name: "Velocify", logoUrl: "/images/integrations/velocify.svg", category: "CRM" },
    { name: "BNTouch", logoUrl: "/images/integrations/bntouch.svg", category: "CRM" },
    {
      name: "Google Business",
      logoUrl: "/images/integrations/google-business.svg",
      category: "Reviews",
    },
    { name: "Zillow", logoUrl: "/images/integrations/zillow.svg", category: "Reviews" },
    { name: "Facebook", logoUrl: "/images/integrations/facebook.svg", category: "Social" },
    { name: "LinkedIn", logoUrl: "/images/integrations/linkedin.svg", category: "Social" },
    { name: "Slack", logoUrl: "/images/integrations/slack.svg", category: "Communication" },
    {
      name: "Microsoft Teams",
      logoUrl: "/images/integrations/teams.svg",
      category: "Communication",
    },
    { name: "Zapier", logoUrl: "/images/integrations/zapier.svg", category: "Automation" },
  ],

  // ---------------------------------------------------------------------------
  // Section 10: Mortgage-Specific Features
  // ---------------------------------------------------------------------------
  mortgageFeatures: [
    {
      icon: "UserCircle",
      title: "Loan officer profiles with NMLS display",
      description:
        "Each LO gets a compliant profile page with their NMLS number, reviews, credentials, and contact form. Birdeye only offers generic business listings.",
      repwellExclusive: true,
    },
    {
      icon: "ChartBar",
      title: "Post-close survey automation",
      description:
        "Surveys trigger automatically from your LOS when a loan closes. No manual list uploads, no missed follow-ups.",
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
        "Compare NPS, review volume, and sentiment across branches. Birdeye benchmarks by location — not by the metrics mortgage leaders care about.",
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
        "Run review collection contests with real-time leaderboards. Birdeye has no individual performer tracking — only location-level metrics.",
      repwellExclusive: true,
    },
  ],
  mortgageSectionConfig: {
    headline: "Built for mortgage — not adapted from a generic platform",
    description:
      "Birdeye serves dozens of industries with the same tools. RepWell is purpose-built for mortgage, so nothing is bolted on and nothing is missing.",
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
        title: "Export your Birdeye data",
        description:
          "Birdeye supports CSV exports for reviews, contacts, and survey data. We'll walk you through pulling everything you need.",
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
          "Integrate Encompass, Byte, Salesforce, or your CRM. Most connections go live same-day with our guided setup.",
      },
      {
        number: 4,
        title: "Train your team",
        description:
          "Live training for admins, managers, and loan officers. Plus on-demand video tutorials and a searchable knowledge base.",
      },
      {
        number: 5,
        title: "Go live with mortgage-native tools",
        description:
          "Your migration specialist stays on for 30 days post-launch to handle any issues and optimize your setup.",
      },
    ],
    contractBuyoutNote:
      "In a Birdeye contract? Ask about our contract buyout program for qualifying teams.",
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
      g2Score: 4.7,
      g2ReviewCount: 720,
      capterra: 4.5,
      trustpilot: 4.1,
    },
  },

  // ---------------------------------------------------------------------------
  // Section 13: Case Studies
  // ---------------------------------------------------------------------------
  caseStudies: [
    {
      companyName: "Ridgeline Home Loans",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/ridgeline-logo.svg",
      metrics: [
        {
          label: "Monthly review volume",
          before: "22",
          after: "87",
          percentageChange: "+295%",
        },
        {
          label: "LO adoption rate",
          before: "28%",
          after: "91%",
          percentageChange: "+225%",
        },
        {
          label: "Monthly platform cost",
          before: "$3,600",
          after: "$1,770",
          percentageChange: "-51%",
        },
      ],
      quote:
        "Birdeye was a decent review tool, but it had nothing for our loan officers. RepWell gave every LO their own profile and reviews — adoption went through the roof.",
      ctaHref: "/case-studies/ridgeline-home-loans",
    },
    {
      companyName: "Cornerstone Lending Group",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/cornerstone-logo.svg",
      metrics: [
        {
          label: "Post-close survey response rate",
          before: "12%",
          after: "44%",
          percentageChange: "+267%",
        },
        {
          label: "Average NPS score",
          before: "38",
          after: "72",
          percentageChange: "+89%",
        },
        {
          label: "Time to set up surveys",
          before: "2+ hours/batch",
          after: "Automatic",
          percentageChange: "-100%",
        },
      ],
      quote:
        "With Birdeye, we were manually uploading CSV lists for every survey batch. RepWell's LOS integration triggers surveys automatically when loans close — we never miss one now.",
      ctaHref: "/case-studies/cornerstone-lending",
    },
    {
      companyName: "Beacon Mortgage Partners",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/beacon-logo.svg",
      metrics: [
        {
          label: "Google review rating",
          before: "4.1 stars",
          after: "4.8 stars",
          percentageChange: "+0.7 stars",
        },
        {
          label: "Review response rate",
          before: "30%",
          after: "96%",
          percentageChange: "+220%",
        },
        {
          label: "Testimonials collected per quarter",
          before: "5",
          after: "32",
          percentageChange: "+540%",
        },
      ],
      quote:
        "The AI response suggestions are compliant out of the box. With Birdeye, our compliance team had to review every response manually — it was a bottleneck that killed our response rate.",
      ctaHref: "/case-studies/beacon-mortgage",
    },
    {
      companyName: "Summit Point Financial",
      industry: "Mortgage & Wealth Management",
      logo: "/images/case-studies/summit-point-logo.svg",
      metrics: [
        {
          label: "Branches managed",
          before: "12 (separate logins)",
          after: "12 (single dashboard)",
          percentageChange: "Unified",
        },
        {
          label: "Social media posts from reviews",
          before: "2/month",
          after: "18/month",
          percentageChange: "+800%",
        },
        {
          label: "Annual platform savings",
          before: "$58,000/yr",
          after: "$24,000/yr",
          percentageChange: "-59%",
        },
      ],
      quote:
        "Birdeye charged us per location, which got expensive fast with 12 branches. RepWell's per-user pricing and unified dashboard saved us over $30K a year.",
      ctaHref: "/case-studies/summit-point-financial",
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
        question: "How is RepWell different from Birdeye?",
        answer:
          "Birdeye is a general-purpose review platform that serves restaurants, healthcare, auto dealers, and dozens of other industries. RepWell is purpose-built for mortgage and financial services. Key differences: loan officer profiles with NMLS compliance (vs. generic business listings), LOS integrations like Encompass (vs. no mortgage integrations), post-close survey automation (vs. manual CSV uploads), and per-user pricing (vs. per-location pricing that scales poorly for multi-branch mortgage companies).",
      },
      {
        question: "Can I migrate my data from Birdeye?",
        answer:
          "Yes. Birdeye supports CSV data exports. Our migration team imports your reviews, contacts, survey templates, and historical data into RepWell. We also create loan officer profiles — something Birdeye doesn't offer — and populate them with existing review history. Most migrations complete within 1-2 weeks.",
      },
      {
        question: "Why would a mortgage company switch from Birdeye?",
        answer:
          "Birdeye lacks mortgage-specific features: no LO profiles, no NMLS compliance, no LOS integrations, no post-close survey triggers, and no loan officer leaderboards. Mortgage companies using Birdeye are paying for a generic tool and building workarounds for industry-specific needs. RepWell eliminates those workarounds with purpose-built features.",
      },
      {
        question: "Is Birdeye's per-location pricing expensive for mortgage companies?",
        answer:
          "It can be. Birdeye charges per location, which adds up fast for multi-branch mortgage companies. A 15-branch operation could easily spend $4,500+/month. RepWell uses per-user pricing starting at $29/user/month, which typically costs 40-60% less for mortgage teams of the same size.",
      },
      {
        question: "Will I lose my Google reviews if I switch from Birdeye?",
        answer:
          "No. Your Google reviews belong to your Google Business Profile, not to Birdeye. They stay exactly where they are. RepWell connects to your existing GBP listing and picks up right where you left off.",
      },
      {
        question: "Does Birdeye have loan officer profiles?",
        answer:
          "No. Birdeye is built around business locations, not individual professionals. RepWell gives every loan officer a branded, NMLS-compliant profile page with their reviews, ratings, credentials, and a direct contact form — one of the most-requested features among mortgage teams we talk to.",
      },
      {
        question: "Can Birdeye connect to Encompass or other LOS platforms?",
        answer:
          "Birdeye does not offer native LOS integrations. You would need to build a custom integration via their API or use Zapier. RepWell integrates natively with Encompass, Byte, Calyx, and LendingPad to trigger surveys and review requests automatically when loans close.",
      },
      {
        question: "How does RepWell handle compliance for mortgage companies?",
        answer:
          "Every feature is built with mortgage compliance in mind. LO profiles display NMLS numbers, AI response suggestions follow mortgage advertising guidelines, and survey tools include compliant question templates. Birdeye has no mortgage-specific compliance features — your team would need to manually review everything.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  socialProof: [
    {
      quote:
        "RepWell is the review platform we always wanted. Mortgage-specific from top to bottom.",
      author: "James T.",
      role: "VP of Production",
      company: "Meridian Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-11-14",
    },
    {
      quote:
        "We switched from Birdeye and immediately saw the difference. LO profiles, post-close triggers, compliance tools — it's all built in.",
      author: "Andrea M.",
      role: "Marketing Director",
      company: "Ridgeline Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-22",
    },
    {
      quote:
        "The AI sentiment analysis catches issues before they become patterns. Worth every penny for a mortgage operation our size.",
      author: "Robert K.",
      role: "Regional Manager",
      company: "Evergreen Lending",
      rating: 5,
      platform: "Capterra",
      date: "2025-12-03",
    },
    {
      quote:
        "Birdeye had us lumped in with dentists and restaurants. RepWell actually understands our industry.",
      author: "Amanda S.",
      role: "Operations Manager",
      company: "Liberty Home Funding",
      rating: 4,
      platform: "G2",
      date: "2025-09-18",
    },
    {
      quote:
        "Our loan officers have their own profile pages now. That alone was worth the switch from Birdeye.",
      author: "Michael D.",
      role: "Branch Manager",
      company: "Coastal Mortgage Services",
      rating: 5,
      platform: "Capterra",
      date: "2025-11-29",
    },
    {
      quote:
        "Per-user pricing saved us a fortune. Birdeye's per-location model was bleeding us dry with 8 branches.",
      author: "Jennifer W.",
      role: "CTO",
      company: "Apex Lending Group",
      rating: 5,
      platform: "G2",
      date: "2025-08-15",
    },
    {
      quote:
        "The leaderboard feature turned review collection into a friendly competition. Our LOs actually care about reviews now.",
      author: "Carlos M.",
      role: "Sales Manager",
      company: "Premier Mortgage Partners",
      rating: 4,
      platform: "Capterra",
      date: "2025-10-05",
    },
    {
      quote:
        "Post-close surveys run automatically. No more spreadsheet uploads like we had with Birdeye.",
      author: "Stephanie L.",
      role: "Marketing Coordinator",
      company: "Horizon Home Loans",
      rating: 4,
      platform: "G2",
      date: "2025-12-11",
    },
    {
      quote:
        "Best customer support I've experienced with any SaaS tool. They actually pick up the phone.",
      author: "Tom B.",
      role: "IT Director",
      company: "National Mortgage Alliance",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-07-28",
    },
    {
      quote:
        "We were spending $4k/month on Birdeye for 10 locations. RepWell costs half that and does twice as much for mortgage.",
      author: "Patricia H.",
      role: "CFO",
      company: "Mountain West Financial",
      rating: 5,
      platform: "G2",
      date: "2025-11-01",
    },
    {
      quote:
        "The NMLS-compliant LO profiles are exactly what our compliance team wanted. Birdeye couldn't do this.",
      author: "Kevin O.",
      role: "Compliance Manager",
      company: "First Choice Lending",
      rating: 4,
      platform: "Capterra",
      date: "2025-09-22",
    },
    {
      quote:
        "RepWell's NPS tracking helped us spot a training gap. Our company-wide score jumped 15 points in one quarter.",
      author: "Diana F.",
      role: "Training Director",
      company: "Vanguard Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-30",
    },
    {
      quote:
        "Migration from Birdeye was painless. The RepWell team handled the CSV import and had us running in days.",
      author: "Brian N.",
      role: "Operations Lead",
      company: "Gateway Mortgage Group",
      rating: 5,
      platform: "Capterra",
      date: "2025-08-09",
    },
    {
      quote:
        "The AI-generated review responses save our team 10+ hours per week. And they're mortgage-compliant out of the box.",
      author: "Rachel G.",
      role: "Customer Experience Manager",
      company: "Sunbelt Lending",
      rating: 5,
      platform: "G2",
      date: "2025-12-19",
    },
    {
      quote:
        "I evaluated Birdeye, Podium, and three others before choosing RepWell. Nothing else comes close for mortgage.",
      author: "Mark J.",
      role: "CEO",
      company: "Trident Financial Group",
      rating: 5,
      platform: "Trustpilot",
      date: "2025-11-07",
    },
    {
      quote:
        "RepWell made compliance easy. NMLS numbers on every profile, compliant review responses — it's all built in.",
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
    headline: "Ready to upgrade from generic to mortgage-native?",
    subhead:
      "Join hundreds of mortgage companies that switched from general review platforms to RepWell — for mortgage features generic tools don't offer.",
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
        { name: "Loan officer profiles", repwell: true, competitor: false },
        { name: "NMLS number display", repwell: true, competitor: false },
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
