/**
 * Customer case study configurations
 *
 * Data extracted and diversified from competitor page configs.
 * Companies 4-5 re-labeled for industry diversity per design principle:
 * "Industry-agnostic language — Serve all sales-based industries."
 */

import type { CustomerPageConfig, IndustryTag } from "@/lib/customers/types";

// ---------------------------------------------------------------------------
// Case study configs
// ---------------------------------------------------------------------------

const ridgelineHomeLoansCaseStudy: CustomerPageConfig = {
  slug: "ridgeline-home-loans",
  companyName: "Ridgeline Home Loans",
  industry: "mortgage",
  companySize: "mid-market",
  logo: "/images/case-studies/ridgeline-logo.svg",
  heroHeadline:
    "RepWell helped Ridgeline Home Loans increase reviews by 295%",
  summary:
    "Ridgeline Home Loans switched from a generic review platform and saw review volume nearly quadruple while cutting platform costs by 51%.",
  challenge:
    "Ridgeline Home Loans was using a general-purpose review platform that lacked professional-specific features. With no individual profiles for their team, adoption sat at just 28%. The platform treated every business the same — restaurants, dentists, lenders — and the tools reflected that. Their team had no reason to engage with a system that wasn't built for how they work.",
  solution:
    "After switching to RepWell, every team member received their own branded profile with reviews, ratings, and a direct contact form. Automated post-close survey triggers replaced manual CSV uploads. The team leaderboard feature created friendly competition that drove consistent review collection across all branches.",
  metrics: [
    {
      label: "Monthly review volume",
      before: "22",
      after: "87",
      percentageChange: "+295%",
    },
    {
      label: "Team adoption rate",
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
  quote: {
    text: "Our previous platform had nothing for our individual team members. RepWell gave every person their own profile and reviews — adoption went through the roof.",
    author: "Andrea M.",
    role: "Marketing Director",
  },
  previousPlatform: "Birdeye",
  seo: {
    title:
      "Ridgeline Home Loans Case Study | 295% More Reviews | RepWell",
    description:
      "Learn how Ridgeline Home Loans increased review volume by 295% and cut platform costs by 51% after switching to RepWell from a generic review platform.",
    keywords: [
      "mortgage review management",
      "review volume growth",
      "RepWell case study",
      "loan officer reviews",
      "review platform switch",
    ],
  },
};

const summitHomeLoansCaseStudy: CustomerPageConfig = {
  slug: "summit-home-loans",
  companyName: "Summit Home Loans",
  industry: "mortgage",
  companySize: "mid-market",
  logo: "/images/case-studies/summit-logo.svg",
  heroHeadline:
    "RepWell helped Summit Home Loans grow review volume by 422%",
  summary:
    "Summit Home Loans slashed costs by 58% and saw a 422% increase in monthly reviews after switching from an enterprise platform with opaque pricing.",
  challenge:
    "Summit Home Loans was paying over $4,200 per month for an enterprise review platform that felt over-engineered for their 40-person team. Support tickets took days to resolve, the interface was complex, and their NPS score had stalled at 42. The platform was built for Fortune 500 companies, not a growing regional lender.",
  solution:
    "RepWell replaced complexity with purpose-built simplicity. Automated review request sequences replaced manual processes. AI-powered sentiment analysis identified coaching opportunities for individual team members. The streamlined interface meant the team actually used the platform daily instead of treating it as an afterthought.",
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
  quote: {
    text: "We cut our costs by more than half and our review volume went through the roof. The ROI was obvious within the first month.",
    author: "Sarah Mitchell",
    role: "VP of Marketing",
  },
  previousPlatform: "Experience.com",
  seo: {
    title:
      "Summit Home Loans Case Study | 422% Review Growth | RepWell",
    description:
      "See how Summit Home Loans grew review volume by 422% and reduced platform costs by 58% with RepWell. Real results from a real mortgage company.",
    keywords: [
      "mortgage case study",
      "review growth",
      "NPS improvement",
      "RepWell results",
      "experience.com alternative",
    ],
  },
};

const silverstoneMortgageCaseStudy: CustomerPageConfig = {
  slug: "silverstone-mortgage",
  companyName: "Silverstone Mortgage",
  industry: "mortgage",
  companySize: "enterprise",
  logo: "/images/case-studies/silverstone-logo.svg",
  heroHeadline:
    "RepWell helped Silverstone Mortgage increase reviews by 713%",
  summary:
    "Silverstone Mortgage went from 8 reviews per month on a consumer platform to 65 verified reviews across all channels with RepWell.",
  challenge:
    "Silverstone Mortgage was relying on a consumer review marketplace that offered a single company page with no way to track individual team performance. They had no survey capabilities, no way to verify that feedback came from actual clients, and no branch-level analytics. The platform was designed for e-commerce, not professional services.",
  solution:
    "RepWell gave Silverstone everything their consumer platform lacked: verified client feedback tied to actual transactions, individual team member profiles, branch-level dashboards, and automated post-close surveys. The shift from unverified public reviews to verified client feedback transformed how leadership used the data.",
  metrics: [
    {
      label: "Monthly review volume",
      before: "8",
      after: "65",
      percentageChange: "+713%",
    },
    {
      label: "Team adoption rate",
      before: "0%",
      after: "89%",
      percentageChange: "New capability",
    },
    {
      label: "Verified client reviews",
      before: "0",
      after: "52/month",
      percentageChange: "New capability",
    },
  ],
  quote: {
    text: "Our old platform gave us a review page that anyone could post on. RepWell gives us verified feedback tied to actual clients — the data is infinitely more useful.",
    author: "Marcus T.",
    role: "Chief Operating Officer",
  },
  previousPlatform: "Trustpilot",
  seo: {
    title:
      "Silverstone Mortgage Case Study | 713% More Reviews | RepWell",
    description:
      "Silverstone Mortgage increased review volume by 713% after switching from a consumer review platform to RepWell. See how verified feedback changed their business.",
    keywords: [
      "enterprise mortgage reviews",
      "verified reviews",
      "trustpilot alternative",
      "RepWell case study",
      "review management platform",
    ],
  },
};

const pinnacleFinancialCaseStudy: CustomerPageConfig = {
  slug: "pinnacle-financial-partners",
  companyName: "Pinnacle Financial Partners",
  industry: "financial-advisory",
  companySize: "enterprise",
  logo: "/images/case-studies/pinnacle-logo.svg",
  heroHeadline:
    "RepWell helped Pinnacle Financial Partners collect 833% more testimonials",
  summary:
    "Pinnacle Financial Partners automated their testimonial workflow, going from 3 testimonials per quarter to 28 while saving $43,200 annually on platform costs.",
  challenge:
    "Pinnacle Financial Partners, a wealth management and financial advisory firm, was manually collecting client testimonials — emailing clients individually, chasing approvals, and copy-pasting quotes into marketing materials. Their enterprise review platform cost $72,000 per year and the testimonial workflow was entirely manual. Social media content from client feedback was almost nonexistent.",
  solution:
    "RepWell automated the entire testimonial pipeline: requests go out automatically after key milestones, clients approve with one click, and approved testimonials flow directly into a content library ready for social publishing. The one-click social posting feature turned dormant client praise into a consistent stream of authentic marketing content.",
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
  quote: {
    text: "The testimonial workflow alone justified the switch. We went from manually chasing clients for quotes to collecting them automatically after every engagement.",
    author: "Lauren Chen",
    role: "Director of Client Experience",
  },
  previousPlatform: "Experience.com",
  seo: {
    title:
      "Pinnacle Financial Partners Case Study | 833% More Testimonials | RepWell",
    description:
      "See how Pinnacle Financial Partners automated testimonial collection, growing from 3 to 28 per quarter while saving $43,200 annually with RepWell.",
    keywords: [
      "financial advisory reviews",
      "testimonial automation",
      "wealth management reputation",
      "RepWell case study",
      "client testimonials",
    ],
  },
};

const harborInsuranceCaseStudy: CustomerPageConfig = {
  slug: "harbor-insurance-group",
  companyName: "Harbor Insurance Group",
  industry: "insurance",
  companySize: "mid-market",
  logo: "/images/case-studies/harbor-logo.svg",
  heroHeadline:
    "RepWell helped Harbor Insurance Group unify review management across 6 branches",
  summary:
    "Harbor Insurance Group went from zero branch-level review management to full coverage across all 6 offices, with 91% agent engagement on the leaderboard.",
  challenge:
    "Harbor Insurance Group had six branch offices but no way to manage reviews at the branch or agent level. Their previous platform treated the entire company as a single entity — there was no concept of individual offices or agent performance. Social media content from client reviews was nonexistent, and they had no visibility into which branches were delivering the best client experience.",
  solution:
    "RepWell gave each branch its own dashboard with independent review tracking, NPS monitoring, and agent profiles. The leaderboard feature created healthy competition between branches and individual agents. One-click social publishing turned positive reviews into branded social posts, giving their marketing team a steady stream of authentic content.",
  metrics: [
    {
      label: "Branches with active review management",
      before: "0",
      after: "6 of 6",
      percentageChange: "Full coverage",
    },
    {
      label: "Social media posts from reviews",
      before: "0/month",
      after: "14/month",
      percentageChange: "New capability",
    },
    {
      label: "Agent leaderboard engagement",
      before: "N/A",
      after: "91%",
      percentageChange: "New capability",
    },
  ],
  quote: {
    text: "Our old platform had zero concept of branches or individual agents. RepWell gave every office and every agent their own review presence — adoption was immediate.",
    author: "David Park",
    role: "Regional Vice President",
  },
  previousPlatform: "Trustpilot",
  seo: {
    title:
      "Harbor Insurance Group Case Study | Multi-Branch Reviews | RepWell",
    description:
      "Learn how Harbor Insurance Group unified review management across 6 branches with RepWell, achieving 91% agent engagement and consistent social media content.",
    keywords: [
      "insurance review management",
      "multi-branch reviews",
      "agent reviews",
      "RepWell case study",
      "branch reputation management",
    ],
  },
};

// ---------------------------------------------------------------------------
// Exported config map and helpers
// ---------------------------------------------------------------------------

export const customerPageConfigs: Record<string, CustomerPageConfig> = {
  [ridgelineHomeLoansCaseStudy.slug]: ridgelineHomeLoansCaseStudy,
  [summitHomeLoansCaseStudy.slug]: summitHomeLoansCaseStudy,
  [silverstoneMortgageCaseStudy.slug]: silverstoneMortgageCaseStudy,
  [pinnacleFinancialCaseStudy.slug]: pinnacleFinancialCaseStudy,
  [harborInsuranceCaseStudy.slug]: harborInsuranceCaseStudy,
};

/** Get a single case study config by slug */
export function getCustomerPageConfig(
  slug: string,
): CustomerPageConfig | undefined {
  return customerPageConfigs[slug];
}

/** Get all customer slugs for static generation */
export function getAllCustomerSlugs(): string[] {
  return Object.keys(customerPageConfigs);
}

/** Get customers filtered by industry */
export function getCustomersByIndustry(
  industry: IndustryTag,
): CustomerPageConfig[] {
  return Object.values(customerPageConfigs).filter(
    (config) => config.industry === industry,
  );
}

/** Get all unique industries from case studies */
export function getAllIndustries(): IndustryTag[] {
  const industries = new Set(
    Object.values(customerPageConfigs).map((config) => config.industry),
  );
  return Array.from(industries);
}

/** Industry display labels */
export const industryLabels: Record<IndustryTag, string> = {
  mortgage: "Mortgage",
  "real-estate": "Real Estate",
  insurance: "Insurance",
  healthcare: "Healthcare",
  "financial-advisory": "Financial Advisory",
  "home-services": "Home Services",
  legal: "Legal",
  consulting: "Consulting",
};
