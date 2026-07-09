// Feature-specific landing page content configurations
import type { FeaturePageConfig, FeatureSlug } from "@/lib/features/types";

/**
 * Review Collection feature page configuration
 */
export const reviewsFeatureConfig: FeaturePageConfig = {
  slug: "reviews",
  title: "Review Collection",
  shortTitle: "Reviews",
  icon: "Star",

  hero: {
    badge: "Core Feature",
    title: "Automated Review Collection That ",
    titleAccent: "Actually Works",
    description:
      "Turn happy customer feedback into public reviews with timely automated surveys and intelligent routing to the right channels.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
    stat: { value: "Reviews", label: "More reviews collected" },
  },

  problems: [
    {
      icon: "Clock",
      title: "Manual Follow-Up Takes Forever",
      description:
        "You're spending hours each week chasing customers for reviews. Most never respond, and your time is wasted.",
      stat: { value: "Insights", label: "hours/month wasted" },
    },
    {
      icon: "TrendingDown",
      title: "Low Response Rates",
      description:
        "Email requests get ignored. Phone calls feel pushy. Without the right timing and channel, feedback is easy to miss.",
      stat: { value: "NPS", label: "typical response rate" },
    },
    {
      icon: "MessageSquareOff",
      title: "Happy Customers Stay Silent",
      description:
        "Satisfied customers move on without leaving reviews. Only unhappy ones speak up, skewing your online reputation.",
    },
    {
      icon: "Target",
      title: "Wrong Platform, Wrong Time",
      description:
        "Generic review requests don't work. Customers need the right ask, at the right time, on the right platform.",
    },
  ],

  capabilities: [
    {
      icon: "Zap",
      title: "Trigger-Based Automation",
      description:
        "Surveys send automatically when deals close, appointments end, or custom triggers fire. No manual work required.",
    },
    {
      icon: "MessageSquare",
      title: "Automated Outreach",
      description:
        "Reach customers via email. Smart sequencing with gentle reminders that boost responses without annoying customers.",
    },
    {
      icon: "Route",
      title: "Intelligent Review Routing",
      description:
        "Happy customers get directed to Google, Zillow, or your priority platform. Unhappy ones are routed to private feedback first.",
    },
    {
      icon: "Palette",
      title: "Branded Survey Experience",
      description:
        "Custom branding with your logo, colors, and messaging. Surveys feel like they come from you, not a third party.",
    },
    {
      icon: "Timer",
      title: "Perfect Timing Engine",
      description:
        "Send surveys at optimal moments based on your industry. Post-closing, post-appointment, or custom schedules.",
    },
    {
      icon: "RefreshCw",
      title: "Smart Follow-Up Sequences",
      description:
        "Automatic reminders that feel natural. Spacing and messaging optimized to maximize responses without being pushy.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Connect Your System",
      description:
        "Integrate with your CRM, LOS, or upload customer data. Takes less than 5 minutes.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Set Your Triggers",
      description:
        "Choose when surveys send: deal close, appointment end, or custom events.",
      icon: "Settings",
    },
    {
      step: 3,
      title: "Surveys Send Automatically",
      description:
        "Customers receive perfectly-timed requests via email.",
      icon: "Send",
    },
    {
      step: 4,
      title: "Reviews Flow In",
      description:
        "Happy customers leave reviews on Google and other platforms automatically.",
      icon: "Star",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Build your review profile and generate more referrals",
      benefits: [
        "Automatic survey sending after each closing",
        "Direct routing to Google and Zillow",
        "Personal dashboard tracking your reviews",
        "Social sharing for new testimonials",
      ],
    },
    {
      role: "manager",
      label: "Branch Managers",
      description: "Track team review collection and identify top performers",
      benefits: [
        "Team-wide review volume metrics",
        "Individual team member performance tracking",
        "Automated weekly reports",
        "Coaching insights from review trends",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Scale review collection across your organization",
      benefits: [
        "Multi-branch rollup dashboards",
        "CRM and workflow integrations",
        "Custom branding per branch",
        "Enterprise SSO and security",
      ],
    },
  ],

  integrations: [
    { name: "Encompass", logoUrl: "/integrations/encompass.svg", category: "LOS" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
    { name: "Zillow", logoUrl: "/integrations/zillow.svg", category: "Reviews" },
  ],

  testimonials: [],

  relatedFeatures: ["analytics", "amplification", "surveys"],
  relatedSolutions: ["review-growth", "reputation-management"],

  cta: {
    headline: "Start Collecting Reviews Automatically",
    description:
      "Use RepWell to turn happy customer feedback into public reviews.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },

  seo: {
    title: "Automated Review Collection Software | RepWell",
    description:
      "Collect more reviews with automated surveys and intelligent routing. Free trial available.",
    keywords: [
      "review collection software",
      "automated reviews",
      "google review automation",
      "customer feedback",
      "review management",
    ],
  },
};

/**
 * Analytics & NPS feature page configuration
 */
export const analyticsFeatureConfig: FeaturePageConfig = {
  slug: "analytics",
  title: "Analytics & NPS",
  shortTitle: "Analytics",
  icon: "BarChart3",

  hero: {
    badge: "Data-Driven Insights",
    title: "Real-Time Analytics That ",
    titleAccent: "Drive Growth",
    description:
      "Track NPS, satisfaction trends, and team performance with live dashboards. Know exactly how customers feel and where to improve.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Demo",
    stat: { value: "AI", label: "Feedback visibility" },
  },

  problems: [
    {
      icon: "EyeOff",
      title: "Flying Blind",
      description:
        "You have no idea what customers really think until something goes wrong. Satisfaction data is scattered or nonexistent.",
    },
    {
      icon: "Clock",
      title: "Delayed Insights",
      description:
        "Monthly reports are stale by the time you see them. You need real-time visibility to act fast.",
      stat: { value: "Insights", label: "days delayed" },
    },
    {
      icon: "Users",
      title: "Team Blind Spots",
      description:
        "Can't identify which team members excel and which need coaching without customer feedback data.",
    },
    {
      icon: "TrendingDown",
      title: "Missing Trends",
      description:
        "Satisfaction is declining but you don't see it until customers are already leaving.",
    },
  ],

  capabilities: [
    {
      icon: "Activity",
      title: "Live NPS Dashboard",
      description:
        "Real-time Net Promoter Score tracking across your entire organization. See trends as they happen, not months later.",
    },
    {
      icon: "Users",
      title: "Team Performance Metrics",
      description:
        "Track satisfaction by team member, branch, or region. Identify top performers and coaching opportunities.",
    },
    {
      icon: "TrendingUp",
      title: "Trend Analysis",
      description:
        "Visualize satisfaction trends over time. Spot improvements and declines before they impact your business.",
    },
    {
      icon: "FileText",
      title: "Automated Reports",
      description:
        "Weekly and monthly reports delivered to your inbox. Share with stakeholders automatically.",
    },
    {
      icon: "AlertTriangle",
      title: "At-Risk Alerts",
      description:
        "Get notified immediately when customers express dissatisfaction. Recover relationships before they leave.",
    },
    {
      icon: "BarChart",
      title: "Benchmark Comparisons",
      description:
        "Compare your metrics against industry benchmarks. Know where you stand and where to improve.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Collect Feedback",
      description:
        "Surveys capture customer satisfaction automatically after each interaction.",
      icon: "MessageSquare",
    },
    {
      step: 2,
      title: "Data Flows In",
      description:
        "Responses populate your dashboard in real-time. No manual data entry.",
      icon: "Database",
    },
    {
      step: 3,
      title: "Insights Emerge",
      description:
        "AI identifies trends, highlights concerns, and surfaces opportunities.",
      icon: "Lightbulb",
    },
    {
      step: 4,
      title: "Act Quickly",
      description:
        "Use insights to improve service, coach teams, and retain customers.",
      icon: "Zap",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Track your personal performance and client satisfaction",
      benefits: [
        "Personal NPS and satisfaction scores",
        "Response rate tracking",
        "Peer comparison benchmarks",
        "Growth trends over time",
      ],
    },
    {
      role: "manager",
      label: "Branch Managers",
      description: "Monitor team performance and drive accountability",
      benefits: [
        "Team leaderboards and rankings",
        "Individual performance drilling",
        "Branch vs branch comparisons",
        "Coaching insights from data",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Organization-wide visibility and reporting",
      benefits: [
        "Multi-branch rollup dashboards",
        "Executive summary reports",
        "Custom metric tracking",
        "API access for BI tools",
      ],
    },
  ],

  integrations: [
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "HubSpot", logoUrl: "/integrations/hubspot.svg", category: "CRM" },
    { name: "Tableau", logoUrl: "/integrations/tableau.svg", category: "BI" },
    { name: "Power BI", logoUrl: "/integrations/powerbi.svg", category: "BI" },
  ],

  testimonials: [],

  relatedFeatures: ["reviews", "ai-insights", "surveys"],
  relatedSolutions: ["customer-intelligence", "team-performance"],

  cta: {
    headline: "Get Real-Time Visibility Into Customer Satisfaction",
    description:
      "Stop guessing how customers feel. Start making data-driven decisions with RepWell Analytics.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Demo",
  },

  seo: {
    title: "Customer Analytics & NPS Tracking | RepWell",
    description:
      "Real-time NPS dashboards and customer satisfaction analytics. Track team performance and identify trends. Free trial available.",
    keywords: [
      "NPS tracking software",
      "customer analytics",
      "satisfaction dashboard",
      "team performance tracking",
      "customer feedback analytics",
    ],
  },
};

/**
 * AI Insights feature page configuration
 */
export const aiInsightsFeatureConfig: FeaturePageConfig = {
  slug: "ai-insights",
  title: "AI Insights",
  shortTitle: "AI",
  icon: "Brain",

  hero: {
    badge: "AI-Powered",
    title: "AI That Understands What ",
    titleAccent: "Customers Really Mean",
    description:
      "Automatic sentiment analysis, key phrase extraction, and response suggestions. Turn raw feedback into actionable insights instantly.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See AI in Action",
    stat: { value: "AI", label: "Sentiment insights" },
  },

  problems: [
    {
      icon: "FileSearch",
      title: "Buried Insights",
      description:
        "Customer feedback is full of valuable information, but manually reading every response is impossible at scale.",
    },
    {
      icon: "Clock",
      title: "Slow Analysis",
      description:
        "By the time you analyze feedback trends, the issues have already caused damage.",
      stat: { value: "Hours", label: "to analyze manually" },
    },
    {
      icon: "MessageSquare",
      title: "Response Paralysis",
      description:
        "You know you should respond to reviews, but crafting the right message takes too long.",
    },
    {
      icon: "TrendingDown",
      title: "Hidden Patterns",
      description:
        "Common themes and recurring issues hide in plain sight across customer responses.",
    },
  ],

  capabilities: [
    {
      icon: "Brain",
      title: "Automatic Sentiment Analysis",
      description:
        "Every review and survey response is automatically scored for sentiment. Know instantly if feedback is positive, negative, or neutral.",
    },
    {
      icon: "Tags",
      title: "Key Phrase Extraction",
      description:
        "AI identifies the most important themes and topics across all feedback. See what customers talk about most.",
    },
    {
      icon: "MessageCircle",
      title: "AI Response Suggestions",
      description:
        "Get contextual response suggestions for reviews. Personalized, professional replies in seconds, not minutes.",
    },
    {
      icon: "AlertTriangle",
      title: "Negative Feedback Alerts",
      description:
        "Get notified immediately when AI detects strongly negative sentiment. Intervene before issues escalate.",
    },
    {
      icon: "TrendingUp",
      title: "Trend Detection",
      description:
        "AI spots emerging patterns across your feedback. Know when new issues are developing before they become widespread.",
    },
    {
      icon: "Target",
      title: "Topic Clustering",
      description:
        "Feedback automatically grouped by topic. See all comments about pricing, communication, speed, and more in one view.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Feedback Collected",
      description:
        "Surveys and reviews flow into RepWell from all channels.",
      icon: "Inbox",
    },
    {
      step: 2,
      title: "AI Processes",
      description:
        "Our AI analyzes sentiment, extracts key phrases, and identifies topics.",
      icon: "Brain",
    },
    {
      step: 3,
      title: "Insights Delivered",
      description:
        "See sentiment scores, theme trends, and topic clusters on your dashboard.",
      icon: "Lightbulb",
    },
    {
      step: 4,
      title: "Take Action",
      description:
        "Use AI-suggested responses and insights to improve customer experience.",
      icon: "Zap",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Understand client feedback and respond quickly",
      benefits: [
        "Instant sentiment on each response",
        "AI-generated reply suggestions",
        "Key phrase highlights",
        "Personal feedback themes",
      ],
    },
    {
      role: "manager",
      label: "Managers",
      description: "Spot trends and coach teams with data",
      benefits: [
        "Team-wide sentiment tracking",
        "Topic trend analysis",
        "Coaching recommendations",
        "Early warning for issues",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Organization-wide intelligence at scale",
      benefits: [
        "Multi-location sentiment analysis",
        "Executive insight summaries",
        "Custom AI model training",
        "API access for integrations",
      ],
    },
  ],

  integrations: [
    { name: "Slack", logoUrl: "/integrations/slack.svg", category: "Communication" },
    { name: "Zendesk", logoUrl: "/integrations/zendesk.svg", category: "Support" },
  ],

  testimonials: [],

  relatedFeatures: ["analytics", "reviews", "surveys"],
  relatedSolutions: ["customer-intelligence"],

  cta: {
    headline: "Let AI Turn Feedback Into Action",
    description:
      "Stop manually analyzing reviews. Let AI surface the insights that matter most.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See AI Demo",
  },

  seo: {
    title: "AI-Powered Review Insights & Sentiment Analysis | RepWell",
    description:
      "Automatic sentiment analysis and key phrase extraction for customer feedback. AI-generated response suggestions. Free trial.",
    keywords: [
      "AI sentiment analysis",
      "review insights",
      "feedback analytics",
      "NLP customer feedback",
      "AI response suggestions",
    ],
  },
};

/**
 * Reputation Amplification feature page configuration
 */
export const amplificationFeatureConfig: FeaturePageConfig = {
  slug: "amplification",
  title: "Reputation Amplification",
  shortTitle: "Amplify",
  icon: "Zap",

  hero: {
    badge: "Maximize Impact",
    title: "Amplify Your Reviews ",
    titleAccent: "Everywhere That Matters",
    description:
      "Route positive reviews to Google and industry platforms. Share testimonials on social media. Turn happy customers into your marketing engine.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See How It Works",
    stat: { value: "Reviews", label: "Review visibility" },
  },

  problems: [
    {
      icon: "EyeOff",
      title: "Great Reviews Go Unseen",
      description:
        "Positive feedback sits in your inbox or survey tool. It never makes it to Google where prospects actually look.",
    },
    {
      icon: "Clock",
      title: "Manual Publishing Takes Forever",
      description:
        "Creating social posts from testimonials, asking customers to copy reviews to other platforms - it's a full-time job.",
    },
    {
      icon: "Target",
      title: "Wrong Platforms",
      description:
        "Reviews end up scattered across platforms that don't matter instead of concentrated where prospects search.",
    },
    {
      icon: "Users",
      title: "Wasted Social Proof",
      description:
        "Amazing client stories never get shared. Video testimonials collect dust. Social media stays silent.",
    },
  ],

  capabilities: [
    {
      icon: "Route",
      title: "Smart Review Routing",
      description:
        "Automatically direct happy customers to leave reviews on Google, Zillow, Yelp, or your priority platform.",
    },
    {
      icon: "Share2",
      title: "One-Click Social Sharing",
      description:
        "Turn testimonials into social media posts with one click. Pre-formatted for LinkedIn, Facebook, Twitter, and Instagram.",
    },
    {
      icon: "Video",
      title: "Video Testimonial Capture",
      description:
        "Request and collect video testimonials directly through RepWell. Easy for customers, powerful for you.",
    },
    {
      icon: "Layout",
      title: "Website Widgets",
      description:
        "Embed review carousels, testimonial walls, and rating badges on your website. Auto-updating content.",
    },
    {
      icon: "Star",
      title: "Google Business Integration",
      description:
        "Deep integration with Google Business Profile. Request reviews, respond to reviews, and track your rating.",
    },
    {
      icon: "MessageSquare",
      title: "Review Response Templates",
      description:
        "Professional response templates for every scenario. Respond to reviews quickly and consistently.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Customer Completes Survey",
      description:
        "After a positive experience, customer shares their feedback.",
      icon: "CheckCircle",
    },
    {
      step: 2,
      title: "Routing Logic Kicks In",
      description:
        "Happy customers see links to leave reviews on Google and other platforms.",
      icon: "GitBranch",
    },
    {
      step: 3,
      title: "Reviews Get Published",
      description:
        "One click takes them to the right platform with context pre-loaded.",
      icon: "Star",
    },
    {
      step: 4,
      title: "Amplify Everywhere",
      description:
        "Share to social media, embed on website, and maximize visibility.",
      icon: "Megaphone",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Build your personal online presence",
      benefits: [
        "Direct routing to your Google profile",
        "Social media content generation",
        "Video testimonial requests",
        "Personal website widgets",
      ],
    },
    {
      role: "manager",
      label: "Managers",
      description: "Amplify team success",
      benefits: [
        "Branch-wide review campaigns",
        "Top performer spotlight sharing",
        "Team testimonial collections",
        "Coordinated social strategy",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Orchestrated reputation building",
      benefits: [
        "Multi-location Google management",
        "Brand-approved templates",
        "Centralized social publishing",
        "API for marketing automation",
      ],
    },
  ],

  integrations: [
    { name: "Google Business", logoUrl: "/integrations/google.svg", category: "Reviews" },
    { name: "Zillow", logoUrl: "/integrations/zillow.svg", category: "Reviews" },
    { name: "Facebook", logoUrl: "/integrations/facebook.svg", category: "Social" },
    { name: "LinkedIn", logoUrl: "/integrations/linkedin.svg", category: "Social" },
  ],

  testimonials: [],

  relatedFeatures: ["reviews", "testimonials", "analytics"],
  relatedSolutions: ["reputation-management", "review-growth"],

  cta: {
    headline: "Turn Reviews Into Your Marketing Engine",
    description:
      "Stop letting great feedback go to waste. Amplify your reputation everywhere prospects look.",
    primaryCta: "Start Free Trial",
    secondaryCta: "Book a Demo",
  },

  seo: {
    title: "Reputation Amplification & Review Marketing | RepWell",
    description:
      "Route reviews to Google, share on social media, and build your online presence. Video testimonial capture included. Free trial.",
    keywords: [
      "review marketing",
      "reputation amplification",
      "google review routing",
      "social proof marketing",
      "video testimonials",
    ],
  },
};

/**
 * Survey Management feature page configuration
 */
export const surveysFeatureConfig: FeaturePageConfig = {
  slug: "surveys",
  title: "Survey Management",
  shortTitle: "Surveys",
  icon: "Send",

  hero: {
    badge: "Flexible & Powerful",
    title: "Surveys That Get ",
    titleAccent: "Responses",
    description:
      "Custom survey templates, automated distribution, and smart follow-ups. Capture the feedback you need with surveys customers actually complete.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Templates",
    stat: { value: "NPS", label: "Survey workflows" },
  },

  problems: [
    {
      icon: "XCircle",
      title: "Low Completion Rates",
      description:
        "Long surveys with too many questions frustrate customers. They abandon halfway through or don't start at all.",
      stat: { value: "Insights", label: "typical completion" },
    },
    {
      icon: "FileX",
      title: "Generic Questions",
      description:
        "One-size-fits-all surveys miss the nuance. Industry-specific questions get better, more actionable responses.",
    },
    {
      icon: "Mail",
      title: "Single Channel Limits Reach",
      description:
        "Well-timed, automated email surveys maximize response rates without extra manual work.",
    },
    {
      icon: "Clock",
      title: "Wrong Timing",
      description:
        "Surveys sent too late miss the window when experience is fresh. Timing is everything for response rates.",
    },
  ],

  capabilities: [
    {
      icon: "FileText",
      title: "Industry-Specific Templates",
      description:
        "Pre-built templates for client services, real estate, insurance, and more. Proven questions that get actionable responses.",
    },
    {
      icon: "Settings",
      title: "Custom Survey Builder",
      description:
        "Create your own surveys with drag-and-drop simplicity. Multiple question types, logic branching, and personalization.",
    },
    {
      icon: "Smartphone",
      title: "Smart Distribution",
      description:
        "Send surveys via email. Smart sequencing ensures maximum reach without over-messaging.",
    },
    {
      icon: "Timer",
      title: "Intelligent Timing",
      description:
        "Schedule surveys to send at optimal times based on your industry and customer behavior patterns.",
    },
    {
      icon: "RefreshCw",
      title: "Automated Follow-Ups",
      description:
        "Gentle reminders for non-responders. Customizable intervals and messaging that boost completion rates.",
    },
    {
      icon: "Palette",
      title: "Full Branding Control",
      description:
        "Your logo, colors, and messaging. Surveys look like they come from you, building trust and response rates.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Choose or Build",
      description:
        "Start with an industry template or build a custom survey from scratch.",
      icon: "FileText",
    },
    {
      step: 2,
      title: "Brand & Personalize",
      description:
        "Add your logo, customize questions, and set up personalization tokens.",
      icon: "Palette",
    },
    {
      step: 3,
      title: "Set Distribution",
      description:
        "Choose channels, timing, and automation rules for sending.",
      icon: "Settings",
    },
    {
      step: 4,
      title: "Collect & Analyze",
      description:
        "Responses flow in automatically. AI analyzes and highlights insights.",
      icon: "BarChart",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Personal survey distribution and feedback",
      benefits: [
        "Pre-built client services survey templates",
        "Automatic sending after closings",
        "Personal branding on surveys",
        "Mobile-friendly completion",
      ],
    },
    {
      role: "manager",
      label: "Managers",
      description: "Team survey management and insights",
      benefits: [
        "Branch-wide survey campaigns",
        "Response rate tracking by professional",
        "Template management and approval",
        "Aggregate response analysis",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Organization-wide survey programs",
      benefits: [
        "Multi-brand survey templates",
        "Compliance-approved questions",
        "Advanced branching logic",
        "API for custom integrations",
      ],
    },
  ],

  integrations: [
    { name: "Encompass", logoUrl: "/integrations/encompass.svg", category: "LOS" },
    { name: "Salesforce", logoUrl: "/integrations/salesforce.svg", category: "CRM" },
    { name: "SendGrid", logoUrl: "/integrations/sendgrid.svg", category: "Email" },
  ],

  testimonials: [],

  relatedFeatures: ["reviews", "analytics", "ai-insights"],
  relatedSolutions: ["customer-intelligence"],

  cta: {
    headline: "Surveys That Actually Get Completed",
    description:
      "Stop sending surveys into the void. Start capturing meaningful feedback with response rates that matter.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Templates",
  },

  seo: {
    title: "Customer Survey Software & Templates | RepWell",
    description:
      "Industry-specific survey templates with automated email distribution. Free trial available.",
    keywords: [
      "customer survey software",
      "survey templates",
      "feedback collection",
      "NPS surveys",
    ],
  },
};

/**
 * Testimonial Capture feature page configuration
 */
export const testimonialsFeatureConfig: FeaturePageConfig = {
  slug: "testimonials",
  title: "Testimonial Capture",
  shortTitle: "Testimonials",
  icon: "Video",

  hero: {
    badge: "Video & Written",
    title: "Capture Testimonials That ",
    titleAccent: "Close Deals",
    description:
      "Request, collect, and publish video and written testimonials with ease. Turn happy customers into your best salespeople.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Examples",
    stat: { value: "Convert", label: "Higher conversion with video" },
  },

  problems: [
    {
      icon: "Video",
      title: "Video Feels Too Hard",
      description:
        "Customers want to help but recording a video feels complicated. They need a simple, guided experience.",
    },
    {
      icon: "FileX",
      title: "Great Stories Go Uncaptured",
      description:
        "Amazing success stories happen every day but you're too busy to document them before memory fades.",
    },
    {
      icon: "FolderSearch",
      title: "Testimonials Get Lost",
      description:
        "Written testimonials scatter across emails, texts, and surveys. Video files sit on random hard drives.",
    },
    {
      icon: "Clock",
      title: "Publishing Takes Forever",
      description:
        "Editing video, getting approval, posting to social - the process takes hours for each testimonial.",
    },
  ],

  capabilities: [
    {
      icon: "Video",
      title: "One-Click Video Requests",
      description:
        "Send customers a simple link. They record from their phone or computer with guided prompts. No app needed.",
    },
    {
      icon: "FileText",
      title: "Written Testimonial Collection",
      description:
        "Capture written testimonials with structured questions. Get the quotes you need for marketing.",
    },
    {
      icon: "FolderOpen",
      title: "Centralized Library",
      description:
        "All testimonials organized in one place. Search, filter, and find the perfect story for any use case.",
    },
    {
      icon: "Wand2",
      title: "Simple Editing Tools",
      description:
        "Trim videos, add captions, and apply branding without professional editing software.",
    },
    {
      icon: "Share2",
      title: "One-Click Publishing",
      description:
        "Publish to social media, embed on your website, or download for other uses with a single click.",
    },
    {
      icon: "CheckSquare",
      title: "Approval Workflows",
      description:
        "Get customer approval and compliance sign-off before publishing. Consent tracking built in.",
    },
  ],

  howItWorks: [
    {
      step: 1,
      title: "Send Request",
      description:
        "One click sends a testimonial request via email.",
      icon: "Send",
    },
    {
      step: 2,
      title: "Customer Records",
      description:
        "Guided prompts help them share their story in video or written form.",
      icon: "Video",
    },
    {
      step: 3,
      title: "Review & Edit",
      description:
        "You review, make light edits, and get approval if needed.",
      icon: "Edit",
    },
    {
      step: 4,
      title: "Publish Everywhere",
      description:
        "Share to social, embed on website, or use in marketing materials.",
      icon: "Share2",
    },
  ],

  useCases: [
    {
      role: "user",
      label: "Professionals",
      description: "Build your personal testimonial library",
      benefits: [
        "Easy video testimonial requests",
        "Personal testimonial page",
        "Social media sharing",
        "LinkedIn integration",
      ],
    },
    {
      role: "manager",
      label: "Managers",
      description: "Curate team testimonials and success stories",
      benefits: [
        "Team-wide testimonial collection",
        "Top performer spotlights",
        "Brand-approved templates",
        "Usage tracking and analytics",
      ],
    },
    {
      role: "enterprise",
      label: "Enterprise",
      description: "Scalable testimonial program management",
      benefits: [
        "Multi-location testimonial library",
        "Compliance approval workflows",
        "Advanced editing and branding",
        "API for marketing automation",
      ],
    },
  ],

  integrations: [
    { name: "YouTube", logoUrl: "/integrations/youtube.svg", category: "Video" },
    { name: "Vimeo", logoUrl: "/integrations/vimeo.svg", category: "Video" },
    { name: "LinkedIn", logoUrl: "/integrations/linkedin.svg", category: "Social" },
    { name: "Facebook", logoUrl: "/integrations/facebook.svg", category: "Social" },
  ],

  testimonials: [],

  relatedFeatures: ["reviews", "amplification", "surveys"],
  relatedSolutions: ["review-growth"],

  cta: {
    headline: "Start Collecting Powerful Testimonials",
    description:
      "Turn happy customers into your best marketing asset with video and written testimonials.",
    primaryCta: "Start Free Trial",
    secondaryCta: "See Examples",
  },

  seo: {
    title: "Video & Written Testimonial Collection Software | RepWell",
    description:
      "Easy video testimonial requests and written testimonial collection. Publish to social with one click. Free trial available.",
    keywords: [
      "video testimonials",
      "testimonial software",
      "customer testimonials",
      "video marketing",
      "social proof",
    ],
  },
};

/**
 * Map of all feature page configurations
 */
export const featurePageConfigs: Record<FeatureSlug, FeaturePageConfig> = {
  reviews: reviewsFeatureConfig,
  analytics: analyticsFeatureConfig,
  "ai-insights": aiInsightsFeatureConfig,
  amplification: amplificationFeatureConfig,
  surveys: surveysFeatureConfig,
  testimonials: testimonialsFeatureConfig,
};

/**
 * Get page configuration for a specific feature
 */
export function getFeaturePageConfig(slug: FeatureSlug): FeaturePageConfig {
  return featurePageConfigs[slug];
}

/**
 * Get page configuration by URL slug
 */
export function getFeaturePageConfigBySlug(slug: string): FeaturePageConfig | null {
  const entry = Object.values(featurePageConfigs).find(
    (config) => config.slug === slug
  );
  return entry || null;
}

/**
 * Get all available feature page slugs
 */
export function getAllFeaturePageSlugs(): string[] {
  return Object.values(featurePageConfigs).map((config) => config.slug);
}
