// Industry-specific landing page content configurations
// Follows Hormozi/Gary V marketing frameworks
import type { IndustryPageConfig, IndustryType } from "@/lib/industry/types";

/**
 * Mortgage industry landing page configuration
 */
export const mortgagePageConfig: IndustryPageConfig = {
  slug: "mortgage",
  industry: "mortgage",
  hero: {
    badge: "Built for Mortgage Professionals",
    title: "Turn Every Closing Into a ",
    titleAccent: "5-Star Review",
    description:
      "Automate review collection, build your online reputation, and generate more referrals. RepWell helps loan officers become the go-to choice in their market.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Reviews Take Too Long",
      description:
        "Manually chasing borrowers for reviews after closing wastes hours each week and most never follow through.",
      stat: { value: "Insights", label: "hours/month wasted" },
    },
    {
      icon: "TrendingDown",
      title: "Falling Behind Competitors",
      description:
        "Other LOs in your market are building massive review profiles while you're stuck with a handful of outdated testimonials.",
      stat: { value: "Reviews", label: "of borrowers check reviews" },
    },
    {
      icon: "MessageSquareOff",
      title: "No Feedback Loop",
      description:
        "You only hear from unhappy borrowers. The satisfied ones close and move on, never sharing their experience.",
    },
    {
      icon: "BarChart2",
      title: "Can't Prove Your Value",
      description:
        "When branch managers ask about customer satisfaction, you're guessing instead of showing data.",
    },
    {
      icon: "Users",
      title: "Referral Sources Drying Up",
      description:
        "Realtors and builders want to partner with LOs who have social proof. No reviews means fewer partnerships.",
    },
    {
      icon: "AlertTriangle",
      title: "Negative Reviews Go Viral",
      description:
        "One unhappy borrower can tank your Google rating. Without a system, you can't catch issues before they go public.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews Collected", description: "vs. manual outreach" },
    { value: "AI", label: "Feedback Trends", description: "from customer feedback" },
    { value: "NPS", label: "Survey Workflows", description: "for customer feedback" },
    { value: "Reviews", label: "Review Monitoring", description: "across review channels" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Automated Review Collection",
      summary:
        "Perfectly-timed surveys sent when loans close, with smart reminders that maximize response rates without annoying borrowers.",
      bulletPoints: [
        "Trigger surveys at optimal moments post-closing",
        "Smart follow-up sequences that boost responses",
        "Route happy borrowers to Google and Zillow",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=1400&fit=crop&q=80",
          alt: "Mortgage professional helping clients",
        },
      ],
      stat: { value: "Reviews", label: "more reviews collected" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Real-Time NPS & Analytics",
      summary:
        "Track NPS, satisfaction trends, and performance metrics across your team with live dashboards.",
      bulletPoints: [
        "Live NPS tracking across all loan officers",
        "Automated weekly and monthly reports",
        "Compare performance across branches",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=700&fit=crop&q=80", alt: "Business professionals" },
        { src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=700&fit=crop&q=80", alt: "Professional woman" },
        { src: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&h=700&fit=crop&q=80", alt: "Professional at desk" },
        { src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=700&fit=crop&q=80", alt: "Team meeting" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "MessageSquare",
      tabName: "AI Insights",
      title: "AI-Powered Sentiment Analysis",
      summary:
        "Understand what borrowers really think with automatic sentiment detection and theme extraction.",
      bulletPoints: [
        "Automatic sentiment scoring on every review",
        "Key phrase extraction identifies trends",
        "AI-generated response suggestions",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1600&h=900&fit=crop&q=80",
          alt: "Team collaboration",
        },
      ],
      stat: { value: "AI", label: "accuracy rate" },
    },
    {
      icon: "Zap",
      tabName: "Amplify",
      title: "Reputation Amplification",
      summary:
        "Route positive reviews to Google and Zillow. Capture video testimonials. Share to social with one click.",
      bulletPoints: [
        "One-click publishing to review platforms",
        "Video testimonial capture",
        "Automated social media sharing",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=600&fit=crop&q=80", alt: "Presentation" },
        { src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&h=600&fit=crop&q=80", alt: "Team success" },
        { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=1200&fit=crop&q=80", alt: "Professional" },
      ],
      stat: { value: "Reviews", label: "review volume increase" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Loan Officers",
      description: "Build your personal brand and generate more referrals",
      features: [
        "Personal dashboard with your reviews and metrics",
        "Automated survey sending after each closing",
        "Direct routing to your Google Business Profile",
        "Video testimonial requests",
        "Social media content generation",
      ],
    },
    {
      role: "manager",
      label: "Branch Managers",
      description: "Track team performance and drive accountability",
      features: [
        "Team leaderboards and rankings",
        "Branch-wide NPS tracking",
        "Automated performance reports",
        "Early warning for at-risk customers",
        "Coaching insights from review data",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Scale reputation management across your organization",
      features: [
        "Multi-branch rollup dashboards",
        "Encompass and LOS integrations",
        "Custom branding and white-label options",
        "SSO and enterprise security",
        "Dedicated success manager",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your CRM",
      description: "Integrate with Encompass, Velocify, or upload your closing data. Takes 5 minutes.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Customize Your Surveys",
      description: "Brand your surveys with your logo and colors. Choose from proven templates.",
      icon: "Palette",
    },
    {
      step: 3,
      title: "Automate Outreach",
      description: "Surveys send automatically at closing. Smart reminders boost response rates.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Grow Your Reputation",
      description: "Route happy borrowers to Google and Zillow. Watch your reviews multiply.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "Encompass", logoUrl: "/integrations/encompass.svg", category: "LOS" },
    { name: "Velocify", logoUrl: "/integrations/velocify.svg", category: "CRM" },
    { name: "Total Expert", logoUrl: "/integrations/total-expert.svg", category: "Marketing" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
    { name: "Zillow", logoUrl: "/integrations/zillow.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "30-Day Money Back",
      description: "Try RepWell risk-free. If you're not seeing results in 30 days, we'll refund every penny.",
    },
    {
      icon: "Lock",
      title: "Bank-Level Security",
      description: "SOC 2 compliant with 256-bit encryption. Your data is protected at every step.",
    },
    {
      icon: "Headphones",
      title: "White-Glove Onboarding",
      description: "Our team handles setup, training, and integration. You'll be collecting reviews within 48 hours.",
    },
  ],
  cta: {
    headline: "Ready to Build Your Reputation?",
    description:
      "Use RepWell to grow your business through reviews and referrals.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
    urgencyText: "Limited: First 50 signups get 3 months free",
  },
  seo: {
    title: "Reputation Management for Mortgage Professionals | RepWell",
    description:
      "Automate review collection, track NPS, and grow your mortgage business with RepWell. Start your free trial today.",
    keywords: [
      "mortgage reputation management",
      "loan officer reviews",
      "mortgage NPS",
      "review automation mortgage",
      "loan officer marketing",
    ],
  },
};

/**
 * Real Estate industry landing page configuration
 */
export const realEstatePageConfig: IndustryPageConfig = {
  slug: "real-estate",
  industry: "real_estate",
  hero: {
    badge: "Trusted by Top-Producing Agents",
    title: "Win More Listings With ",
    titleAccent: "Social Proof",
    description:
      "In a market where buyers check agent reviews before reaching out, your online reputation is your competitive edge. Build it automatically.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See How It Works",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Clients Forget to Review",
      description:
        "Even your happiest clients move on after closing. Without follow-up, many never leave a review.",
      stat: { value: "Reviews", label: "never leave reviews" },
    },
    {
      icon: "Search",
      title: "Competitors Outrank You",
      description:
        "Agents with more reviews dominate Zillow and Google searches. Every day without reviews is lost visibility.",
      stat: { value: "Reviews", label: "check reviews first" },
    },
    {
      icon: "Users",
      title: "Referrals Aren't Converting",
      description:
        "Even warm referrals research you online. A thin review profile creates doubt and loses deals.",
    },
    {
      icon: "BarChart2",
      title: "No Performance Visibility",
      description:
        "You can't improve what you don't measure. Most agents have no idea what clients really think.",
    },
    {
      icon: "Megaphone",
      title: "Testimonials Go Unused",
      description:
        "Amazing client stories sit in your inbox instead of working for you on social media.",
    },
    {
      icon: "AlertCircle",
      title: "One Bad Review Hurts",
      description:
        "Without a steady flow of positive reviews, one negative experience tanks your average.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. manual requests" },
    { value: "Trust", label: "Buyers Research", description: "agents online first" },
    { value: "Reviews", label: "Review Monitoring", description: "across review channels" },
    { value: "Fast", label: "Time to Value", description: "from signup to reviews" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Automated Review Collection",
      summary:
        "Post-closing surveys trigger automatically. Smart timing and follow-ups maximize responses without being pushy.",
      bulletPoints: [
        "Auto-send after closing date",
        "Email delivery",
        "Route positive reviews to Zillow & Google",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&h=1400&fit=crop&q=80",
          alt: "Real estate agent with happy clients",
        },
      ],
      stat: { value: "Reviews", label: "more reviews" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Client Satisfaction Insights",
      summary:
        "Real-time NPS tracking shows exactly how your clients feel. Spot trends before they become problems.",
      bulletPoints: [
        "Live NPS and satisfaction scores",
        "Compare your metrics to market averages",
        "Weekly email digests with key insights",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1560520653-9e0e4c89eb11?w=600&h=700&fit=crop&q=80", alt: "Home interior" },
        { src: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=600&h=700&fit=crop&q=80", alt: "Modern home" },
        { src: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=700&fit=crop&q=80", alt: "Luxury home" },
        { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=700&fit=crop&q=80", alt: "Beautiful home" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "MessageSquare",
      tabName: "Testimonials",
      title: "Testimonial Management",
      summary:
        "Capture, organize, and publish client stories across all your marketing channels with one click.",
      bulletPoints: [
        "Video testimonial requests",
        "One-click social media sharing",
        "Embed widgets for your website",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=900&fit=crop&q=80",
          alt: "Happy homeowners",
        },
      ],
      stat: { value: "Referrals", label: "more referrals" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Reputation Amplification",
      summary:
        "Transform satisfied clients into your marketing engine. Reviews flow to the platforms that matter most.",
      bulletPoints: [
        "Automatic Zillow profile building",
        "Google Business Profile optimization",
        "Review response templates",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1560518883-7c0d3a3e3e0a?w=600&h=600&fit=crop&q=80", alt: "Open house" },
        { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop&q=80", alt: "Home exterior" },
        { src: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=1200&fit=crop&q=80", alt: "Real estate" },
      ],
      stat: { value: "Reviews", label: "review growth" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Agents",
      description: "Build your personal brand and win more listings",
      features: [
        "Personal review dashboard",
        "Automated post-closing surveys",
        "Direct Zillow and Google integration",
        "Social media content generator",
      ],
    },
    {
      role: "manager",
      label: "Team Leaders",
      description: "Track agent performance and coach with data",
      features: [
        "Team-wide analytics dashboard",
        "Agent comparison and rankings",
        "Performance trend reports",
        "Coaching insights from reviews",
        "Brokerage branding options",
      ],
    },
    {
      role: "enterprise",
      label: "Brokerages",
      description: "Scale reputation management across your company",
      features: [
        "Multi-office rollup reporting",
        "CRM integrations (FUB, kvCORE, etc.)",
        "Custom branding and white-label",
        "SSO and enterprise security",
        "Dedicated account manager",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your CRM",
      description: "Integrate with Follow Up Boss, kvCORE, or upload your transactions.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Customize Surveys",
      description: "Brand everything with your photo, colors, and messaging.",
      icon: "Palette",
    },
    {
      step: 3,
      title: "Surveys Send Automatically",
      description: "Post-closing outreach happens without you lifting a finger.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Reviews Build Your Brand",
      description: "Happy clients flow to Zillow and Google. Your reputation grows.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "Follow Up Boss", logoUrl: "/integrations/follow-up-boss.svg", category: "CRM" },
    { name: "kvCORE", logoUrl: "/integrations/kvcore.svg", category: "CRM" },
    { name: "BoomTown", logoUrl: "/integrations/boomtown.svg", category: "CRM" },
    { name: "Zillow", logoUrl: "/integrations/zillow.svg", category: "Reviews" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
    { name: "Realtor.com", logoUrl: "/integrations/realtor-com.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "30-Day Money Back",
      description: "Try risk-free. If you don't see more reviews in 30 days, get a full refund.",
    },
    {
      icon: "Zap",
      title: "First Review in 48 Hours",
      description: "Our team sets you up fast. Most agents get their first automated review within 2 days.",
    },
    {
      icon: "Headphones",
      title: "Dedicated Success Team",
      description: "Real humans who know real estate. We're here to help you grow.",
    },
  ],
  cta: {
    headline: "Ready to Dominate Your Market?",
    description:
      "Use RepWell to build your reputation and win more business.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Real Estate Agents | RepWell",
    description:
      "Automate review collection for Zillow and Google. Build your online reputation and win more listings with RepWell. Free trial available.",
    keywords: [
      "real estate reputation management",
      "agent reviews",
      "zillow reviews automation",
      "realtor marketing",
      "real estate NPS",
    ],
  },
};

/**
 * Insurance industry landing page configuration
 */
export const insurancePageConfig: IndustryPageConfig = {
  slug: "insurance",
  industry: "insurance",
  hero: {
    badge: "Trusted by Insurance Agencies Nationwide",
    title: "Policies Sell Themselves When ",
    titleAccent: "Clients Trust You",
    description:
      "In an industry built on trust, your online reputation is everything. Automate review collection and become the most-reviewed agency in your market.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Renewals Don't Trigger Reviews",
      description:
        "Unlike one-time purchases, insurance renewals rarely prompt clients to leave feedback without a system.",
    },
    {
      icon: "Shield",
      title: "Trust Is Hard to Prove",
      description:
        "Insurance is a trust-based purchase. Without reviews, prospects rely on guesswork when choosing an agent.",
      stat: { value: "Trust", label: "research online first" },
    },
    {
      icon: "UserMinus",
      title: "Claims Experiences Go Unheard",
      description:
        "Your best moments (handling claims well) rarely get captured as testimonials.",
    },
    {
      icon: "Target",
      title: "Competing on Price Alone",
      description:
        "Without differentiation through reviews, you're stuck competing on premiums instead of service.",
    },
    {
      icon: "BarChart",
      title: "No Client Satisfaction Data",
      description:
        "You don't know how clients really feel until they leave for a competitor.",
    },
    {
      icon: "AlertTriangle",
      title: "Complaints Damage Reputation",
      description:
        "One BBB complaint or bad Google review can undo years of good work.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. manual requests" },
    { value: "Trust", label: "Research Online", description: "before choosing" },
    { value: "Feedback", label: "Retention Rate", description: "for top-reviewed agencies" },
    { value: "Reviews", label: "Review Monitoring", description: "across review channels" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Automated Review Collection",
      summary:
        "Trigger surveys after policy purchases, renewals, and claims. Smart timing captures satisfaction at peak moments.",
      bulletPoints: [
        "Post-purchase and renewal triggers",
        "Claims follow-up surveys",
        "Email outreach",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=1400&fit=crop&q=80",
          alt: "Insurance agent meeting with clients",
        },
      ],
      stat: { value: "Reviews", label: "more reviews" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Client Satisfaction Tracking",
      summary:
        "Real-time NPS and satisfaction scores across your book of business. Identify at-risk clients before they churn.",
      bulletPoints: [
        "Live NPS dashboard",
        "At-risk client alerts",
        "Retention prediction insights",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=700&fit=crop&q=80", alt: "Professional" },
        { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&q=80", alt: "Business meeting" },
        { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=700&fit=crop&q=80", alt: "Executive" },
        { src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=700&fit=crop&q=80", alt: "Presentation" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "Shield",
      tabName: "Claims",
      title: "Claims Experience Capture",
      summary:
        "Turn exceptional claims handling into powerful testimonials that differentiate you from competitors.",
      bulletPoints: [
        "Post-claim satisfaction surveys",
        "Claims story capture",
        "Video testimonial requests",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1600&h=900&fit=crop&q=80",
          alt: "Insurance professional",
        },
      ],
      stat: { value: "AI", label: "Claims feedback" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Reputation Building",
      summary:
        "Route positive feedback to Google and industry platforms. Build the trust that drives referrals.",
      bulletPoints: [
        "Google Business optimization",
        "BBB rating improvement",
        "Referral program integration",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&h=600&fit=crop&q=80", alt: "Success" },
        { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=600&fit=crop&q=80", alt: "Team" },
        { src: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=600&h=1200&fit=crop&q=80", alt: "Professional" },
      ],
      stat: { value: "Reviews", label: "review growth" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Agents",
      description: "Build trust and grow your book of business",
      features: [
        "Personal review dashboard",
        "Automated policy lifecycle surveys",
        "Google Business Profile growth",
        "Social media testimonial sharing",
        "Mobile-friendly client outreach",
      ],
    },
    {
      role: "manager",
      label: "Agency Managers",
      description: "Track team performance and client satisfaction",
      features: [
        "Agency-wide NPS dashboard",
        "Agent comparison and rankings",
        "At-risk client identification",
        "Claims satisfaction tracking",
        "Performance coaching insights",
      ],
    },
    {
      role: "enterprise",
      label: "Carriers & Networks",
      description: "Scale reputation management across your network",
      features: [
        "Multi-agency rollup reporting",
        "Agency management system integrations",
        "Brand compliance controls",
        "Enterprise security (SSO, SCIM)",
        "Dedicated success team",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your AMS",
      description: "Integrate with AgencyZoom, HawkSoft, or upload policy data.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Your Triggers",
      description: "Choose when surveys send: new policies, renewals, claims, etc.",
      icon: "Settings",
    },
    {
      step: 3,
      title: "Surveys Send Automatically",
      description: "Clients receive personalized requests at the perfect time.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Watch Trust Build",
      description: "Reviews flow to Google. Your reputation grows. Referrals follow.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "AgencyZoom", logoUrl: "/integrations/agencyzoom.svg", category: "AMS" },
    { name: "HawkSoft", logoUrl: "/integrations/hawksoft.svg", category: "AMS" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "30-Day Money Back",
      description: "Try completely risk-free. Not satisfied? Full refund, no questions.",
    },
    {
      icon: "Lock",
      title: "Compliant & Secure",
      description: "Built for insurance. SOC 2 compliant with industry-specific safeguards.",
    },
    {
      icon: "Headphones",
      title: "Insurance-Savvy Support",
      description: "Our team understands insurance operations. Real help from real experts.",
    },
  ],
  cta: {
    headline: "Build the Trust That Wins Business",
    description:
      "Join agencies that use RepWell to capture client satisfaction and grow through reputation.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Insurance Agencies | RepWell",
    description:
      "Automate review collection for your insurance agency. Build client trust, improve retention, and grow your book of business. Free trial available.",
    keywords: [
      "insurance reputation management",
      "insurance agency reviews",
      "insurance NPS",
      "agency client satisfaction",
    ],
  },
};

/**
 * Healthcare industry landing page configuration
 */
export const healthcarePageConfig: IndustryPageConfig = {
  slug: "healthcare",
  industry: "healthcare",
  hero: {
    badge: "HIPAA-Compliant Patient Feedback",
    title: "Patient Experience That ",
    titleAccent: "Builds Reputation",
    description:
      "Patients check online reviews before booking. Capture feedback, improve care, and grow your practice with HIPAA-conscious reputation management.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Patients Don't Leave Reviews",
      description:
        "Satisfied patients leave quietly. Without a system, only unhappy patients share their experience online.",
      stat: { value: "Reviews", label: "leave reviews naturally" },
    },
    {
      icon: "Search",
      title: "Competitors Rank Higher",
      description:
        "Practices with more reviews dominate Healthgrades and Google. New patients find them first.",
      stat: { value: "Reviews", label: "check reviews first" },
    },
    {
      icon: "FileWarning",
      title: "HIPAA Compliance Concerns",
      description:
        "Generic review tools aren't built for healthcare. You need HIPAA-compliant patient feedback.",
    },
    {
      icon: "MessageSquareOff",
      title: "No Early Warning System",
      description:
        "You learn about patient dissatisfaction from a 1-star review, not before it goes public.",
    },
    {
      icon: "Users",
      title: "Staff Performance Blind Spots",
      description:
        "Without patient feedback data, you can't coach your team on bedside manner and service.",
    },
    {
      icon: "TrendingDown",
      title: "Patient Leakage",
      description:
        "Patients leave for competitors without telling you why. No feedback means no improvement.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. manual outreach" },
    { value: "Trust", label: "Research First", description: "before booking" },
    { value: "Governed", label: "HIPAA Compliant", description: "end-to-end encryption" },
    { value: "Reviews", label: "Review Monitoring", description: "across our practices" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "HIPAA-Compliant Feedback",
      summary:
        "Capture patient satisfaction with fully HIPAA-compliant surveys. Build reviews while protecting patient privacy.",
      bulletPoints: [
        "Post-visit automated surveys",
        "HIPAA-compliant data handling",
        "Smart routing to review platforms",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=1400&fit=crop&q=80",
          alt: "Healthcare professional with patient",
        },
      ],
      stat: { value: "Reviews", label: "more reviews" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Patient Experience Analytics",
      summary:
        "Real-time NPS and satisfaction tracking across your practice. Identify trends and improve care.",
      bulletPoints: [
        "Provider-level satisfaction scores",
        "Wait time and staff feedback trends",
        "Benchmark against local competitors",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&h=700&fit=crop&q=80", alt: "Medical team" },
        { src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&h=700&fit=crop&q=80", alt: "Healthcare" },
        { src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&h=700&fit=crop&q=80", alt: "Doctor" },
        { src: "https://images.unsplash.com/photo-1551190822-a9333d879b1f?w=600&h=700&fit=crop&q=80", alt: "Medical team" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "AlertTriangle",
      tabName: "Recovery",
      title: "Service Recovery Alerts",
      summary:
        "Get instant alerts for dissatisfied patients. Resolve issues before they become public reviews.",
      bulletPoints: [
        "Real-time negative feedback alerts",
        "Service recovery workflow",
        "Private issue resolution",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?w=1600&h=900&fit=crop&q=80",
          alt: "Medical consultation",
        },
      ],
      stat: { value: "Feedback", label: "recovery rate" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Reputation Building",
      summary:
        "Route satisfied patients to Healthgrades, Google, and Zocdoc. Build the reputation that attracts new patients.",
      bulletPoints: [
        "Healthgrades profile optimization",
        "Google Business Profile growth",
        "Zocdoc review integration",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=600&h=600&fit=crop&q=80", alt: "Medical facility" },
        { src: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=600&h=600&fit=crop&q=80", alt: "Hospital" },
        { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=1200&fit=crop&q=80", alt: "Healthcare" },
      ],
      stat: { value: "Reviews", label: "review growth" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Providers",
      description: "Build your reputation and grow your patient base",
      features: [
        "Personal provider dashboard",
        "Patient satisfaction tracking",
        "Healthgrades profile management",
        "Review response templates",
        "Peer comparison benchmarks",
      ],
    },
    {
      role: "manager",
      label: "Practice Managers",
      description: "Track experience across your practice",
      features: [
        "Practice-wide NPS dashboard",
        "Provider comparison and rankings",
        "Service recovery workflow",
        "Staff training insights",
        "Patient retention analytics",
      ],
    },
    {
      role: "enterprise",
      label: "Health Systems",
      description: "Scale patient experience across your organization",
      features: [
        "Multi-location rollup reporting",
        "EHR/EMR integrations",
        "HIPAA-compliant architecture",
        "Enterprise SSO and security",
        "Dedicated success manager",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your EHR",
      description: "Integrate with athenahealth, Epic, or upload patient data securely.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Customize Surveys",
      description: "Brand your patient surveys. All data is HIPAA-compliant.",
      icon: "FileText",
    },
    {
      step: 3,
      title: "Surveys Send Post-Visit",
      description: "Patients receive feedback requests at the optimal time.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Reviews Build Your Practice",
      description: "Happy patients flow to Healthgrades and Google.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "athenahealth", logoUrl: "/integrations/athenahealth.svg", category: "EHR" },
    { name: "Healthgrades", logoUrl: "/integrations/healthgrades.svg", category: "Reviews" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
    { name: "Zocdoc", logoUrl: "/integrations/zocdoc.svg", category: "Scheduling" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "HIPAA Compliant",
      description: "Built for healthcare from day one. Full HIPAA compliance with BAA available.",
    },
    {
      icon: "Lock",
      title: "SOC 2 Certified",
      description: "Enterprise-grade security. Your patient data is protected at every step.",
    },
    {
      icon: "Headphones",
      title: "Healthcare-Expert Support",
      description: "Our team understands healthcare operations. We speak your language.",
    },
  ],
  cta: {
    headline: "Build the Reputation Your Care Deserves",
    description:
      "Join healthcare practices that use RepWell to capture patient satisfaction and grow through reputation.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Patient Experience & Reputation Management for Healthcare | RepWell",
    description:
      "HIPAA-compliant patient feedback and review management for healthcare practices. Build your Healthgrades reputation. Free trial available.",
    keywords: [
      "healthcare reputation management",
      "patient reviews",
      "HIPAA compliant surveys",
      "healthgrades reviews",
      "patient experience",
    ],
  },
};

/**
 * Stub configurations for remaining industries (to be expanded)
 */
export const financialAdvisoryPageConfig: IndustryPageConfig = {
  slug: "financial-advisory",
  industry: "financial_advisory",
  hero: {
    badge: "Trusted by Financial Advisors",
    title: "Client Trust That ",
    titleAccent: "Compounds",
    description:
      "In wealth management, reputation is everything. Build the social proof that attracts high-net-worth clients.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Lock",
      title: "Compliance Concerns",
      description: "Financial services have strict compliance requirements for testimonials and reviews.",
    },
    {
      icon: "Clock",
      title: "Long Sales Cycles",
      description: "Months pass between initial contact and client feedback. Momentum is lost.",
    },
    {
      icon: "Users",
      title: "Referrals Are Everything",
      description: "Your best clients come from referrals, but you can't scale word-of-mouth.",
    },
    {
      icon: "Search",
      title: "Prospects Research You",
      description: "Before trusting you with their wealth, prospects check your online reputation.",
      stat: { value: "Trust", label: "research advisors online" },
    },
    {
      icon: "BarChart",
      title: "No Client Satisfaction Data",
      description: "You don't know how clients feel until your annual review meeting.",
    },
    {
      icon: "Target",
      title: "Competing With Big Firms",
      description: "Large wealth management firms have marketing budgets you can't match.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. manual requests" },
    { value: "Trust", label: "Research First", description: "before choosing advisor" },
    { value: "Governed", label: "SEC Compliant", description: "testimonial management" },
    { value: "Reviews", label: "Review Monitoring", description: "across review channels" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Compliant Review Collection",
      summary: "Capture client testimonials while maintaining SEC and FINRA compliance.",
      bulletPoints: [
        "Compliance-approved survey templates",
        "Automated consent collection",
        "Archiving for regulatory requirements",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=1400&fit=crop&q=80",
          alt: "Financial advisor meeting",
        },
      ],
      stat: { value: "Stories", label: "more testimonials" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Client Satisfaction Insights",
      summary: "Track satisfaction across your book of business with real-time NPS.",
      bulletPoints: [
        "Real-time NPS tracking",
        "At-risk client identification",
        "Retention prediction",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=700&fit=crop&q=80", alt: "Finance" },
        { src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=700&fit=crop&q=80", alt: "Analytics" },
        { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&q=80", alt: "Professional" },
        { src: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=700&fit=crop&q=80", alt: "Business" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "MessageSquare",
      tabName: "Testimonials",
      title: "Compliant Testimonial Management",
      summary: "Collect, approve, and publish client stories within regulatory guidelines.",
      bulletPoints: [
        "Compliance review workflow",
        "Consent and archiving",
        "Website and social publishing",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop&q=80",
          alt: "Business presentation",
        },
      ],
      stat: { value: "Governed", label: "compliance rate" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Reputation That Attracts Wealth",
      summary: "Build the online presence that high-net-worth prospects expect.",
      bulletPoints: [
        "Google Business optimization",
        "LinkedIn testimonial integration",
        "Website review widgets",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1551836022-4c4c79ecde51?w=600&h=600&fit=crop&q=80", alt: "Success" },
        { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=600&fit=crop&q=80", alt: "Team" },
        { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=1200&fit=crop&q=80", alt: "Executive" },
      ],
      stat: { value: "Referrals", label: "referral increase" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Advisors",
      description: "Build your personal brand and AUM",
      features: [
        "Personal testimonial dashboard",
        "Compliant review collection",
        "LinkedIn integration",
        "Client satisfaction tracking",
        "Referral request automation",
      ],
    },
    {
      role: "manager",
      label: "Branch Managers",
      description: "Track advisor performance and client satisfaction",
      features: [
        "Team-wide NPS dashboard",
        "Advisor comparison",
        "Compliance oversight",
        "Performance coaching",
        "Retention analytics",
      ],
    },
    {
      role: "enterprise",
      label: "RIAs & Broker-Dealers",
      description: "Scale reputation management with compliance",
      features: [
        "Multi-branch reporting",
        "CRM integrations",
        "Compliance workflow",
        "Enterprise security",
        "Dedicated success team",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your CRM",
      description: "Integrate with Wealthbox, Redtail, or Salesforce.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Up Compliance",
      description: "Configure approval workflows for testimonials.",
      icon: "Shield",
    },
    {
      step: 3,
      title: "Collect Feedback",
      description: "Automated surveys capture client satisfaction.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Grow Through Trust",
      description: "Approved testimonials attract new clients.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "Wealthbox", logoUrl: "/integrations/wealthbox.svg", category: "CRM" },
    { name: "Redtail", logoUrl: "/integrations/redtail.svg", category: "CRM" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "Compliance-First Design",
      description: "Built for SEC and FINRA requirements. Testimonial archiving included.",
    },
    {
      icon: "Lock",
      title: "Enterprise Security",
      description: "SOC 2 certified. Your client data is protected.",
    },
    {
      icon: "Headphones",
      title: "White-Glove Onboarding",
      description: "We help you set up compliant workflows from day one.",
    },
  ],
  cta: {
    headline: "Build Trust That Grows Wealth",
    description:
      "Join financial advisors who use RepWell to build their reputation and grow AUM.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Financial Advisors | RepWell",
    description:
      "Compliant testimonial and review management for financial advisors. Build client trust and grow your practice. Free trial available.",
    keywords: [
      "financial advisor reputation",
      "wealth management reviews",
      "compliant testimonials",
      "advisor marketing",
    ],
  },
};

// Simplified stubs for remaining industries (home_services, legal, consulting)
// These follow the same structure but with abbreviated content

export const homeServicesPageConfig: IndustryPageConfig = {
  slug: "home-services",
  industry: "home_services",
  hero: {
    badge: "Trusted by Home Service Pros",
    title: "Reviews That Keep Your ",
    titleAccent: "Trucks Rolling",
    description:
      "Consumers read reviews before hiring a contractor. Build the reputation that keeps your schedule full.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Too Busy for Follow-Up",
      description: "You're running jobs all day. Who has time to chase reviews?",
    },
    {
      icon: "Search",
      title: "Competitors Have More Reviews",
      description: "They show up first on Google. You're losing jobs before prospects even call.",
      stat: { value: "Reviews", label: "check reviews first" },
    },
    {
      icon: "Star",
      title: "Great Work Goes Unnoticed",
      description: "Happy customers say 'great job' but never leave a review.",
    },
    {
      icon: "BarChart",
      title: "No Way to Track Satisfaction",
      description: "You hope customers are happy but you don't really know.",
    },
    {
      icon: "Megaphone",
      title: "Word-of-Mouth Isn't Enough",
      description: "Referrals are great but they don't scale. You need online visibility.",
    },
    {
      icon: "AlertTriangle",
      title: "One Bad Review Hurts",
      description: "Without steady positive reviews, one complaint tanks your rating.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. asking manually" },
    { value: "Reviews", label: "Check Reviews", description: "before hiring" },
    { value: "Reviews", label: "Review Monitoring", description: "across our pros" },
    { value: "Fast", label: "Setup Time", description: "start collecting today" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Review Collection on Autopilot",
      summary: "Email surveys send after every job. No extra work for you or your techs.",
      bulletPoints: [
        "One-tap review requests",
        "Route to Google, Yelp, Angi",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1200&h=1400&fit=crop&q=80",
          alt: "Home service professional",
        },
      ],
      stat: { value: "Reviews", label: "more reviews" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Know What Customers Think",
      summary: "Real-time satisfaction scores for every tech and job type.",
      bulletPoints: [
        "Technician performance tracking",
        "Job type satisfaction trends",
        "Customer feedback themes",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=700&fit=crop&q=80", alt: "Technician" },
        { src: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=700&fit=crop&q=80", alt: "Home repair" },
        { src: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=700&fit=crop&q=80", alt: "Team" },
        { src: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=700&fit=crop&q=80", alt: "Work" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "AlertTriangle",
      tabName: "Recovery",
      title: "Catch Problems Before Reviews",
      summary: "Unhappy customers tell you first, not Google. Fix issues before they go public.",
      bulletPoints: [
        "Instant alerts for low scores",
        "Service recovery workflow",
        "Turn complaints into fans",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&h=900&fit=crop&q=80",
          alt: "Customer service",
        },
      ],
      stat: { value: "Feedback", label: "recovery rate" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Dominate Local Search",
      summary: "More reviews = higher rankings = more jobs. Simple math.",
      bulletPoints: [
        "Google Business Profile optimization",
        "Nextdoor reputation building",
        "Review response templates",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=600&fit=crop&q=80", alt: "Home" },
        { src: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=600&fit=crop&q=80", alt: "House" },
        { src: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=1200&fit=crop&q=80", alt: "Exterior" },
      ],
      stat: { value: "Reviews", label: "review growth" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Technicians",
      description: "Build your personal reputation",
      features: [
        "Personal review dashboard",
        "Performance tracking",
        "Customer feedback view",
        "Gamification and rankings",
      ],
    },
    {
      role: "manager",
      label: "Office Managers",
      description: "Track team performance",
      features: [
        "Team dashboard",
        "Technician rankings",
        "Service recovery tools",
        "Weekly reports",
        "Customer insights",
      ],
    },
    {
      role: "enterprise",
      label: "Multi-Location",
      description: "Scale across your company",
      features: [
        "Multi-location reporting",
        "ServiceTitan integration",
        "Custom branding",
        "Enterprise support",
        "API access",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your Software",
      description: "Integrate with ServiceTitan, Housecall Pro, or Jobber.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Jobs Sync Automatically",
      description: "Completed jobs trigger review requests. No manual work.",
      icon: "RefreshCw",
    },
    {
      step: 3,
      title: "Customers Get Emailed",
      description: "Simple email surveys. Customers tap to leave a review.",
      icon: "Smartphone",
    },
    {
      step: 4,
      title: "Reviews Flow In",
      description: "Google, Yelp, and Angi reviews grow automatically.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "ServiceTitan", logoUrl: "/integrations/servicetitan.svg", category: "FSM" },
    { name: "Housecall Pro", logoUrl: "/integrations/housecall-pro.svg", category: "FSM" },
    { name: "Jobber", logoUrl: "/integrations/jobber.svg", category: "FSM" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "30-Day Money Back",
      description: "See results or get your money back. No questions asked.",
    },
    {
      icon: "Zap",
      title: "First Review in 24 Hours",
      description: "Most pros get their first automated review within a day.",
    },
    {
      icon: "Headphones",
      title: "Real Human Support",
      description: "Not chatbots. Real people who understand home services.",
    },
  ],
  cta: {
    headline: "Fill Your Schedule With Reviews",
    description: "Join home service pros who use RepWell to dominate local search.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Home Service Contractors | RepWell",
    description:
      "Automate review collection for plumbers, electricians, HVAC, and more. Dominate local search. Free trial available.",
    keywords: [
      "contractor reviews",
      "home services reputation",
      "plumber reviews",
      "HVAC reviews",
      "local SEO contractors",
    ],
  },
};

export const legalPageConfig: IndustryPageConfig = {
  slug: "legal",
  industry: "legal",
  hero: {
    badge: "Trusted by Law Firms Nationwide",
    title: "Clients Trust Attorneys With ",
    titleAccent: "Proven Results",
    description:
      "People looking for a lawyer check online reviews first. Build the reputation that wins trust before the first consultation.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Cases End, Reviews Don't Come",
      description: "Even successful outcomes rarely result in online reviews without follow-up.",
    },
    {
      icon: "Search",
      title: "Competitors Rank Higher",
      description: "Firms with more Avvo and Google reviews get found first.",
      stat: { value: "Reviews", label: "check reviews first" },
    },
    {
      icon: "FileText",
      title: "Ethics Concerns With Solicitation",
      description: "Bar rules make asking for reviews feel risky. You need a compliant approach.",
    },
    {
      icon: "Users",
      title: "Referrals Are Slowing",
      description: "Other attorneys want to refer to lawyers with proven track records.",
    },
    {
      icon: "BarChart",
      title: "No Client Satisfaction Data",
      description: "You don't know what clients really think until they leave or complain.",
    },
    {
      icon: "Target",
      title: "Marketing Feels Uncomfortable",
      description: "You went to law school, not marketing school. Self-promotion feels wrong.",
    },
  ],
  stats: [
    { value: "Reviews", label: "More Reviews", description: "vs. manual requests" },
    { value: "Trust", label: "Research First", description: "before hiring" },
    { value: "Governed", label: "Ethics Compliant", description: "bar-approved approach" },
    { value: "Reviews", label: "Review Monitoring", description: "across our firms" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Reviews",
      title: "Ethics-Compliant Review Collection",
      summary: "Post-matter surveys that comply with bar rules while building your reputation.",
      bulletPoints: [
        "Bar-compliant survey language",
        "Post-matter timing",
        "Route to Avvo, Google, Martindale",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=1400&fit=crop&q=80",
          alt: "Law office",
        },
      ],
      stat: { value: "Reviews", label: "more reviews" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Client Experience Insights",
      summary: "Track satisfaction across practice areas and attorneys.",
      bulletPoints: [
        "Attorney-level satisfaction",
        "Practice area trends",
        "NPS tracking",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=700&fit=crop&q=80", alt: "Professional" },
        { src: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&h=700&fit=crop&q=80", alt: "Meeting" },
        { src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=700&fit=crop&q=80", alt: "Attorney" },
        { src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=700&fit=crop&q=80", alt: "Lawyer" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "MessageSquare",
      tabName: "Testimonials",
      title: "Case Story Capture",
      summary: "Collect powerful client stories that showcase your results.",
      bulletPoints: [
        "Written and video testimonials",
        "Consent management",
        "Website and marketing use",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=1600&h=900&fit=crop&q=80",
          alt: "Legal consultation",
        },
      ],
      stat: { value: "Stories", label: "testimonials/month" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Legal Directory Dominance",
      summary: "Build your presence on the platforms that matter for attorneys.",
      bulletPoints: [
        "Avvo profile optimization",
        "Martindale-Hubbell ratings",
        "Google Business Profile",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=600&fit=crop&q=80", alt: "Office" },
        { src: "https://images.unsplash.com/photo-1521791055366-0d553872125f?w=600&h=600&fit=crop&q=80", alt: "Consultation" },
        { src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=1200&fit=crop&q=80", alt: "Law" },
      ],
      stat: { value: "Reviews", label: "review growth" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Attorneys",
      description: "Build your personal reputation",
      features: [
        "Personal review dashboard",
        "Post-matter survey automation",
        "Avvo profile management",
        "Testimonial collection",
        "Peer comparison",
      ],
    },
    {
      role: "manager",
      label: "Practice Managers",
      description: "Track firm-wide client experience",
      features: [
        "Firm-wide NPS dashboard",
        "Attorney comparison",
        "Practice area analytics",
        "Client satisfaction trends",
        "Marketing insights",
      ],
    },
    {
      role: "enterprise",
      label: "Multi-Office Firms",
      description: "Scale reputation management",
      features: [
        "Multi-office reporting",
        "Practice management integrations",
        "Custom branding",
        "Enterprise security",
        "Dedicated success team",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your PMS",
      description: "Integrate with Clio, MyCase, or Lawmatics.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Matter Triggers",
      description: "Choose when surveys send: case close, settlement, etc.",
      icon: "Settings",
    },
    {
      step: 3,
      title: "Clients Get Surveyed",
      description: "Bar-compliant requests at the right time.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Reputation Grows",
      description: "Reviews flow to Avvo, Google, and Martindale.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "Clio", logoUrl: "/integrations/clio.svg", category: "PMS" },
    { name: "MyCase", logoUrl: "/integrations/mycase.svg", category: "PMS" },
    { name: "Lawmatics", logoUrl: "/integrations/lawmatics.svg", category: "CRM" },
    { name: "Avvo", logoUrl: "/integrations/avvo.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "Ethics-First Approach",
      description: "Built with bar rules in mind. Compliant testimonial collection.",
    },
    {
      icon: "Lock",
      title: "Client Confidentiality",
      description: "Attorney-client privilege respected. No case details shared.",
    },
    {
      icon: "Headphones",
      title: "Legal Industry Expertise",
      description: "We understand law firm operations and ethics requirements.",
    },
  ],
  cta: {
    headline: "Build the Reputation You've Earned",
    description: "Join law firms that use RepWell to showcase their results and win more clients.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Law Firms | RepWell",
    description:
      "Ethics-compliant review collection for attorneys. Build your Avvo reputation. Free trial available.",
    keywords: [
      "law firm reputation",
      "attorney reviews",
      "avvo reviews",
      "legal marketing",
      "lawyer testimonials",
    ],
  },
};

export const consultingPageConfig: IndustryPageConfig = {
  slug: "consulting",
  industry: "consulting",
  hero: {
    badge: "Trusted by Consulting Firms",
    title: "Expertise Proven By ",
    titleAccent: "Client Results",
    description:
      "In consulting, reputation is your product. Turn successful engagements into the social proof that wins new business.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },
  painPoints: [
    {
      icon: "Clock",
      title: "Projects End, Stories Lost",
      description: "Successful engagements wrap up and those stories never get captured.",
    },
    {
      icon: "Target",
      title: "Hard to Differentiate",
      description: "Everyone says they're strategic advisors. Client results prove it.",
    },
    {
      icon: "Users",
      title: "Referrals Drive Growth",
      description: "Your best clients come from referrals, but you can't scale word-of-mouth.",
    },
    {
      icon: "BarChart",
      title: "No NPS Tracking",
      description: "You don't know how clients feel until renewal conversations.",
    },
    {
      icon: "Briefcase",
      title: "Case Studies Take Forever",
      description: "Creating case studies requires client approval and takes months.",
    },
    {
      icon: "Search",
      title: "Limited Online Presence",
      description: "Prospects research you but find little beyond your website.",
    },
  ],
  stats: [
    { value: "Stories", label: "More Testimonials", description: "vs. manual requests" },
    { value: "Trust", label: "Research First", description: "before hiring consultants" },
    { value: "Feedback", label: "Client Satisfaction", description: "across review channels" },
    { value: "Reviews", label: "Review Monitoring", description: "from review workflows" },
  ],
  featureTabs: [
    {
      icon: "Star",
      tabName: "Feedback",
      title: "Engagement Feedback Collection",
      summary: "Capture client satisfaction at key milestones and engagement close.",
      bulletPoints: [
        "Mid-engagement check-ins",
        "Close-of-project surveys",
        "Testimonial capture",
      ],
      layoutVariant: "single",
      images: [
        {
          src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=1400&fit=crop&q=80",
          alt: "Consulting meeting",
        },
      ],
      stat: { value: "Stories", label: "more testimonials" },
    },
    {
      icon: "BarChart3",
      tabName: "Analytics",
      title: "Client Satisfaction Analytics",
      summary: "Real-time NPS tracking across all engagements and consultants.",
      bulletPoints: [
        "Engagement-level satisfaction",
        "Consultant performance",
        "Service line trends",
      ],
      layoutVariant: "floating",
      images: [
        { src: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=600&h=700&fit=crop&q=80", alt: "Team" },
        { src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=700&fit=crop&q=80", alt: "Collaboration" },
        { src: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=700&fit=crop&q=80", alt: "Meeting" },
        { src: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=700&fit=crop&q=80", alt: "Professional" },
      ],
      stat: { value: "NPS", label: "Survey workflows" },
    },
    {
      icon: "FileText",
      tabName: "Case Studies",
      title: "Rapid Case Study Creation",
      summary: "Turn testimonials into case studies with client-approved quotes.",
      bulletPoints: [
        "Quote approval workflow",
        "Results documentation",
        "Marketing-ready content",
      ],
      layoutVariant: "wide",
      images: [
        {
          src: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1600&h=900&fit=crop&q=80",
          alt: "Presentation",
        },
      ],
      stat: { value: "Stories", label: "faster case studies" },
    },
    {
      icon: "Trophy",
      tabName: "Growth",
      title: "Reputation Building",
      summary: "Build your online presence with client-approved social proof.",
      bulletPoints: [
        "LinkedIn testimonial integration",
        "Google Business Profile",
        "Clutch.co review management",
      ],
      layoutVariant: "grid",
      images: [
        { src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&h=600&fit=crop&q=80", alt: "Workshop" },
        { src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&h=600&fit=crop&q=80", alt: "Strategy" },
        { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=1200&fit=crop&q=80", alt: "Consultant" },
      ],
      stat: { value: "Referrals", label: "referral increase" },
    },
  ],
  roleTabs: [
    {
      role: "professional",
      label: "Consultants",
      description: "Build your personal brand",
      features: [
        "Personal feedback dashboard",
        "Engagement surveys",
        "LinkedIn testimonials",
        "Client relationship tracking",
        "Performance benchmarks",
      ],
    },
    {
      role: "manager",
      label: "Practice Leaders",
      description: "Track team performance",
      features: [
        "Practice-wide NPS",
        "Consultant comparison",
        "Service line analytics",
        "Client retention insights",
        "Coaching recommendations",
      ],
    },
    {
      role: "enterprise",
      label: "Firm-Wide",
      description: "Scale reputation management",
      features: [
        "Multi-practice reporting",
        "CRM integrations",
        "Custom branding",
        "Enterprise security",
        "Dedicated success team",
      ],
    },
  ],
  howItWorks: [
    {
      step: 1,
      title: "Connect Your CRM",
      description: "Integrate with HubSpot, Salesforce, or Pipedrive.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Engagement Triggers",
      description: "Choose when surveys send: kickoff, milestone, close.",
      icon: "Settings",
    },
    {
      step: 3,
      title: "Clients Get Surveyed",
      description: "Professional requests at key engagement moments.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Results Build Reputation",
      description: "Testimonials flow to LinkedIn, Google, and Clutch.",
      icon: "TrendingUp",
    },
  ],
  testimonials: [],
  integrations: [
    { name: "HubSpot", logoUrl: "/integrations/hubspot.svg", category: "CRM" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "Pipedrive", logoUrl: "/integrations/pipedrive.svg", category: "CRM" },
    { name: "Clutch", logoUrl: "/integrations/clutch.svg", category: "Reviews" },
  ],
  guarantees: [
    {
      icon: "Shield",
      title: "Client Confidentiality",
      description: "All feedback is private by default. Client approval required for public use.",
    },
    {
      icon: "Zap",
      title: "Quick Implementation",
      description: "Most firms are live within a week. No lengthy setup process.",
    },
    {
      icon: "Headphones",
      title: "Strategic Support",
      description: "We help you build a reputation strategy, not just collect reviews.",
    },
  ],
  cta: {
    headline: "Turn Results Into Reputation",
    description: "Join consulting firms that use RepWell to showcase their expertise and win new business.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Schedule Demo",
  },
  seo: {
    title: "Reputation Management for Consulting Firms | RepWell",
    description:
      "Capture client testimonials and build your consulting firm's reputation. Case study creation made easy. Free trial available.",
    keywords: [
      "consulting reputation",
      "consultant reviews",
      "B2B testimonials",
      "consulting marketing",
      "client feedback",
    ],
  },
};

/**
 * Map of all industry page configurations
 */
export const industryPageConfigs: Record<IndustryType, IndustryPageConfig> = {
  mortgage: mortgagePageConfig,
  real_estate: realEstatePageConfig,
  insurance: insurancePageConfig,
  financial_advisory: financialAdvisoryPageConfig,
  healthcare: healthcarePageConfig,
  home_services: homeServicesPageConfig,
  legal: legalPageConfig,
  consulting: consultingPageConfig,
};

/**
 * Get page configuration for a specific industry
 */
export function getIndustryPageConfig(industry: IndustryType): IndustryPageConfig {
  return industryPageConfigs[industry];
}

/**
 * Get page configuration by URL slug
 */
export function getIndustryPageConfigBySlug(slug: string): IndustryPageConfig | null {
  const entry = Object.values(industryPageConfigs).find(
    (config) => config.slug === slug
  );
  return entry || null;
}

/**
 * Get all available industry page slugs
 */
export function getAllIndustryPageSlugs(): string[] {
  return Object.values(industryPageConfigs).map((config) => config.slug);
}
