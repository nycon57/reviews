// Industry configurations for all supported verticals
import type { IndustryConfig, IndustryType } from "../types";

/**
 * Mortgage industry configuration
 */
export const mortgageConfig: IndustryConfig = {
  type: "mortgage",
  name: "Mortgage",
  description:
    "Reputation management for mortgage professionals and lending institutions",
  icon: "Building2",
  accentColor: "#52796f",
  labels: {
    professional: "Loan Officer",
    professionalPlural: "Loan Officers",
    customer: "borrower",
    customerPlural: "borrowers",
    transaction: "loan",
    transactionPlural: "loans",
  },
  credentials: [
    {
      id: "nmls_id",
      label: "NMLS ID",
      placeholder: "Enter NMLS ID (e.g., 123456)",
      required: true,
      pattern: "^\\d{5,10}$",
      helpText: "Your unique Nationwide Multistate Licensing System identifier",
      verificationUrl: "https://www.nmlsconsumeraccess.org",
    },
    {
      id: "state_license",
      label: "State License Number",
      placeholder: "Enter state license number",
      required: false,
      helpText: "Additional state-specific licensing number if applicable",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile to sync reviews",
    },
    {
      id: "zillow",
      name: "Zillow",
      icon: "Home",
      canSync: true,
      profileUrlPattern: "https://www.zillow.com/lender-profile/",
      helpText: "Import reviews from your Zillow lender profile",
    },
    {
      id: "experience",
      name: "Experience.com",
      icon: "Star",
      canSync: false,
      helpText: "Import existing reviews from Experience.com",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "Facebook",
      canSync: true,
      helpText: "Connect your Facebook business page",
    },
  ],
  integrations: [
    {
      id: "encompass",
      name: "Encompass",
      description: "ICE Mortgage Technology loan origination system",
      logoUrl: "/integrations/encompass.svg",
      available: true,
      category: "los",
    },
    {
      id: "velocify",
      name: "Velocify",
      description: "Lead management and sales acceleration",
      logoUrl: "/integrations/velocify.svg",
      available: true,
      category: "crm",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "CRM and customer management platform",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
    {
      id: "total_expert",
      name: "Total Expert",
      description: "Mortgage marketing and CRM platform",
      logoUrl: "/integrations/total-expert.svg",
      available: true,
      category: "marketing",
    },
  ],
  benchmarks: {
    averageNps: 62,
    averageRating: 4.7,
    targetResponseRate: 35,
    averageReviewsPerMonth: 4,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience with your loan officer?",
    "How likely are you to recommend your loan officer to friends or family?",
    "How satisfied were you with the communication throughout your loan process?",
    "Was the closing process smooth and on schedule?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "communication",
    "responsiveness",
    "closing process",
    "rates",
    "professionalism",
    "knowledge",
    "documentation",
    "timeline",
    "customer service",
  ],
};

/**
 * Real Estate industry configuration
 */
export const realEstateConfig: IndustryConfig = {
  type: "real_estate",
  name: "Real Estate",
  description:
    "Reputation management for real estate agents, brokers, and teams",
  icon: "Home",
  accentColor: "#4a7c59",
  labels: {
    professional: "Agent",
    professionalPlural: "Agents",
    customer: "client",
    customerPlural: "clients",
    transaction: "sale",
    transactionPlural: "sales",
  },
  credentials: [
    {
      id: "real_estate_license",
      label: "Real Estate License",
      placeholder: "Enter license number",
      required: true,
      helpText: "Your state real estate license number",
    },
    {
      id: "broker_license",
      label: "Broker License",
      placeholder: "Enter broker license number",
      required: false,
      helpText: "Broker license number if applicable",
    },
    {
      id: "realtor_id",
      label: "REALTOR ID",
      placeholder: "Enter NAR member ID",
      required: false,
      helpText: "National Association of REALTORS member ID",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "zillow",
      name: "Zillow",
      icon: "Home",
      canSync: true,
      profileUrlPattern: "https://www.zillow.com/profile/",
      helpText: "Import reviews from your Zillow agent profile",
    },
    {
      id: "realtor_com",
      name: "Realtor.com",
      icon: "Building",
      canSync: false,
      helpText: "Import reviews from Realtor.com",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "Facebook",
      canSync: true,
      helpText: "Connect your Facebook business page",
    },
  ],
  integrations: [
    {
      id: "follow_up_boss",
      name: "Follow Up Boss",
      description: "Real estate CRM and lead management",
      logoUrl: "/integrations/follow-up-boss.svg",
      available: true,
      category: "crm",
    },
    {
      id: "kvcore",
      name: "kvCORE",
      description: "Real estate platform and lead generation",
      logoUrl: "/integrations/kvcore.svg",
      available: true,
      category: "crm",
    },
    {
      id: "boomtown",
      name: "BoomTown",
      description: "Real estate CRM and marketing platform",
      logoUrl: "/integrations/boomtown.svg",
      available: true,
      category: "crm",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "CRM and customer management platform",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 58,
    averageRating: 4.8,
    targetResponseRate: 30,
    averageReviewsPerMonth: 3,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience working with your agent?",
    "How likely are you to recommend your agent to friends or family?",
    "How satisfied were you with communication throughout the buying/selling process?",
    "Did your agent understand your needs and preferences?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "communication",
    "responsiveness",
    "market knowledge",
    "negotiation",
    "professionalism",
    "availability",
    "pricing",
    "process",
    "local expertise",
  ],
};

/**
 * Insurance industry configuration
 */
export const insuranceConfig: IndustryConfig = {
  type: "insurance",
  name: "Insurance",
  description:
    "Reputation management for insurance agents and agencies",
  icon: "Shield",
  accentColor: "#2d5a7b",
  labels: {
    professional: "Agent",
    professionalPlural: "Agents",
    customer: "policyholder",
    customerPlural: "policyholders",
    transaction: "policy",
    transactionPlural: "policies",
  },
  credentials: [
    {
      id: "insurance_license",
      label: "Insurance License",
      placeholder: "Enter license number",
      required: true,
      helpText: "Your state insurance license number",
    },
    {
      id: "npn",
      label: "National Producer Number",
      placeholder: "Enter NPN",
      required: false,
      pattern: "^\\d{8,10}$",
      helpText: "Your unique National Producer Number",
      verificationUrl: "https://nipr.com",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "Facebook",
      canSync: true,
      helpText: "Connect your Facebook business page",
    },
    {
      id: "bbb",
      name: "Better Business Bureau",
      icon: "Award",
      canSync: false,
      helpText: "Import reviews from BBB",
    },
  ],
  integrations: [
    {
      id: "agency_zoom",
      name: "AgencyZoom",
      description: "Insurance agency management system",
      logoUrl: "/integrations/agencyzoom.svg",
      available: true,
      category: "crm",
    },
    {
      id: "hawksoft",
      name: "HawkSoft",
      description: "Insurance agency management system",
      logoUrl: "/integrations/hawksoft.svg",
      available: true,
      category: "crm",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "CRM and customer management platform",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 45,
    averageRating: 4.5,
    targetResponseRate: 25,
    averageReviewsPerMonth: 3,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience with your insurance agent?",
    "How likely are you to recommend your agent to friends or family?",
    "How satisfied were you with the coverage options presented?",
    "Was the claims process (if applicable) handled efficiently?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "coverage options",
    "pricing",
    "claims process",
    "responsiveness",
    "knowledge",
    "customer service",
    "communication",
    "policy explanation",
  ],
};

/**
 * Financial Advisory industry configuration
 */
export const financialAdvisoryConfig: IndustryConfig = {
  type: "financial_advisory",
  name: "Financial Advisory",
  description:
    "Reputation management for financial advisors and wealth management firms",
  icon: "TrendingUp",
  accentColor: "#1a4d5c",
  labels: {
    professional: "Advisor",
    professionalPlural: "Advisors",
    customer: "client",
    customerPlural: "clients",
    transaction: "engagement",
    transactionPlural: "engagements",
  },
  credentials: [
    {
      id: "crd_number",
      label: "CRD Number",
      placeholder: "Enter CRD number",
      required: true,
      pattern: "^\\d{4,8}$",
      helpText: "Your Central Registration Depository number",
      verificationUrl: "https://brokercheck.finra.org",
    },
    {
      id: "cfp",
      label: "CFP Number",
      placeholder: "Enter CFP certification number",
      required: false,
      helpText: "Certified Financial Planner certification number",
    },
    {
      id: "cfa",
      label: "CFA Charter",
      placeholder: "Enter CFA charter number",
      required: false,
      helpText: "Chartered Financial Analyst charter number",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: "Facebook",
      canSync: true,
      helpText: "Connect your Facebook business page",
    },
  ],
  integrations: [
    {
      id: "wealthbox",
      name: "Wealthbox",
      description: "CRM for financial advisors",
      logoUrl: "/integrations/wealthbox.svg",
      available: true,
      category: "crm",
    },
    {
      id: "redtail",
      name: "Redtail CRM",
      description: "Financial services CRM",
      logoUrl: "/integrations/redtail.svg",
      available: true,
      category: "crm",
    },
    {
      id: "salesforce",
      name: "Salesforce Financial Services Cloud",
      description: "CRM for financial services",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 55,
    averageRating: 4.6,
    targetResponseRate: 30,
    averageReviewsPerMonth: 2,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience with your financial advisor?",
    "How likely are you to recommend your advisor to friends or family?",
    "How well does your advisor understand your financial goals?",
    "How satisfied are you with the communication and reporting?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "investment performance",
    "communication",
    "financial planning",
    "trust",
    "expertise",
    "responsiveness",
    "fees",
    "goal alignment",
  ],
};

/**
 * Healthcare industry configuration
 */
export const healthcareConfig: IndustryConfig = {
  type: "healthcare",
  name: "Healthcare",
  description:
    "Reputation management for healthcare providers and practices",
  icon: "Heart",
  accentColor: "#c44536",
  labels: {
    professional: "Provider",
    professionalPlural: "Providers",
    customer: "patient",
    customerPlural: "patients",
    transaction: "visit",
    transactionPlural: "visits",
  },
  credentials: [
    {
      id: "npi",
      label: "NPI Number",
      placeholder: "Enter NPI (10 digits)",
      required: true,
      pattern: "^\\d{10}$",
      helpText: "Your National Provider Identifier",
      verificationUrl: "https://npiregistry.cms.hhs.gov",
    },
    {
      id: "medical_license",
      label: "Medical License",
      placeholder: "Enter license number",
      required: true,
      helpText: "Your state medical license number",
    },
    {
      id: "board_certification",
      label: "Board Certification",
      placeholder: "Enter certification details",
      required: false,
      helpText: "Board certification information",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "healthgrades",
      name: "Healthgrades",
      icon: "Stethoscope",
      canSync: false,
      profileUrlPattern: "https://www.healthgrades.com/physician/",
      helpText: "Import reviews from Healthgrades",
    },
    {
      id: "zocdoc",
      name: "Zocdoc",
      icon: "Calendar",
      canSync: false,
      helpText: "Import reviews from Zocdoc",
    },
    {
      id: "vitals",
      name: "Vitals",
      icon: "Activity",
      canSync: false,
      helpText: "Import reviews from Vitals.com",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
  ],
  integrations: [
    {
      id: "epic",
      name: "Epic",
      description: "Healthcare EMR system",
      logoUrl: "/integrations/epic.svg",
      available: false,
      category: "data",
    },
    {
      id: "athenahealth",
      name: "athenahealth",
      description: "Healthcare network services",
      logoUrl: "/integrations/athenahealth.svg",
      available: true,
      category: "data",
    },
    {
      id: "salesforce_health",
      name: "Salesforce Health Cloud",
      description: "Healthcare CRM platform",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 50,
    averageRating: 4.4,
    targetResponseRate: 20,
    averageReviewsPerMonth: 5,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience at our practice?",
    "How likely are you to recommend us to friends or family?",
    "How satisfied were you with the wait time?",
    "Did the provider listen to your concerns?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "wait time",
    "bedside manner",
    "staff friendliness",
    "cleanliness",
    "communication",
    "scheduling",
    "follow-up care",
    "billing",
  ],
};

/**
 * Home Services industry configuration
 */
export const homeServicesConfig: IndustryConfig = {
  type: "home_services",
  name: "Home Services",
  description:
    "Reputation management for contractors, plumbers, electricians, and home service providers",
  icon: "Wrench",
  accentColor: "#e07a2b",
  labels: {
    professional: "Technician",
    professionalPlural: "Technicians",
    customer: "customer",
    customerPlural: "customers",
    transaction: "job",
    transactionPlural: "jobs",
  },
  credentials: [
    {
      id: "contractor_license",
      label: "Contractor License",
      placeholder: "Enter license number",
      required: true,
      helpText: "Your state contractor license number",
    },
    {
      id: "bonded_insured",
      label: "Bond/Insurance Number",
      placeholder: "Enter bond or insurance number",
      required: false,
      helpText: "Proof of bonding and insurance",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
    {
      id: "angi",
      name: "Angi (Angie's List)",
      icon: "ClipboardList",
      canSync: false,
      helpText: "Import reviews from Angi",
    },
    {
      id: "homeadvisor",
      name: "HomeAdvisor",
      icon: "Home",
      canSync: false,
      helpText: "Import reviews from HomeAdvisor",
    },
    {
      id: "thumbtack",
      name: "Thumbtack",
      icon: "Pin",
      canSync: false,
      helpText: "Import reviews from Thumbtack",
    },
    {
      id: "nextdoor",
      name: "Nextdoor",
      icon: "Users",
      canSync: false,
      helpText: "Connect your Nextdoor business page",
    },
  ],
  integrations: [
    {
      id: "servicetitan",
      name: "ServiceTitan",
      description: "Field service management software",
      logoUrl: "/integrations/servicetitan.svg",
      available: true,
      category: "crm",
    },
    {
      id: "housecall_pro",
      name: "Housecall Pro",
      description: "Home service business management",
      logoUrl: "/integrations/housecall-pro.svg",
      available: true,
      category: "crm",
    },
    {
      id: "jobber",
      name: "Jobber",
      description: "Field service software",
      logoUrl: "/integrations/jobber.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 52,
    averageRating: 4.6,
    targetResponseRate: 35,
    averageReviewsPerMonth: 8,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience with our service?",
    "How likely are you to recommend us to friends or neighbors?",
    "Was the technician professional and courteous?",
    "Was the job completed to your satisfaction?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "quality of work",
    "punctuality",
    "professionalism",
    "cleanliness",
    "pricing",
    "communication",
    "timeliness",
    "follow-up",
  ],
};

/**
 * Legal industry configuration
 */
export const legalConfig: IndustryConfig = {
  type: "legal",
  name: "Legal",
  description: "Reputation management for law firms and attorneys",
  icon: "Scale",
  accentColor: "#5c4d7d",
  labels: {
    professional: "Attorney",
    professionalPlural: "Attorneys",
    customer: "client",
    customerPlural: "clients",
    transaction: "case",
    transactionPlural: "cases",
  },
  credentials: [
    {
      id: "bar_number",
      label: "State Bar Number",
      placeholder: "Enter bar number",
      required: true,
      helpText: "Your state bar association number",
    },
    {
      id: "practice_areas",
      label: "Practice Areas",
      placeholder: "Enter practice areas",
      required: false,
      helpText: "Your areas of legal practice",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "avvo",
      name: "Avvo",
      icon: "Scale",
      canSync: false,
      profileUrlPattern: "https://www.avvo.com/attorneys/",
      helpText: "Import reviews from Avvo",
    },
    {
      id: "martindale",
      name: "Martindale-Hubbell",
      icon: "Award",
      canSync: false,
      helpText: "Import reviews from Martindale-Hubbell",
    },
    {
      id: "lawyers_com",
      name: "Lawyers.com",
      icon: "Briefcase",
      canSync: false,
      helpText: "Import reviews from Lawyers.com",
    },
    {
      id: "yelp",
      name: "Yelp",
      icon: "MessageSquare",
      canSync: false,
      helpText: "Connect your Yelp business page",
    },
  ],
  integrations: [
    {
      id: "clio",
      name: "Clio",
      description: "Legal practice management software",
      logoUrl: "/integrations/clio.svg",
      available: true,
      category: "crm",
    },
    {
      id: "mycase",
      name: "MyCase",
      description: "Law practice management software",
      logoUrl: "/integrations/mycase.svg",
      available: true,
      category: "crm",
    },
    {
      id: "lawmatics",
      name: "Lawmatics",
      description: "Legal CRM and marketing automation",
      logoUrl: "/integrations/lawmatics.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 48,
    averageRating: 4.5,
    targetResponseRate: 25,
    averageReviewsPerMonth: 2,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience with our firm?",
    "How likely are you to recommend our firm to others?",
    "How satisfied were you with communication throughout your case?",
    "Did you feel your attorney understood your needs?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "communication",
    "responsiveness",
    "expertise",
    "outcome",
    "fees",
    "professionalism",
    "empathy",
    "availability",
  ],
};

/**
 * Consulting industry configuration
 */
export const consultingConfig: IndustryConfig = {
  type: "consulting",
  name: "Consulting",
  description:
    "Reputation management for consultants and professional service firms",
  icon: "Lightbulb",
  accentColor: "#2d6a4f",
  labels: {
    professional: "Consultant",
    professionalPlural: "Consultants",
    customer: "client",
    customerPlural: "clients",
    transaction: "project",
    transactionPlural: "projects",
  },
  credentials: [
    {
      id: "certification",
      label: "Professional Certification",
      placeholder: "Enter certification details",
      required: false,
      helpText: "Relevant professional certifications",
    },
  ],
  reviewSources: [
    {
      id: "google",
      name: "Google Business Profile",
      icon: "Search",
      canSync: true,
      helpText: "Connect your Google Business Profile",
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: "Linkedin",
      canSync: false,
      helpText: "Recommendations from LinkedIn",
    },
    {
      id: "clutch",
      name: "Clutch",
      icon: "Award",
      canSync: false,
      helpText: "Import reviews from Clutch.co",
    },
  ],
  integrations: [
    {
      id: "hubspot",
      name: "HubSpot",
      description: "CRM and marketing platform",
      logoUrl: "/integrations/hubspot.svg",
      available: true,
      category: "crm",
    },
    {
      id: "salesforce",
      name: "Salesforce",
      description: "CRM and customer management platform",
      logoUrl: "/integrations/salesforce.svg",
      available: true,
      category: "crm",
    },
    {
      id: "pipedrive",
      name: "Pipedrive",
      description: "Sales CRM",
      logoUrl: "/integrations/pipedrive.svg",
      available: true,
      category: "crm",
    },
  ],
  benchmarks: {
    averageNps: 55,
    averageRating: 4.7,
    targetResponseRate: 40,
    averageReviewsPerMonth: 2,
  },
  defaultSurveyQuestions: [
    "How would you rate your overall experience working with us?",
    "How likely are you to recommend our services to colleagues?",
    "Did we deliver on the expected outcomes?",
    "How satisfied were you with our communication and collaboration?",
    "What could we have done better?",
  ],
  analysisThemes: [
    "expertise",
    "communication",
    "deliverables",
    "timeline",
    "value",
    "collaboration",
    "responsiveness",
    "innovation",
  ],
};

/**
 * Map of all industry configurations
 */
export const industryConfigs: Record<IndustryType, IndustryConfig> = {
  mortgage: mortgageConfig,
  real_estate: realEstateConfig,
  insurance: insuranceConfig,
  financial_advisory: financialAdvisoryConfig,
  healthcare: healthcareConfig,
  home_services: homeServicesConfig,
  legal: legalConfig,
  consulting: consultingConfig,
};

/**
 * Get configuration for a specific industry
 */
export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return industryConfigs[industry];
}

/**
 * Get all supported industries
 */
export function getSupportedIndustries(): IndustryType[] {
  return Object.keys(industryConfigs) as IndustryType[];
}

/**
 * Industry display options for select dropdowns
 */
export const industryOptions: Array<{ value: IndustryType; label: string }> = [
  { value: "mortgage", label: "Mortgage & Lending" },
  { value: "real_estate", label: "Real Estate" },
  { value: "insurance", label: "Insurance" },
  { value: "financial_advisory", label: "Financial Advisory" },
  { value: "healthcare", label: "Healthcare" },
  { value: "home_services", label: "Home Services" },
  { value: "legal", label: "Legal" },
  { value: "consulting", label: "Consulting" },
];
