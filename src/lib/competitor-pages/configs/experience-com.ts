import type { CompetitorPageConfig } from "../types";

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
  competitorLogo: "/images/competitors/experience-com-logo.svg",

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
    ogImage: "/images/og/experience-com-vs-repwell.png",
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
    stat: { value: "60%", label: "avg. cost savings reported by switchers" },
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
      headline: "Get started without the enterprise price tag",
      body: "Experience.com requires custom quotes and annual contracts. RepWell starts at a flat monthly rate with no surprises.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$29/mo",
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
      tabLabel: "Professional",
      headline: "Everything a growing team needs",
      body: "Experience.com charges extra for features RepWell includes at every tier — AI insights, testimonial management, and loan officer profiles.",
      comparisonRows: [
        {
          feature: "Monthly price per user",
          repwell: "$59/mo",
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
          repwell: "$99/mo",
          competitor: "$150+/mo (estimated)",
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
  testimonials: [
    {
      quote:
        "We were paying **three times more** with Experience.com and getting half the support. RepWell's team had us fully migrated in four days — our loan officers didn't miss a single review request.",
      author: "Sarah Mitchell",
      role: "VP of Marketing",
      company: "Summit Home Loans",
      rating: 5,
      competitorMention: "Experience.com",
    },
    {
      quote:
        "Experience.com's platform felt like it was built for Fortune 500 companies, not a 40-person mortgage shop. RepWell gives us **enterprise features** without the enterprise complexity or price tag.",
      author: "David Chen",
      role: "Branch Manager",
      company: "Pacific Coast Lending",
      rating: 5,
      competitorMention: "Experience.com",
    },
    {
      quote:
        "After two years of fighting Experience.com's clunky interface and waiting days for support tickets, switching to RepWell felt like a breath of fresh air. Our **review volume doubled** in the first quarter.",
      author: "Maria Gonzalez",
      role: "Director of Operations",
      company: "Heritage Mortgage Group",
      rating: 5,
      competitorMention: "Experience.com",
    },
  ],

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
  featureCards: [
    {
      screenshot: "/images/features/review-dashboard.webp",
      title: "Unified review dashboard",
      description:
        "See Google, Zillow, and internal reviews in one place. Filter by loan officer, branch, or time period — no tab switching required.",
    },
    {
      screenshot: "/images/features/ai-sentiment.webp",
      title: "AI-powered sentiment analysis",
      description:
        "Automatically detect themes, sentiment shifts, and at-risk accounts. Get actionable insights instead of raw data dumps.",
      badge: "AI-Powered",
    },
    {
      screenshot: "/images/features/lo-profiles.webp",
      title: "Loan officer profile pages",
      description:
        "Each LO gets a branded profile with reviews, ratings, and a direct contact form — built for mortgage, not adapted from a generic template.",
    },
    {
      screenshot: "/images/features/survey-builder.webp",
      title: "Drag-and-drop survey builder",
      description:
        "Create NPS, CSAT, and post-close surveys in minutes. Conditional logic, branching, and automated triggers included at every tier.",
    },
    {
      screenshot: "/images/features/testimonial-manager.webp",
      title: "Testimonial collection and publishing",
      description:
        "Capture video and written testimonials, get approval, and publish to your website and social channels — all from one workflow.",
    },
    {
      screenshot: "/images/features/leaderboard.webp",
      title: "Team leaderboards and gamification",
      description:
        "Motivate loan officers with real-time leaderboards, achievement badges, and performance contests that drive review volume.",
    },
    {
      screenshot: "/images/features/social-publishing.webp",
      title: "One-click social publishing",
      description:
        "Turn your best reviews into branded social posts and push them to LinkedIn, Facebook, and Instagram without leaving the platform.",
    },
    {
      screenshot: "/images/features/gbp-optimization.webp",
      title: "Google Business Profile optimization",
      description:
        "Manage your GBP listings, monitor ranking signals, and respond to reviews directly. Stay visible in local search results.",
    },
  ],

  // ---------------------------------------------------------------------------
  // Section 8: AI Capabilities
  // ---------------------------------------------------------------------------
  aiCapabilities: [
    {
      tabLabel: "Sentiment Analysis",
      headline: "Understand what borrowers really think",
      description:
        "RepWell's AI reads every review and survey response, extracting sentiment, key themes, and emerging patterns — so you can act before small issues become big problems.",
      features: [
        "Real-time sentiment scoring on every response",
        "Automatic theme detection across all feedback channels",
        "Trend alerts when sentiment dips below your threshold",
        "Per-LO and per-branch sentiment breakdowns",
      ],
      illustration: "/images/ai/sentiment-analysis.webp",
    },
    {
      tabLabel: "Smart Responses",
      headline: "Respond to reviews in seconds, not hours",
      description:
        "AI-generated response suggestions match the tone and context of each review. Your team approves and personalizes — never robotic, always on-brand.",
      features: [
        "Context-aware response drafts for positive and negative reviews",
        "Customizable tone presets (professional, warm, apologetic)",
        "One-click approve and post to Google or Zillow",
        "Compliance-safe language tailored for mortgage industry",
      ],
      illustration: "/images/ai/smart-responses.webp",
    },
    {
      tabLabel: "Predictive Insights",
      headline: "See problems before they surface",
      description:
        "RepWell's predictive engine identifies at-risk borrowers, underperforming branches, and emerging trends — giving leadership time to intervene.",
      features: [
        "Early warning system for declining NPS trends",
        "Borrower churn risk scoring based on survey patterns",
        "Competitive benchmark tracking against local market",
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
    { name: "Google Business", logoUrl: "/images/integrations/google-business.svg", category: "Reviews" },
    { name: "Zillow", logoUrl: "/images/integrations/zillow.svg", category: "Reviews" },
    { name: "Facebook", logoUrl: "/images/integrations/facebook.svg", category: "Social" },
    { name: "LinkedIn", logoUrl: "/images/integrations/linkedin.svg", category: "Social" },
    { name: "Slack", logoUrl: "/images/integrations/slack.svg", category: "Communication" },
    { name: "Microsoft Teams", logoUrl: "/images/integrations/teams.svg", category: "Communication" },
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
        "Each LO gets a compliant profile page showing their NMLS number, reviews, and credentials — meeting regulatory requirements out of the box.",
      repwellExclusive: true,
    },
    {
      icon: "ChartBar",
      title: "Post-close survey automation",
      description:
        "Trigger NPS and satisfaction surveys at the right moment in the loan lifecycle. Integrated with your LOS so timing is automatic.",
      repwellExclusive: true,
    },
    {
      icon: "ShieldCheck",
      title: "Compliance-ready review responses",
      description:
        "AI-generated responses follow mortgage advertising guidelines. Flag risky language before it goes public.",
    },
    {
      icon: "TrendUp",
      title: "Branch and regional benchmarking",
      description:
        "Compare review volume, NPS, and sentiment across branches. Identify top performers and teams that need coaching.",
    },
    {
      icon: "Buildings",
      title: "Multi-branch management",
      description:
        "Manage hundreds of locations from a single dashboard. Roll-up reporting for regional managers and executives.",
    },
    {
      icon: "Medal",
      title: "LO gamification and contests",
      description:
        "Run review collection contests with real-time leaderboards. Motivate loan officers with recognition and healthy competition.",
      repwellExclusive: true,
    },
  ],
  mortgageSectionConfig: {
    headline: "Built for mortgage — not adapted from a generic platform",
    description:
      "Experience.com serves dozens of industries. RepWell is purpose-built for mortgage and financial services, so every feature fits how your team actually works.",
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
  ratingComparison: {
    repwell: {
      g2Score: 4.8,
      g2ReviewCount: 127,
      capterra: 4.9,
      trustpilot: 4.7,
    },
    competitor: {
      g2Score: 4.3,
      g2ReviewCount: 312,
      capterra: 4.1,
      trustpilot: 3.8,
    },
  },

  // ---------------------------------------------------------------------------
  // Section 13: Case Studies
  // ---------------------------------------------------------------------------
  caseStudies: [
    {
      companyName: "Summit Home Loans",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/summit-logo.svg",
      metrics: [
        {
          label: "Monthly review volume",
          before: "18",
          after: "94",
          percentageChange: "+422%",
        },
        {
          label: "Average NPS score",
          before: "42",
          after: "71",
          percentageChange: "+69%",
        },
        {
          label: "Monthly platform cost",
          before: "$4,200",
          after: "$1,770",
          percentageChange: "-58%",
        },
      ],
      quote:
        "We cut our costs by more than half and our review volume went through the roof. The ROI was obvious within the first month.",
      ctaHref: "/case-studies/summit-home-loans",
    },
    {
      companyName: "Pacific Coast Lending",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/pacific-coast-logo.svg",
      metrics: [
        {
          label: "Onboarding time",
          before: "6 weeks",
          after: "4 days",
          percentageChange: "-90%",
        },
        {
          label: "LO adoption rate",
          before: "35%",
          after: "92%",
          percentageChange: "+163%",
        },
        {
          label: "Avg. support response time",
          before: "3-5 days",
          after: "< 2 hours",
          percentageChange: "-95%",
        },
      ],
      quote:
        "Our loan officers actually use the platform now. With Experience.com, only a third of the team bothered — the interface was too complicated.",
      ctaHref: "/case-studies/pacific-coast-lending",
    },
    {
      companyName: "Heritage Mortgage Group",
      industry: "Residential Mortgage",
      logo: "/images/case-studies/heritage-logo.svg",
      metrics: [
        {
          label: "Google review rating",
          before: "3.9 stars",
          after: "4.7 stars",
          percentageChange: "+0.8 stars",
        },
        {
          label: "Review response rate",
          before: "22%",
          after: "97%",
          percentageChange: "+341%",
        },
        {
          label: "Time to respond to reviews",
          before: "48+ hours",
          after: "< 2 hours",
          percentageChange: "-96%",
        },
      ],
      quote:
        "RepWell's AI response suggestions changed the game. We went from ignoring most reviews to responding to nearly every one — and our Google rating shows it.",
      ctaHref: "/case-studies/heritage-mortgage-group",
    },
    {
      companyName: "Pinnacle Financial Partners",
      industry: "Mortgage & Wealth Management",
      logo: "/images/case-studies/pinnacle-logo.svg",
      metrics: [
        {
          label: "Testimonials collected",
          before: "3/quarter",
          after: "28/quarter",
          percentageChange: "+833%",
        },
        {
          label: "Social media engagement",
          before: "Low",
          after: "3x increase",
          percentageChange: "+200%",
        },
        {
          label: "Annual platform savings",
          before: "$72,000/yr",
          after: "$28,800/yr",
          percentageChange: "-60%",
        },
      ],
      quote:
        "The testimonial workflow alone justified the switch. We went from begging borrowers for quotes to collecting them automatically at close.",
      ctaHref: "/case-studies/pinnacle-financial",
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
          "Every feature is built with mortgage compliance in mind. LO profiles display NMLS numbers, AI response suggestions follow mortgage advertising guidelines, and our survey tools include compliant question templates. Experience.com requires custom configuration to meet these requirements.",
      },
      {
        question:
          "What if my team found Experience.com too complicated — is RepWell easier?",
        answer:
          "Simplicity is a core design principle. RepWell's interface is built so loan officers can request reviews, view their stats, and respond to feedback without training. Our customers report an average LO adoption rate of over 85%, compared to approximately 40% for enterprise platforms based on industry surveys.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Section 15: Social Proof
  // ---------------------------------------------------------------------------
  socialProof: [
    {
      quote:
        "RepWell is the best review management tool we've used in the mortgage space. Simple, effective, and the support is outstanding.",
      author: "James T.",
      role: "VP of Production",
      company: "Meridian Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-11-14",
    },
    {
      quote:
        "Switched from Experience.com and never looked back. Half the price, twice the features we actually use.",
      author: "Lisa R.",
      role: "Marketing Director",
      company: "Capitol Mortgage Corp",
      rating: 5,
      platform: "G2",
      date: "2025-10-22",
    },
    {
      quote:
        "The AI sentiment analysis caught a service issue at one of our branches before it became a pattern. Worth every penny.",
      author: "Robert K.",
      role: "Regional Manager",
      company: "Evergreen Lending",
      rating: 5,
      platform: "Capterra",
      date: "2025-12-03",
    },
    {
      quote:
        "Finally, a platform that understands mortgage. No more trying to force-fit a generic review tool into our workflow.",
      author: "Amanda S.",
      role: "Operations Manager",
      company: "Liberty Home Funding",
      rating: 4,
      platform: "G2",
      date: "2025-09-18",
    },
    {
      quote:
        "Our loan officers actually enjoy using RepWell. That alone made the switch from Experience.com worth it.",
      author: "Michael D.",
      role: "Branch Manager",
      company: "Coastal Mortgage Services",
      rating: 5,
      platform: "Capterra",
      date: "2025-11-29",
    },
    {
      quote:
        "Setup took three days. Three. Our Experience.com implementation took two months and three project managers.",
      author: "Jennifer W.",
      role: "CTO",
      company: "Apex Lending Group",
      rating: 5,
      platform: "G2",
      date: "2025-08-15",
    },
    {
      quote:
        "The leaderboard feature has turned review collection into a friendly competition. Volume is up 300% since we launched.",
      author: "Carlos M.",
      role: "Sales Manager",
      company: "Premier Mortgage Partners",
      rating: 4,
      platform: "Capterra",
      date: "2025-10-05",
    },
    {
      quote:
        "RepWell's testimonial workflow is a game changer. We went from manually collecting quotes to having a fully automated pipeline.",
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
        "We were spending $5k/month on Experience.com and barely using half the features. RepWell gives us what we need for under $2k.",
      author: "Patricia H.",
      role: "CFO",
      company: "Mountain West Financial",
      rating: 5,
      platform: "G2",
      date: "2025-11-01",
    },
    {
      quote:
        "The Google Business Profile management alone saved us from hiring another marketing coordinator.",
      author: "Kevin O.",
      role: "Marketing VP",
      company: "First Choice Lending",
      rating: 4,
      platform: "Capterra",
      date: "2025-09-22",
    },
    {
      quote:
        "RepWell's NPS tracking helped us identify a training gap in our newer LOs. Our company-wide score jumped 15 points in one quarter.",
      author: "Diana F.",
      role: "Training Director",
      company: "Vanguard Home Loans",
      rating: 5,
      platform: "G2",
      date: "2025-10-30",
    },
    {
      quote:
        "Migration was painless. The RepWell team handled everything and we didn't lose a single day of review collection.",
      author: "Brian N.",
      role: "Operations Lead",
      company: "Gateway Mortgage Group",
      rating: 5,
      platform: "Capterra",
      date: "2025-08-09",
    },
    {
      quote:
        "The AI-generated review responses save our team at least 10 hours per week. And they actually sound human.",
      author: "Rachel G.",
      role: "Customer Experience Manager",
      company: "Sunbelt Lending",
      rating: 5,
      platform: "G2",
      date: "2025-12-19",
    },
    {
      quote:
        "I evaluated five platforms before choosing RepWell. Nothing else comes close for mortgage-specific review management.",
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
    headline: "Ready to leave Experience.com behind?",
    subhead:
      "Join hundreds of mortgage companies that switched to RepWell for better pricing, faster setup, and a platform their team actually uses.",
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
