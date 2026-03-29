// Navigation configuration for mega menu and site navigation
import type { FeatureSlug } from "@/lib/features/types";
import type { SolutionSlug } from "@/lib/solutions/types";

/**
 * Feature navigation item
 */
export interface FeatureNavItem {
  slug: FeatureSlug;
  title: string;
  description: string;
  icon: string;
  href: string;
}

/**
 * Solution navigation item
 */
export interface SolutionNavItem {
  slug: SolutionSlug;
  title: string;
  description: string;
  icon: string;
  href: string;
}

/**
 * Industry navigation item
 */
export interface IndustryNavItem {
  slug: string;
  title: string;
  icon: string;
  href: string;
}

/**
 * Navigation dropdown configuration
 */
export interface NavDropdown {
  label: string;
  href?: string;
  items?: (FeatureNavItem | SolutionNavItem | IndustryNavItem)[];
  cta?: {
    label: string;
    href: string;
    description?: string;
  };
}

/**
 * Feature navigation items for mega menu
 */
export const featureNavItems: FeatureNavItem[] = [
  {
    slug: "reviews",
    title: "Review Collection",
    description: "Automated surveys and review routing",
    icon: "Star",
    href: "/features/reviews",
  },
  {
    slug: "analytics",
    title: "Analytics & NPS",
    description: "Real-time dashboards and metrics",
    icon: "ChartBar",
    href: "/features/analytics",
  },
  {
    slug: "ai-insights",
    title: "AI Insights",
    description: "Sentiment analysis and recommendations",
    icon: "Brain",
    href: "/features/ai-insights",
  },
  {
    slug: "amplification",
    title: "Reputation Amplification",
    description: "Publish to Google, social, and more",
    icon: "Lightning",
    href: "/features/amplification",
  },
  {
    slug: "surveys",
    title: "Survey Management",
    description: "Custom templates and distribution",
    icon: "PaperPlaneRight",
    href: "/features/surveys",
  },
  {
    slug: "testimonials",
    title: "Testimonial Capture",
    description: "Video and written testimonials",
    icon: "VideoCamera",
    href: "/features/testimonials",
  },
];

/**
 * Solution navigation items for mega menu
 */
export const solutionNavItems: SolutionNavItem[] = [
  {
    slug: "review-growth",
    title: "Grow Review Volume",
    description: "3x your reviews with automation",
    icon: "TrendUp",
    href: "/solutions/review-growth",
  },
  {
    slug: "reputation-management",
    title: "Reputation Management",
    description: "Unified feedback visibility",
    icon: "Shield",
    href: "/solutions/reputation-management",
  },
  {
    slug: "customer-intelligence",
    title: "Customer Intelligence",
    description: "AI-powered insights from feedback",
    icon: "Lightbulb",
    href: "/solutions/customer-intelligence",
  },
  {
    slug: "team-performance",
    title: "Team Performance",
    description: "Leaderboards and accountability",
    icon: "Users",
    href: "/solutions/team-performance",
  },
];

/**
 * Industry navigation items for mega menu (4x2 grid)
 */
export const industryNavItems: IndustryNavItem[] = [
  {
    slug: "mortgage",
    title: "Mortgage",
    icon: "House",
    href: "/for/mortgage",
  },
  {
    slug: "real-estate",
    title: "Real Estate",
    icon: "BuildingOffice",
    href: "/for/real-estate",
  },
  {
    slug: "insurance",
    title: "Insurance",
    icon: "Shield",
    href: "/for/insurance",
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    icon: "Heart",
    href: "/for/healthcare",
  },
  {
    slug: "financial-advisory",
    title: "Financial Advisory",
    icon: "TrendUp",
    href: "/for/financial-advisory",
  },
  {
    slug: "home-services",
    title: "Home Services",
    icon: "Wrench",
    href: "/for/home-services",
  },
  {
    slug: "legal",
    title: "Legal",
    icon: "Scales",
    href: "/for/legal",
  },
  {
    slug: "consulting",
    title: "Consulting",
    icon: "Briefcase",
    href: "/for/consulting",
  },
];

/**
 * Main navigation structure
 */
export const mainNavigation: NavDropdown[] = [
  {
    label: "Features",
    href: "/features",
    items: featureNavItems,
    cta: {
      label: "View All Features",
      href: "/features",
      description: "See everything RepWell can do",
    },
  },
  {
    label: "Integrations",
    href: "/integrations",
  },
  {
    label: "Solutions",
    items: solutionNavItems,
    cta: {
      label: "Book a Demo",
      href: "/contact?demo=true",
      description: "See how RepWell fits your needs",
    },
  },
  {
    label: "Industries",
    items: industryNavItems,
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
  {
    label: "About",
    href: "/about",
  },
];

/**
 * Direct nav links (no dropdown)
 */
export const directNavLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

/**
 * Compare navigation item for competitor comparison pages
 */
export interface CompareNavItem {
  slug: string;
  title: string;
  description: string;
  icon: string;
  href: string;
}

/**
 * Compare navigation items for mega menu
 */
export const compareNavItems: CompareNavItem[] = [
  {
    slug: "experience-com",
    title: "RepWell vs Experience.com",
    description: "Transparent pricing, no contracts",
    icon: "Swap",
    href: "/compare/experience-com-alternative",
  },
  {
    slug: "birdeye",
    title: "RepWell vs Birdeye",
    description: "Mortgage-native, not generic",
    icon: "Swap",
    href: "/compare/birdeye-alternative",
  },
  {
    slug: "trustpilot",
    title: "RepWell vs Trustpilot",
    description: "Built for mortgage professionals",
    icon: "Swap",
    href: "/compare/trustpilot-alternative",
  },
];

/**
 * Get feature nav item by slug
 */
export function getFeatureNavItem(slug: FeatureSlug): FeatureNavItem | undefined {
  return featureNavItems.find((item) => item.slug === slug);
}

/**
 * Get solution nav item by slug
 */
export function getSolutionNavItem(slug: SolutionSlug): SolutionNavItem | undefined {
  return solutionNavItems.find((item) => item.slug === slug);
}

/**
 * Get industry nav item by slug
 */
export function getIndustryNavItem(slug: string): IndustryNavItem | undefined {
  return industryNavItems.find((item) => item.slug === slug);
}
