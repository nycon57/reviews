// Solution-specific landing page content configurations
// Following pain-solution-impact framework
import type { SolutionPageConfig, SolutionSlug } from "@/lib/solutions/types";

/**
 * Review Growth solution page configuration
 */
export const reviewGrowthSolutionConfig: SolutionPageConfig = {
  slug: "review-growth",
  title: "Grow Review Volume",
  shortTitle: "Review Growth",
  icon: "TrendingUp",

  hero: {
    badge: "Grow Your Reviews",
    title: "Turn Every Happy Customer Into a ",
    titleAccent: "5-Star Review",
    description:
      "Stop leaving reviews on the table. RepWell's automation ensures every satisfied customer has the chance to share their experience on Google and beyond.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See How It Works",
  },

  challenges: [
    {
      icon: "Clock",
      title: "No Time for Manual Follow-Up",
      description:
        "You're too busy serving customers to chase them for reviews. Manual requests fall through the cracks.",
    },
    {
      icon: "TrendingDown",
      title: "Competitors Have More Reviews",
      description:
        "Other businesses in your market are building massive review profiles while you're stuck with a handful.",
    },
    {
      icon: "MessageSquareOff",
      title: "Happy Customers Stay Silent",
      description:
        "Satisfied customers move on without leaving feedback. Only unhappy ones speak up, skewing your online reputation.",
    },
    {
      icon: "BarChart2",
      title: "Can't Measure Progress",
      description:
        "Without a system, you don't know if you're improving or how you compare to competitors.",
    },
  ],

  approaches: [
    {
      icon: "Zap",
      title: "Automated Survey Triggers",
      description:
        "Surveys send automatically when deals close, appointments end, or custom triggers fire. No manual work required.",
      features: ["CRM/workflow integration", "Custom triggers", "Perfect timing"],
    },
    {
      icon: "Route",
      title: "Intelligent Review Routing",
      description:
        "Happy customers get directed straight to Google, Zillow, or your priority platform with one click.",
      features: ["Platform prioritization", "One-click links", "Smart routing"],
    },
    {
      icon: "RefreshCw",
      title: "Smart Follow-Up Sequences",
      description:
        "Gentle reminders for non-responders maximize completions without annoying customers.",
      features: ["Optimized spacing", "Email delivery", "Auto-stop on response"],
    },
    {
      icon: "Smartphone",
      title: "Automated Outreach",
      description:
        "Reach customers via email. Meet them where they prefer to engage.",
      features: ["Email", "Mobile-optimized", "Personalized content"],
    },
  ],

  impacts: [
    {
      value: "Reviews",
      label: "More Reviews",
      description: "Average increase in review volume within 6 months",
      icon: "Star",
    },
    {
      value: "NPS",
      label: "Survey Workflows",
      description: "Survey completion visibility from automated outreach",
      icon: "MessageSquare",
    },
    {
      value: "Reviews",
      label: "Review Monitoring",
      description: "Average Google rating across our customers",
      icon: "TrendingUp",
    },
    {
      value: "Fast",
      label: "Time to Value",
      description: "Most customers get their first automated review within 2 days",
      icon: "Clock",
    },
  ],

  features: [
    {
      slug: "reviews",
      title: "Review Collection",
      contribution: "Automated surveys and intelligent routing to Google and other platforms",
      icon: "Star",
    },
    {
      slug: "surveys",
      title: "Survey Management",
      contribution: "Industry-specific templates with automated email distribution",
      icon: "Send",
    },
    {
      slug: "analytics",
      title: "Analytics & NPS",
      contribution: "Track review volume, response rates, and team performance",
      icon: "BarChart3",
    },
    {
      slug: "amplification",
      title: "Reputation Amplification",
      contribution: "Share reviews on social media and embed on your website",
      icon: "Zap",
    },
  ],

  industryApps: [
    {
      industry: "Financial Advisory",
      slug: "financial-advisory",
      application: "Automated post-engagement surveys help advisors collect timely Google reviews",
      icon: "Briefcase",
    },
    {
      industry: "Real Estate",
      slug: "real-estate",
      application: "Post-closing automation builds agent profiles on Zillow and Google",
      icon: "Building2",
    },
    {
      industry: "Insurance",
      slug: "insurance",
      application: "Policy and claims surveys capture satisfaction at key moments",
      icon: "Shield",
    },
    {
      industry: "Healthcare",
      slug: "healthcare",
      application: "HIPAA-compliant post-visit surveys build Healthgrades presence",
      icon: "Heart",
    },
  ],

  successStories: [],

  gettingStarted: [
    {
      step: 1,
      title: "Connect Your System",
      description: "Integrate with your CRM, LOS, or upload customer data. Takes less than 5 minutes.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Customize Your Surveys",
      description: "Brand your surveys, choose platforms, and set timing preferences.",
      icon: "Settings",
    },
    {
      step: 3,
      title: "Watch Reviews Grow",
      description: "Surveys send automatically and reviews start flowing to Google and beyond.",
      icon: "TrendingUp",
    },
  ],

  cta: {
    headline: "Ready to Grow Your Reviews?",
    description:
      "Use RepWell to turn happy customer feedback into public reviews.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },

  seo: {
    title: "Grow Review Volume | Review Growth Solution | RepWell",
    description:
      "Grow your Google reviews with automated collection and intelligent routing. Free trial available.",
    keywords: [
      "grow reviews",
      "increase google reviews",
      "review automation",
      "get more reviews",
      "review growth strategy",
    ],
  },
};

/**
 * Reputation Management solution page configuration
 */
export const reputationManagementSolutionConfig: SolutionPageConfig = {
  slug: "reputation-management",
  title: "Reputation Management",
  shortTitle: "Reputation",
  icon: "Shield",

  hero: {
    badge: "Unified Visibility",
    title: "See and Manage Your Reputation ",
    titleAccent: "In One Place",
    description:
      "Scattered feedback across platforms makes reputation management impossible. RepWell brings everything together so you can protect and grow your brand.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Dashboard",
  },

  challenges: [
    {
      icon: "Layers",
      title: "Feedback Is Everywhere",
      description:
        "Reviews on Google, Zillow, Facebook, surveys in email, complaints on social - tracking it all is overwhelming.",
    },
    {
      icon: "EyeOff",
      title: "Negative Reviews Slip Through",
      description:
        "Without monitoring, unhappy customers post publicly before you can address their concerns.",
    },
    {
      icon: "Clock",
      title: "Slow Response Times",
      description:
        "By the time you find reviews to respond to, opportunities to recover relationships have passed.",
    },
    {
      icon: "BarChart",
      title: "No Unified View",
      description:
        "You can't see overall reputation health without logging into multiple platforms.",
    },
  ],

  approaches: [
    {
      icon: "Database",
      title: "Centralized Dashboard",
      description:
        "All reviews, surveys, and feedback in one unified view. Monitor Google, Zillow, surveys, and more from a single screen.",
      features: ["Multi-platform aggregation", "Real-time updates", "Unified inbox"],
    },
    {
      icon: "Bell",
      title: "Instant Alerts",
      description:
        "Get notified immediately when new reviews come in or sentiment drops. Never miss negative feedback.",
      features: ["Email alerts", "Sentiment triggers", "Customizable rules"],
    },
    {
      icon: "MessageCircle",
      title: "Response Management",
      description:
        "Respond to reviews across platforms from one place. Templates and AI suggestions speed your replies.",
      features: ["Response templates", "AI suggestions", "Cross-platform posting"],
    },
    {
      icon: "TrendingUp",
      title: "Reputation Tracking",
      description:
        "Track your overall rating, review volume, and sentiment trends over time. Know if you're improving.",
      features: ["Rating trends", "Sentiment analysis", "Competitor benchmarks"],
    },
  ],

  impacts: [
    {
      value: "NPS",
      label: "Response Time",
      description: "Average time to respond to reviews with instant alerts",
      icon: "Clock",
    },
    {
      value: "AI",
      label: "Issue Resolution",
      description: "Issues resolved before negative public reviews",
      icon: "CheckCircle",
    },
    {
      value: "Visible",
      label: "Visibility",
      description: "Complete view of reputation across all platforms",
      icon: "Eye",
    },
    {
      value: "Reviews",
      label: "Rating Improvement",
      description: "Average Google rating improvement in first year",
      icon: "Star",
    },
  ],

  features: [
    {
      slug: "reviews",
      title: "Review Collection",
      contribution: "Proactive collection builds positive review volume to outweigh negatives",
      icon: "Star",
    },
    {
      slug: "analytics",
      title: "Analytics & NPS",
      contribution: "Track reputation metrics and trends across all platforms",
      icon: "BarChart3",
    },
    {
      slug: "ai-insights",
      title: "AI Insights",
      contribution: "Sentiment analysis identifies issues and suggests responses",
      icon: "Brain",
    },
    {
      slug: "amplification",
      title: "Reputation Amplification",
      contribution: "Publish positive testimonials to offset negative feedback",
      icon: "Zap",
    },
  ],

  industryApps: [
    {
      industry: "Financial Advisory",
      slug: "financial-advisory",
      application: "Monitor Google reviews and client feedback from one dashboard",
      icon: "Briefcase",
    },
    {
      industry: "Healthcare",
      slug: "healthcare",
      application: "HIPAA-compliant monitoring of Healthgrades, Google, and patient feedback",
      icon: "Heart",
    },
    {
      industry: "Legal",
      slug: "legal",
      application: "Track Avvo, Google, and Martindale reviews with ethics-compliant responses",
      icon: "Scale",
    },
    {
      industry: "Home Services",
      slug: "home-services",
      application: "Monitor Google, Yelp, and Angi reviews from one place",
      icon: "Wrench",
    },
  ],

  successStories: [],

  gettingStarted: [
    {
      step: 1,
      title: "Connect Your Platforms",
      description: "Link Google, Zillow, and other review platforms. Takes minutes.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Alert Preferences",
      description: "Choose how and when you want to be notified about new reviews.",
      icon: "Bell",
    },
    {
      step: 3,
      title: "Monitor & Respond",
      description: "See all feedback in one place and respond quickly from your dashboard.",
      icon: "Shield",
    },
  ],

  cta: {
    headline: "Take Control of Your Reputation",
    description:
      "Stop letting feedback slip through the cracks. Get unified visibility with RepWell.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },

  seo: {
    title: "Reputation Management Solution | Unified Monitoring | RepWell",
    description:
      "Monitor and manage your online reputation from one dashboard. Instant alerts, response templates, and sentiment tracking. Free trial.",
    keywords: [
      "reputation management",
      "review monitoring",
      "online reputation",
      "review response",
      "brand management",
    ],
  },
};

/**
 * Customer Intelligence solution page configuration
 */
export const customerIntelligenceSolutionConfig: SolutionPageConfig = {
  slug: "customer-intelligence",
  title: "Customer Intelligence",
  shortTitle: "Intelligence",
  icon: "Lightbulb",

  hero: {
    badge: "AI-Powered Insights",
    title: "Turn Feedback Into ",
    titleAccent: "Actionable Intelligence",
    description:
      "Customer feedback is a goldmine of insights - if you can extract them. RepWell's AI analyzes every response to surface the patterns and opportunities you'd otherwise miss.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See AI in Action",
  },

  challenges: [
    {
      icon: "FileSearch",
      title: "Insights Buried in Data",
      description:
        "Hundreds of survey responses and reviews contain valuable insights, but manually reading them all is impossible.",
    },
    {
      icon: "Clock",
      title: "Analysis Takes Too Long",
      description:
        "By the time you spot trends in feedback, the issues have already caused damage.",
    },
    {
      icon: "TrendingDown",
      title: "Hidden Patterns",
      description:
        "Recurring themes and emerging issues hide across customer responses. RepWell helps surface the signals.",
    },
    {
      icon: "Target",
      title: "No Actionable Recommendations",
      description:
        "Even when you spot problems, knowing what to do about them isn't obvious from raw feedback.",
    },
  ],

  approaches: [
    {
      icon: "Brain",
      title: "AI Sentiment Analysis",
      description:
        "Every review and survey response automatically scored for sentiment. Know instantly how customers feel.",
      features: ["Automatic scoring", "Real-time processing", "High accuracy"],
    },
    {
      icon: "Tags",
      title: "Theme Extraction",
      description:
        "AI identifies the most important themes and topics across all feedback. See what matters most to customers.",
      features: ["Key phrase detection", "Topic clustering", "Trend tracking"],
    },
    {
      icon: "AlertTriangle",
      title: "Early Warning System",
      description:
        "Get alerted when sentiment drops or new issues emerge. Address problems before they escalate.",
      features: ["Anomaly detection", "Trend alerts", "Proactive notifications"],
    },
    {
      icon: "Lightbulb",
      title: "Actionable Recommendations",
      description:
        "AI suggests specific actions based on feedback patterns. Know what to fix and why it matters.",
      features: ["Prioritized recommendations", "Impact estimates", "Action tracking"],
    },
  ],

  impacts: [
    {
      value: "Instant",
      label: "Analysis",
      description: "Every response analyzed in real-time, not weeks later",
      icon: "Zap",
    },
    {
      value: "AI",
      label: "Accuracy",
      description: "AI sentiment detection accuracy across all feedback",
      icon: "Target",
    },
    {
      value: "Fast",
      label: "Faster Insights",
      description: "Time from feedback to actionable insight",
      icon: "Clock",
    },
    {
      value: "NPS",
      label: "NPS Points",
      description: "Average improvement when acting on AI recommendations",
      icon: "TrendingUp",
    },
  ],

  features: [
    {
      slug: "ai-insights",
      title: "AI Insights",
      contribution: "Sentiment analysis, key phrase extraction, and trend detection",
      icon: "Brain",
    },
    {
      slug: "analytics",
      title: "Analytics & NPS",
      contribution: "Real-time dashboards visualize AI-extracted insights",
      icon: "BarChart3",
    },
    {
      slug: "surveys",
      title: "Survey Management",
      contribution: "Collect the feedback that feeds AI analysis",
      icon: "Send",
    },
    {
      slug: "reviews",
      title: "Review Collection",
      contribution: "Review data combined with surveys for complete picture",
      icon: "Star",
    },
  ],

  industryApps: [
    {
      industry: "Financial Advisory",
      slug: "financial-advisory",
      application: "Identify communication gaps and process improvements from client feedback",
      icon: "Briefcase",
    },
    {
      industry: "Healthcare",
      slug: "healthcare",
      application: "Patient experience analytics with wait time and staff sentiment tracking",
      icon: "Heart",
    },
    {
      industry: "Insurance",
      slug: "insurance",
      application: "Claims experience analysis and retention risk identification",
      icon: "Shield",
    },
    {
      industry: "Consulting",
      slug: "consulting",
      application: "Engagement satisfaction tracking and service improvement insights",
      icon: "Briefcase",
    },
  ],

  successStories: [],

  gettingStarted: [
    {
      step: 1,
      title: "Connect Feedback Sources",
      description: "Link surveys, reviews, and other feedback channels to RepWell.",
      icon: "Link",
    },
    {
      step: 2,
      title: "AI Starts Analyzing",
      description: "Every response is automatically processed for sentiment and themes.",
      icon: "Brain",
    },
    {
      step: 3,
      title: "Act on Insights",
      description: "Follow AI recommendations to improve customer experience.",
      icon: "Lightbulb",
    },
  ],

  cta: {
    headline: "Unlock the Intelligence Hidden in Your Feedback",
    description:
      "Stop guessing what customers think. Let AI turn feedback into actionable intelligence.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See AI Demo",
  },

  seo: {
    title: "Customer Intelligence & AI Insights | RepWell",
    description:
      "AI-powered sentiment analysis and theme extraction for customer feedback. Actionable recommendations in real-time. Free trial.",
    keywords: [
      "customer intelligence",
      "AI feedback analysis",
      "sentiment analysis",
      "customer insights",
      "feedback analytics",
    ],
  },
};

/**
 * Team Performance solution page configuration
 */
export const teamPerformanceSolutionConfig: SolutionPageConfig = {
  slug: "team-performance",
  title: "Team Performance",
  shortTitle: "Performance",
  icon: "Users",

  hero: {
    badge: "Drive Accountability",
    title: "Motivate Your Team With ",
    titleAccent: "Visible Performance",
    description:
      "No more flying blind on team performance. RepWell's leaderboards and metrics create accountability, healthy competition, and a culture of customer excellence.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Leaderboards",
  },

  challenges: [
    {
      icon: "EyeOff",
      title: "No Performance Visibility",
      description:
        "You can't see who's delivering great customer experiences and who needs coaching.",
    },
    {
      icon: "Users",
      title: "Accountability Gap",
      description:
        "Without metrics, customer experience becomes optional. Team members don't prioritize what isn't measured.",
    },
    {
      icon: "Target",
      title: "Can't Identify Top Performers",
      description:
        "Great team members don't get recognized. Struggling ones don't get help. Everyone stays average.",
    },
    {
      icon: "TrendingDown",
      title: "Coaching Without Data",
      description:
        "Managers give feedback based on gut feel, not customer data. Coaching is subjective and inconsistent.",
    },
  ],

  approaches: [
    {
      icon: "Trophy",
      title: "Team Leaderboards",
      description:
        "Real-time rankings based on NPS, review volume, and response rates. Healthy competition drives improvement.",
      features: ["Multiple metrics", "Real-time updates", "Customizable periods"],
    },
    {
      icon: "BarChart3",
      title: "Individual Dashboards",
      description:
        "Each team member sees their own performance metrics, trends, and comparison to peers.",
      features: ["Personal metrics", "Goal tracking", "Trend visualization"],
    },
    {
      icon: "Award",
      title: "Recognition & Rewards",
      description:
        "Celebrate top performers with badges, shoutouts, and integration with your recognition programs.",
      features: ["Achievement badges", "Milestone celebrations", "Custom awards"],
    },
    {
      icon: "Target",
      title: "Performance Coaching",
      description:
        "AI-powered insights help managers coach team members with specific, data-backed recommendations.",
      features: ["Coaching insights", "Action recommendations", "Progress tracking"],
    },
  ],

  impacts: [
    {
      value: "Coaching",
      label: "Performance",
      description: "Average improvement in team customer satisfaction scores",
      icon: "TrendingUp",
    },
    {
      value: "Reviews",
      label: "Review Volume",
      description: "Teams collect more reviews when performance is visible",
      icon: "Star",
    },
    {
      value: "Insights",
      label: "Goal Achievement",
      description: "Team members hit targets when they can track progress",
      icon: "Target",
    },
    {
      value: "Fast",
      label: "Manager Time Saved",
      description: "Weekly time saved on manual performance tracking",
      icon: "Clock",
    },
  ],

  features: [
    {
      slug: "analytics",
      title: "Analytics & NPS",
      contribution: "Individual and team performance metrics with trend tracking",
      icon: "BarChart3",
    },
    {
      slug: "reviews",
      title: "Review Collection",
      contribution: "Track review volume and ratings by team member",
      icon: "Star",
    },
    {
      slug: "surveys",
      title: "Survey Management",
      contribution: "Response rate tracking and attribution to individuals",
      icon: "Send",
    },
    {
      slug: "ai-insights",
      title: "AI Insights",
      contribution: "Coaching recommendations based on feedback patterns",
      icon: "Brain",
    },
  ],

  industryApps: [
    {
      industry: "Financial Advisory",
      slug: "financial-advisory",
      application: "Advisor leaderboards show coaching opportunities and service patterns",
      icon: "Briefcase",
    },
    {
      industry: "Real Estate",
      slug: "real-estate",
      application: "Agent rankings help brokerages identify top performers and coaching needs",
      icon: "Building2",
    },
    {
      industry: "Insurance",
      slug: "insurance",
      application: "Agent performance tracking improves retention and policy satisfaction",
      icon: "Shield",
    },
    {
      industry: "Home Services",
      slug: "home-services",
      application: "Technician leaderboards drive quality and customer satisfaction",
      icon: "Wrench",
    },
  ],

  successStories: [],

  gettingStarted: [
    {
      step: 1,
      title: "Set Up Team Structure",
      description: "Add team members and define reporting relationships.",
      icon: "Users",
    },
    {
      step: 2,
      title: "Connect Feedback Sources",
      description: "Link surveys and reviews so performance attribution works automatically.",
      icon: "Link",
    },
    {
      step: 3,
      title: "Launch Leaderboards",
      description: "Turn on team visibility and watch healthy competition drive improvement.",
      icon: "Trophy",
    },
  ],

  cta: {
    headline: "Build a Culture of Customer Excellence",
    description:
      "Visibility drives accountability. Accountability drives performance. Start measuring what matters.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },

  seo: {
    title: "Team Performance & Leaderboards | RepWell",
    description:
      "Drive team accountability with performance leaderboards and customer satisfaction metrics. Coaching insights included. Free trial.",
    keywords: [
      "team performance",
      "employee leaderboards",
      "customer service metrics",
      "team accountability",
      "performance tracking",
    ],
  },
};

/**
 * Map of all solution page configurations
 */
export const solutionPageConfigs: Record<SolutionSlug, SolutionPageConfig> = {
  "review-growth": reviewGrowthSolutionConfig,
  "reputation-management": reputationManagementSolutionConfig,
  "customer-intelligence": customerIntelligenceSolutionConfig,
  "team-performance": teamPerformanceSolutionConfig,
};

/**
 * Get page configuration for a specific solution
 */
export function getSolutionPageConfig(slug: SolutionSlug): SolutionPageConfig {
  return solutionPageConfigs[slug];
}

/**
 * Get page configuration by URL slug
 */
export function getSolutionPageConfigBySlug(slug: string): SolutionPageConfig | null {
  const entry = Object.values(solutionPageConfigs).find(
    (config) => config.slug === slug
  );
  return entry || null;
}

/**
 * Get all available solution page slugs
 */
export function getAllSolutionPageSlugs(): string[] {
  return Object.values(solutionPageConfigs).map((config) => config.slug);
}
