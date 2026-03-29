// Integration page configurations for all supported integrations

import type {
  IntegrationPageConfig,
  IntegrationSlug,
  IntegrationCategory,
  IntegrationCategoryInfo,
} from "@/lib/integrations/types";

/**
 * Category metadata for filtering and display
 */
export const integrationCategories: IntegrationCategoryInfo[] = [
  { slug: "crm", label: "CRM", icon: "AddressBook" },
  { slug: "reviews", label: "Reviews", icon: "Star" },
  { slug: "social", label: "Social", icon: "ShareNetwork" },
  { slug: "communication", label: "Communication", icon: "ChatCircle" },
  { slug: "automation", label: "Automation", icon: "Lightning" },
  { slug: "los", label: "Loan Origination", icon: "FileText" },
];

/**
 * Salesforce integration configuration
 */
const salesforceConfig: IntegrationPageConfig = {
  slug: "salesforce",
  name: "Salesforce",
  shortDescription:
    "Sync customer data, trigger surveys from deal stages, and push review insights back to your CRM.",
  category: "crm",
  icon: "CloudArrowUp",

  hero: {
    headline: "Connect RepWell with Salesforce",
    description:
      "Automatically sync customer data between Salesforce and RepWell. Trigger review requests from deal milestones and push satisfaction scores back to contact records.",
    badge: "CRM Integration",
  },

  overview: {
    whatItDoes:
      "The Salesforce integration creates a two-way data bridge between your CRM and RepWell. Customer records sync automatically, survey triggers fire from deal stage changes, and NPS scores flow back into Salesforce for a complete customer view.",
    dataFlow: [
      { direction: "in", label: "Contact and deal data from Salesforce" },
      { direction: "out", label: "NPS scores and review status to Salesforce" },
      { direction: "both", label: "Customer activity and engagement data" },
    ],
  },

  features: [
    {
      icon: "ArrowsClockwise",
      title: "Two-Way Data Sync",
      description:
        "Customer records stay in sync across both platforms. Changes in Salesforce automatically reflect in RepWell and vice versa.",
    },
    {
      icon: "Lightning",
      title: "Deal Stage Triggers",
      description:
        "Automatically send review requests when deals reach specific stages. No manual intervention needed.",
    },
    {
      icon: "ChartBar",
      title: "CRM-Embedded Analytics",
      description:
        "View NPS scores, review counts, and satisfaction trends directly inside Salesforce contact records.",
    },
    {
      icon: "Users",
      title: "Team Attribution",
      description:
        "Map reviews and feedback to the correct team member based on Salesforce deal ownership.",
    },
    {
      icon: "Funnel",
      title: "Pipeline-Based Segmentation",
      description:
        "Segment survey recipients by pipeline stage, deal value, or custom Salesforce fields.",
    },
    {
      icon: "ClockCounterClockwise",
      title: "Historical Import",
      description:
        "Import past customer records from Salesforce to jumpstart your review collection program.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Connect Your Account",
      description:
        "Log in to RepWell and navigate to Integrations. Click 'Connect Salesforce' and authorize access with your Salesforce admin credentials.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Map Your Fields",
      description:
        "Select which Salesforce fields map to RepWell fields. We auto-detect common fields like name, email, and phone.",
      icon: "Table",
    },
    {
      step: 3,
      title: "Set Up Triggers",
      description:
        "Choose which deal stages or events should trigger survey sends. Configure timing and channel preferences.",
      icon: "Lightning",
    },
    {
      step: 4,
      title: "Start Syncing",
      description:
        "Enable the integration and data begins flowing. Monitor sync status from the RepWell dashboard.",
      icon: "ArrowsClockwise",
    },
  ],

  useCases: [
    {
      title: "Post-Close Review Requests",
      description:
        "Automatically request reviews when deals close in Salesforce. Perfect timing, zero manual work.",
    },
    {
      title: "Pipeline Health Tracking",
      description:
        "Monitor customer satisfaction alongside pipeline data to predict churn and identify upsell opportunities.",
    },
    {
      title: "Team Performance Visibility",
      description:
        "See which sales reps generate the most positive reviews and use that data for coaching and recognition.",
    },
  ],

  relatedIntegrations: ["hubspot", "zapier", "slack"],

  seo: {
    title: "Salesforce Integration | RepWell",
    description:
      "Connect Salesforce with RepWell for automated review collection, two-way data sync, and CRM-embedded customer satisfaction analytics.",
    keywords: [
      "salesforce integration",
      "salesforce review management",
      "crm review automation",
      "salesforce nps",
      "salesforce customer feedback",
    ],
  },
};

/**
 * Google Business Profile integration configuration
 */
const googleBusinessConfig: IntegrationPageConfig = {
  slug: "google-business-profile",
  name: "Google Business Profile",
  shortDescription:
    "Route reviews to Google, monitor your rating, and respond to reviews from one dashboard.",
  category: "reviews",
  icon: "GoogleLogo",

  hero: {
    headline: "Connect RepWell with Google Business Profile",
    description:
      "Route satisfied customers directly to your Google Business Profile. Monitor ratings, respond to reviews, and track your Google presence from the RepWell dashboard.",
    badge: "Review Platform",
  },

  overview: {
    whatItDoes:
      "The Google Business Profile integration connects RepWell directly to your Google listing. Happy customers are routed to leave Google reviews, new reviews are pulled into your dashboard for monitoring, and you can respond to all reviews without leaving RepWell.",
    dataFlow: [
      { direction: "in", label: "Google reviews and ratings" },
      { direction: "out", label: "Review responses and customer routing" },
      { direction: "both", label: "Rating data and review analytics" },
    ],
  },

  features: [
    {
      icon: "Star",
      title: "Smart Review Routing",
      description:
        "Satisfied customers see a direct link to leave a Google review. Unhappy customers are routed to private feedback first.",
    },
    {
      icon: "Bell",
      title: "Real-Time Review Alerts",
      description:
        "Get notified instantly when new Google reviews arrive. Never miss feedback again.",
    },
    {
      icon: "ChatCircle",
      title: "Centralized Response Management",
      description:
        "Respond to Google reviews directly from RepWell. AI-suggested responses help you reply faster.",
    },
    {
      icon: "ChartLineUp",
      title: "Rating Trend Tracking",
      description:
        "Monitor your Google rating over time. See how review collection efforts impact your public score.",
    },
    {
      icon: "Buildings",
      title: "Multi-Location Support",
      description:
        "Manage Google Business Profiles for multiple locations from a single RepWell dashboard.",
    },
    {
      icon: "MagnifyingGlass",
      title: "Local SEO Boost",
      description:
        "More Google reviews improve your local search rankings. Track your visibility improvement over time.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Connect Google Account",
      description:
        "Sign in with the Google account that manages your Business Profile. RepWell requests only the permissions needed.",
      icon: "GoogleLogo",
    },
    {
      step: 2,
      title: "Select Locations",
      description:
        "Choose which Google Business Profiles to connect. Enterprise users can connect multiple locations.",
      icon: "MapPin",
    },
    {
      step: 3,
      title: "Configure Routing",
      description:
        "Set the satisfaction threshold for Google routing. Customers above the threshold see your Google review link.",
      icon: "GitBranch",
    },
    {
      step: 4,
      title: "Monitor & Respond",
      description:
        "Reviews sync automatically. Respond from RepWell or enable AI-suggested responses for faster replies.",
      icon: "ChatCircle",
    },
  ],

  useCases: [
    {
      title: "Increase Google Reviews",
      description:
        "Route happy customers directly to Google to build your review volume and improve local search rankings.",
    },
    {
      title: "Reputation Monitoring",
      description:
        "Track your Google rating alongside other feedback sources for a complete reputation picture.",
    },
    {
      title: "Multi-Location Management",
      description:
        "Enterprise teams can manage reviews across dozens of Google Business Profiles from one dashboard.",
    },
  ],

  relatedIntegrations: ["facebook", "salesforce", "slack"],

  seo: {
    title: "Google Business Profile Integration | RepWell",
    description:
      "Connect Google Business Profile with RepWell to route reviews, monitor ratings, and respond to feedback from one dashboard.",
    keywords: [
      "google business profile integration",
      "google reviews management",
      "google review routing",
      "local seo reviews",
      "google business reviews",
    ],
  },
};

/**
 * Slack integration configuration
 */
const slackConfig: IntegrationPageConfig = {
  slug: "slack",
  name: "Slack",
  shortDescription:
    "Get instant review notifications, NPS alerts, and team performance updates in your Slack channels.",
  category: "communication",
  icon: "ChatTeardropDots",

  hero: {
    headline: "Connect RepWell with Slack",
    description:
      "Receive real-time review notifications, NPS alerts, and weekly performance summaries directly in your Slack channels. Keep your team informed without leaving their workflow.",
    badge: "Communication",
  },

  overview: {
    whatItDoes:
      "The Slack integration sends real-time notifications to your chosen channels when reviews arrive, NPS scores change, or important milestones are hit. Configure which alerts go where and keep your team in the loop automatically.",
    dataFlow: [
      { direction: "out", label: "Review notifications to Slack" },
      { direction: "out", label: "NPS alerts and summaries" },
      { direction: "out", label: "Team performance digests" },
    ],
  },

  features: [
    {
      icon: "Bell",
      title: "Instant Review Notifications",
      description:
        "Get notified in Slack the moment a new review comes in. See the rating, text, and customer name at a glance.",
    },
    {
      icon: "Warning",
      title: "Negative Review Alerts",
      description:
        "Negative reviews trigger priority alerts in a dedicated channel so your team can respond quickly.",
    },
    {
      icon: "ChartBar",
      title: "Weekly Digests",
      description:
        "Automated weekly summaries show review volume, average rating, NPS trends, and top performers.",
    },
    {
      icon: "Sliders",
      title: "Custom Channel Routing",
      description:
        "Route different notification types to different channels. Managers get alerts, the team gets wins.",
    },
    {
      icon: "Trophy",
      title: "Win Celebrations",
      description:
        "5-star reviews automatically post to a celebration channel, boosting team morale and recognition.",
    },
    {
      icon: "Link",
      title: "Direct Response Links",
      description:
        "Each notification includes a link to respond directly in RepWell. One click from Slack to action.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Add RepWell to Slack",
      description:
        "Click 'Add to Slack' from the RepWell integrations page. Authorize the app in your workspace.",
      icon: "Plus",
    },
    {
      step: 2,
      title: "Choose Channels",
      description:
        "Select which Slack channels should receive notifications. Create dedicated channels or use existing ones.",
      icon: "Hash",
    },
    {
      step: 3,
      title: "Configure Alerts",
      description:
        "Choose which events trigger notifications: new reviews, negative reviews, milestones, weekly digests.",
      icon: "Sliders",
    },
    {
      step: 4,
      title: "Start Receiving",
      description:
        "Notifications begin flowing immediately. Fine-tune settings anytime from RepWell or Slack.",
      icon: "Bell",
    },
  ],

  useCases: [
    {
      title: "Team Awareness",
      description:
        "Keep your entire team informed about customer feedback without requiring them to log into another tool.",
    },
    {
      title: "Rapid Response",
      description:
        "Negative review alerts in Slack enable your team to respond within minutes instead of hours.",
    },
    {
      title: "Culture Building",
      description:
        "Celebrating 5-star reviews in a public Slack channel builds a customer-centric culture.",
    },
  ],

  relatedIntegrations: ["microsoft-teams", "zapier", "google-business-profile"],

  seo: {
    title: "Slack Integration | RepWell",
    description:
      "Get instant review notifications, NPS alerts, and performance digests in Slack. Keep your team informed without context switching.",
    keywords: [
      "slack review notifications",
      "slack integration",
      "review alerts slack",
      "customer feedback slack",
      "nps slack notifications",
    ],
  },
};

/**
 * Microsoft Teams integration configuration
 */
const microsoftTeamsConfig: IntegrationPageConfig = {
  slug: "microsoft-teams",
  name: "Microsoft Teams",
  shortDescription:
    "Receive review alerts, NPS updates, and team reports directly in your Microsoft Teams channels.",
  category: "communication",
  icon: "MicrosoftTeamsLogo",

  hero: {
    headline: "Connect RepWell with Microsoft Teams",
    description:
      "Bring customer feedback into your Microsoft Teams workflow. Review notifications, NPS alerts, and performance reports arrive right where your team already works.",
    badge: "Communication",
  },

  overview: {
    whatItDoes:
      "The Microsoft Teams integration delivers real-time customer feedback notifications and automated reports to your Teams channels. Configure alert rules to ensure the right people see the right information at the right time.",
    dataFlow: [
      { direction: "out", label: "Review notifications to Teams" },
      { direction: "out", label: "NPS and performance alerts" },
      { direction: "out", label: "Automated weekly reports" },
    ],
  },

  features: [
    {
      icon: "Bell",
      title: "Review Notifications",
      description:
        "New reviews appear as rich cards in your Teams channels with rating, text, and quick-action buttons.",
    },
    {
      icon: "Warning",
      title: "Priority Alerts",
      description:
        "Low-rating reviews trigger urgent notifications to managers and support teams for rapid response.",
    },
    {
      icon: "ChartBar",
      title: "Scheduled Reports",
      description:
        "Weekly and monthly performance summaries posted to channels automatically. No manual reporting.",
    },
    {
      icon: "Sliders",
      title: "Flexible Routing",
      description:
        "Send different notification types to different channels or teams based on your organizational structure.",
    },
    {
      icon: "ShieldCheck",
      title: "Enterprise Security",
      description:
        "Built on Microsoft Graph API with enterprise-grade security. Respects your Teams admin policies.",
    },
    {
      icon: "ArrowSquareOut",
      title: "One-Click Actions",
      description:
        "Respond to reviews, view customer details, or escalate issues directly from the Teams notification card.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Install the App",
      description:
        "Find RepWell in the Microsoft Teams app store or install via the RepWell integrations page.",
      icon: "Plus",
    },
    {
      step: 2,
      title: "Select Teams & Channels",
      description:
        "Choose which Teams channels should receive RepWell notifications. Works with any channel type.",
      icon: "Hash",
    },
    {
      step: 3,
      title: "Set Alert Rules",
      description:
        "Configure which events trigger notifications and set priority levels for different review types.",
      icon: "Sliders",
    },
    {
      step: 4,
      title: "Go Live",
      description:
        "Enable the integration and notifications begin immediately. Manage settings from either platform.",
      icon: "Play",
    },
  ],

  useCases: [
    {
      title: "Enterprise Communication",
      description:
        "For organizations on Microsoft 365, keep feedback visible without adding another tool to the stack.",
    },
    {
      title: "Manager Oversight",
      description:
        "Branch managers receive alerts in their Teams channels, enabling quick action on customer issues.",
    },
    {
      title: "Cross-Team Coordination",
      description:
        "Route feedback to the right department automatically -- support issues to support, compliments to sales.",
    },
  ],

  relatedIntegrations: ["slack", "salesforce", "zapier"],

  seo: {
    title: "Microsoft Teams Integration | RepWell",
    description:
      "Connect Microsoft Teams with RepWell for real-time review notifications, NPS alerts, and automated performance reports.",
    keywords: [
      "microsoft teams integration",
      "teams review notifications",
      "microsoft 365 review management",
      "teams customer feedback",
      "enterprise review alerts",
    ],
  },
};

/**
 * Zapier integration configuration
 */
const zapierConfig: IntegrationPageConfig = {
  slug: "zapier",
  name: "Zapier",
  shortDescription:
    "Connect RepWell with 5,000+ apps. Automate workflows between your review platform and any tool.",
  category: "automation",
  icon: "Lightning",

  hero: {
    headline: "Connect RepWell with Zapier",
    description:
      "Use Zapier to connect RepWell with over 5,000 apps. Automate review workflows, sync data between tools, and build custom integrations without writing code.",
    badge: "Automation",
  },

  overview: {
    whatItDoes:
      "The Zapier integration exposes RepWell triggers and actions to the Zapier platform, letting you build automated workflows (Zaps) that connect RepWell with thousands of other applications. Trigger Zaps when reviews arrive, NPS changes, or milestones are reached.",
    dataFlow: [
      { direction: "out", label: "Review events as Zapier triggers" },
      { direction: "in", label: "Contact data from other apps via Zapier" },
      { direction: "both", label: "Custom workflow data between tools" },
    ],
  },

  features: [
    {
      icon: "Lightning",
      title: "Pre-Built Triggers",
      description:
        "New review, negative review, NPS change, milestone reached -- choose from a library of RepWell triggers.",
    },
    {
      icon: "Plug",
      title: "5,000+ App Connections",
      description:
        "Connect RepWell with any app in the Zapier ecosystem. CRMs, email tools, spreadsheets, project management, and more.",
    },
    {
      icon: "ArrowsClockwise",
      title: "Two-Way Actions",
      description:
        "Not just triggers -- use Zapier actions to create contacts in RepWell, trigger surveys, or update records.",
    },
    {
      icon: "Code",
      title: "No Code Required",
      description:
        "Build sophisticated workflows with Zapier's visual builder. No developers needed.",
    },
    {
      icon: "GitBranch",
      title: "Conditional Logic",
      description:
        "Use Zapier Paths and Filters to create conditional workflows based on review rating, customer data, or custom fields.",
    },
    {
      icon: "Table",
      title: "Data Transformation",
      description:
        "Format, filter, and transform data between RepWell and your other tools using Zapier's built-in tools.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Create a Zap",
      description:
        "Log in to Zapier and search for RepWell. Choose RepWell as your trigger or action app.",
      icon: "Plus",
    },
    {
      step: 2,
      title: "Authenticate",
      description:
        "Connect your RepWell account by entering your API key or signing in through OAuth.",
      icon: "Key",
    },
    {
      step: 3,
      title: "Configure Workflow",
      description:
        "Choose your trigger event, map data fields, and connect your destination app.",
      icon: "Sliders",
    },
    {
      step: 4,
      title: "Test & Enable",
      description:
        "Run a test to verify data flows correctly, then turn on your Zap to automate.",
      icon: "Play",
    },
  ],

  useCases: [
    {
      title: "CRM Sync Without Native Integration",
      description:
        "Connect RepWell with any CRM -- even niche or industry-specific ones -- using Zapier as the bridge.",
    },
    {
      title: "Custom Notification Workflows",
      description:
        "Send review alerts to any channel: email, SMS, Discord, Telegram, or your custom webhook endpoint.",
    },
    {
      title: "Spreadsheet Reporting",
      description:
        "Automatically log every review to Google Sheets or Airtable for custom reporting and analysis.",
    },
  ],

  relatedIntegrations: ["salesforce", "hubspot", "slack"],

  seo: {
    title: "Zapier Integration | RepWell",
    description:
      "Connect RepWell with 5,000+ apps through Zapier. Automate review workflows, sync customer data, and build custom integrations without code.",
    keywords: [
      "zapier integration",
      "review automation zapier",
      "zapier review management",
      "no code review automation",
      "zapier customer feedback",
    ],
  },
};

/**
 * HubSpot integration configuration
 */
const hubspotConfig: IntegrationPageConfig = {
  slug: "hubspot",
  name: "HubSpot",
  shortDescription:
    "Sync contacts, trigger surveys from deal stages, and enrich HubSpot records with review data.",
  category: "crm",
  icon: "Hexagon",

  hero: {
    headline: "Connect RepWell with HubSpot",
    description:
      "Bridge the gap between your HubSpot CRM and customer feedback. Sync contacts, trigger review requests from deal pipelines, and see satisfaction data right inside HubSpot.",
    badge: "CRM Integration",
  },

  overview: {
    whatItDoes:
      "The HubSpot integration syncs your CRM contacts with RepWell, triggers review requests based on deal stage changes, and enriches HubSpot contact records with NPS scores and review activity. Get a complete customer view without switching tools.",
    dataFlow: [
      { direction: "in", label: "Contact and deal data from HubSpot" },
      { direction: "out", label: "NPS scores and review data to HubSpot" },
      { direction: "both", label: "Customer lifecycle data" },
    ],
  },

  features: [
    {
      icon: "ArrowsClockwise",
      title: "Contact Sync",
      description:
        "Keep contacts synchronized between HubSpot and RepWell. New deals automatically create survey recipients.",
    },
    {
      icon: "Lightning",
      title: "Pipeline Triggers",
      description:
        "Fire review requests when deals move to specific pipeline stages. Automate the ask at the perfect moment.",
    },
    {
      icon: "Notepad",
      title: "Custom Properties",
      description:
        "RepWell creates custom HubSpot properties for NPS score, review count, and last review date on contact records.",
    },
    {
      icon: "ListChecks",
      title: "Smart Lists",
      description:
        "Build HubSpot lists based on RepWell data -- promoters, detractors, unreviewed customers, and more.",
    },
    {
      icon: "Envelope",
      title: "Marketing Automation",
      description:
        "Use RepWell data in HubSpot workflows. Send targeted campaigns to promoters or re-engagement to detractors.",
    },
    {
      icon: "ChartBar",
      title: "Reporting Integration",
      description:
        "Add RepWell data to HubSpot reports and dashboards for unified business intelligence.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Connect HubSpot",
      description:
        "Navigate to RepWell integrations and click 'Connect HubSpot'. Sign in with your HubSpot admin account.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Map Properties",
      description:
        "Review the default field mapping and customize as needed. RepWell auto-creates custom properties in HubSpot.",
      icon: "Table",
    },
    {
      step: 3,
      title: "Configure Triggers",
      description:
        "Select which pipeline stages should trigger survey sends. Set timing and channel preferences.",
      icon: "Lightning",
    },
    {
      step: 4,
      title: "Activate Sync",
      description:
        "Turn on the integration and monitor initial sync from the RepWell dashboard. Data flows in minutes.",
      icon: "ArrowsClockwise",
    },
  ],

  useCases: [
    {
      title: "Inbound Lead Nurturing",
      description:
        "Enrich HubSpot workflows with review data. Send testimonial requests to happy customers or save offers to unhappy ones.",
    },
    {
      title: "Customer Success Scoring",
      description:
        "Combine HubSpot engagement data with RepWell NPS scores for a comprehensive customer health score.",
    },
    {
      title: "Revenue Attribution",
      description:
        "Track which deals generated the most positive reviews and correlate review activity with revenue.",
    },
  ],

  relatedIntegrations: ["salesforce", "zapier", "google-business-profile"],

  seo: {
    title: "HubSpot Integration | RepWell",
    description:
      "Connect HubSpot with RepWell to sync contacts, trigger review requests from pipelines, and enrich CRM records with customer feedback data.",
    keywords: [
      "hubspot integration",
      "hubspot review management",
      "hubspot nps",
      "hubspot customer feedback",
      "crm review automation",
    ],
  },
};

/**
 * Encompass integration configuration
 */
const encompassConfig: IntegrationPageConfig = {
  slug: "encompass",
  name: "Encompass",
  shortDescription:
    "Trigger post-closing surveys automatically when loans fund in Encompass. Purpose-built for mortgage.",
  category: "los",
  icon: "FileText",

  hero: {
    headline: "Connect RepWell with Encompass",
    description:
      "Purpose-built for mortgage professionals. Automatically trigger review requests when loans close in Encompass. No manual work, no missed opportunities.",
    badge: "Loan Origination",
  },

  overview: {
    whatItDoes:
      "The Encompass integration listens for loan milestone events via webhooks and automatically triggers RepWell surveys. When a loan funds or closes, the borrower receives a perfectly-timed review request with the right loan officer attributed.",
    dataFlow: [
      { direction: "in", label: "Loan milestone events from Encompass" },
      { direction: "in", label: "Borrower and loan officer data" },
      { direction: "out", label: "Survey delivery confirmations" },
    ],
  },

  features: [
    {
      icon: "Lightning",
      title: "Milestone-Based Triggers",
      description:
        "Surveys fire automatically when loans hit configurable milestones: funded, closed, clear-to-close, or custom stages.",
    },
    {
      icon: "UserCircle",
      title: "Automatic Attribution",
      description:
        "Reviews are automatically attributed to the correct loan officer based on Encompass loan data.",
    },
    {
      icon: "Clock",
      title: "Configurable Timing",
      description:
        "Set delay periods between loan events and survey sends. Wait 1 day, 3 days, or send immediately.",
    },
    {
      icon: "ShieldCheck",
      title: "Compliance-Safe",
      description:
        "Survey content and timing can be configured to comply with mortgage industry regulations.",
    },
    {
      icon: "Buildings",
      title: "Multi-Branch Support",
      description:
        "Handle loans from multiple branches with automatic routing to the correct branch and loan officer.",
    },
    {
      icon: "Gear",
      title: "Custom Field Mapping",
      description:
        "Map Encompass custom fields to RepWell for personalized survey content and segmentation.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Configure Webhook",
      description:
        "Set up an Encompass webhook pointing to your RepWell endpoint. Our team provides the URL and configuration guide.",
      icon: "Link",
    },
    {
      step: 2,
      title: "Map Loan Fields",
      description:
        "Map Encompass loan fields to RepWell: borrower name, email, loan officer, branch, and custom fields.",
      icon: "Table",
    },
    {
      step: 3,
      title: "Set Trigger Rules",
      description:
        "Choose which loan milestones trigger surveys and set any delay periods between event and send.",
      icon: "Lightning",
    },
    {
      step: 4,
      title: "Test & Launch",
      description:
        "Send a test loan event through the webhook to verify everything works, then enable for production.",
      icon: "Play",
    },
  ],

  useCases: [
    {
      title: "Post-Closing Reviews",
      description:
        "Capture feedback when the experience is fresh. Automatic triggers mean no borrower falls through the cracks.",
    },
    {
      title: "Loan Officer Leaderboards",
      description:
        "Compare review performance across loan officers with automatic attribution from Encompass data.",
    },
    {
      title: "Branch Performance",
      description:
        "Track satisfaction by branch with data flowing directly from your loan origination system.",
    },
  ],

  relatedIntegrations: ["salesforce", "google-business-profile", "slack"],

  seo: {
    title: "Encompass LOS Integration | RepWell",
    description:
      "Connect Encompass with RepWell for automatic post-closing review collection. Purpose-built for mortgage professionals and lenders.",
    keywords: [
      "encompass integration",
      "mortgage review automation",
      "encompass review collection",
      "los integration",
      "post closing surveys",
    ],
  },
};

/**
 * Facebook & Instagram integration configuration
 */
const facebookConfig: IntegrationPageConfig = {
  slug: "facebook",
  name: "Facebook & Instagram",
  shortDescription:
    "Publish review highlights to Facebook and Instagram. Turn social proof into social content.",
  category: "social",
  icon: "FacebookLogo",

  hero: {
    headline: "Connect RepWell with Facebook & Instagram",
    description:
      "Transform your best reviews into engaging social content. Auto-publish review highlights, share testimonials, and build social proof across Facebook and Instagram.",
    badge: "Social Publishing",
  },

  overview: {
    whatItDoes:
      "The Facebook & Instagram integration lets you publish review content directly to your social profiles. Share review highlights as posts, create testimonial graphics, and build a consistent stream of social proof content without manual effort.",
    dataFlow: [
      { direction: "out", label: "Review highlights to Facebook posts" },
      { direction: "out", label: "Testimonial content to Instagram" },
      { direction: "in", label: "Social engagement metrics" },
    ],
  },

  features: [
    {
      icon: "ShareNetwork",
      title: "One-Click Publishing",
      description:
        "Share any review to Facebook or Instagram with a single click. RepWell formats it as an engaging social post.",
    },
    {
      icon: "Robot",
      title: "Auto-Publish Mode",
      description:
        "Set criteria and RepWell automatically publishes qualifying reviews. 5-star reviews can post without manual approval.",
    },
    {
      icon: "PaintBrush",
      title: "Branded Templates",
      description:
        "Review posts use your brand colors, logo, and formatting. Consistent, professional social proof.",
    },
    {
      icon: "CalendarBlank",
      title: "Scheduled Posting",
      description:
        "Queue review posts for optimal publishing times. Maintain a steady stream of social proof content.",
    },
    {
      icon: "ChartBar",
      title: "Engagement Tracking",
      description:
        "Track likes, shares, and comments on your review posts. See which testimonials resonate most.",
    },
    {
      icon: "ImageSquare",
      title: "Visual Testimonials",
      description:
        "Generate eye-catching quote graphics from written reviews, optimized for each social platform.",
    },
  ],

  setupSteps: [
    {
      step: 1,
      title: "Connect Facebook Page",
      description:
        "Link your Facebook Business Page and Instagram account through Meta Business Suite authorization.",
      icon: "FacebookLogo",
    },
    {
      step: 2,
      title: "Choose Templates",
      description:
        "Select from pre-built post templates or customize with your brand colors and logo.",
      icon: "PaintBrush",
    },
    {
      step: 3,
      title: "Set Publishing Rules",
      description:
        "Choose manual approval, auto-publish for 5-star reviews, or scheduled posting for curated content.",
      icon: "Sliders",
    },
    {
      step: 4,
      title: "Start Sharing",
      description:
        "Reviews begin flowing to your social profiles. Track performance from the RepWell analytics dashboard.",
      icon: "ShareNetwork",
    },
  ],

  useCases: [
    {
      title: "Social Proof Marketing",
      description:
        "Maintain a steady stream of authentic customer testimonials on your social profiles without manual effort.",
    },
    {
      title: "Personal Branding",
      description:
        "Individual professionals can share reviews to their personal Facebook and Instagram to build credibility.",
    },
    {
      title: "Multi-Location Social",
      description:
        "Enterprise teams can publish location-specific reviews to location-specific social pages automatically.",
    },
  ],

  relatedIntegrations: ["google-business-profile", "slack", "zapier"],

  seo: {
    title: "Facebook & Instagram Integration | RepWell",
    description:
      "Publish reviews to Facebook and Instagram automatically. Turn customer feedback into social proof content with RepWell.",
    keywords: [
      "facebook review publishing",
      "instagram testimonials",
      "social proof marketing",
      "review social sharing",
      "facebook business reviews",
    ],
  },
};

/**
 * Map of all integration page configurations
 */
export const integrationPageConfigs: Record<IntegrationSlug, IntegrationPageConfig> = {
  salesforce: salesforceConfig,
  "google-business-profile": googleBusinessConfig,
  slack: slackConfig,
  "microsoft-teams": microsoftTeamsConfig,
  zapier: zapierConfig,
  hubspot: hubspotConfig,
  encompass: encompassConfig,
  facebook: facebookConfig,
};

/**
 * Get all integration slugs for static generation
 */
export function getAllIntegrationSlugs(): IntegrationSlug[] {
  return Object.keys(integrationPageConfigs) as IntegrationSlug[];
}

/**
 * Get integration config by URL slug
 */
export function getIntegrationBySlug(slug: string): IntegrationPageConfig | null {
  return (integrationPageConfigs as Record<string, IntegrationPageConfig>)[slug] ?? null;
}

/**
 * Get all integrations for a given category
 */
export function getIntegrationsByCategory(
  category: IntegrationCategory
): IntegrationPageConfig[] {
  return Object.values(integrationPageConfigs).filter(
    (config) => config.category === category
  );
}

/**
 * Get all integration configs as an array
 */
export function getAllIntegrations(): IntegrationPageConfig[] {
  return Object.values(integrationPageConfigs);
}
