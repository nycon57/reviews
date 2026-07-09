import { getBaseUrl } from "@/lib/seo";
import {
  MARKETING_PRICING_TIERS,
  MARKETING_TRIAL_FACTS,
  getMarketingTierPriceLabel,
} from "@/lib/marketing/pricing-facts";

export const revalidate = 86400;

export function GET() {
  const baseUrl = getBaseUrl();
  const pricingLines = MARKETING_PRICING_TIERS.map((tier) => {
    const monthly = getMarketingTierPriceLabel(tier.id, "monthly");
    const annual = getMarketingTierPriceLabel(tier.id, "annual");
    const annualText = monthly === annual ? "" : `; annual equivalent ${annual}`;
    return `- ${tier.name}: ${monthly}${annualText}. ${tier.description}.`;
  }).join("\n");

  const featureLines = [
    "Review request and survey workflows",
    "NPS, CSAT, rating trends, and reporting",
    "AI sentiment analysis, response suggestions, and AI visibility / GEO reports",
    "Public professional, organization, and branch profiles",
    "Text and video testimonial collection",
    "Embeddable widgets, API access, webhooks, and CSV bulk import on supported plans",
    "Team management, manager dashboards, and leaderboards on supported plans",
  ]
    .map((item) => `- ${item}`)
    .join("\n");

  const body = `# RepWell

RepWell is a review-management platform for client-facing teams. It helps teams collect customer feedback, manage review requests, publish public profile pages, monitor reputation signals, and analyze feedback with AI-assisted workflows.

RepWell is industry-agnostic: the product is designed for teams that depend on trust, referrals, and customer experience, not for a single vertical.

## Product Capabilities
${featureLines}

## Trial and Pricing
- Trial: ${MARKETING_TRIAL_FACTS.shortCopy}. ${MARKETING_TRIAL_FACTS.creditCardCopy}
${pricingLines}

## Key Product Pages
- [Home](${baseUrl}/)
- [Pricing](${baseUrl}/pricing)
- [Features](${baseUrl}/features)
- [Compare RepWell](${baseUrl}/compare)
- [Book a demo](${baseUrl}/demo)
- [Start free trial](${baseUrl}/signup)
- [Contact](${baseUrl}/contact)

## Compare Pages
- [RepWell vs Experience.com](${baseUrl}/compare/experience-com)
- [RepWell vs Birdeye](${baseUrl}/compare/birdeye)
- [RepWell vs Trustpilot](${baseUrl}/compare/trustpilot)

## Directory and Public Profiles
- [Public directory](${baseUrl}/directory)

## Profile URL Patterns
- Professional profiles: ${baseUrl}/pro/{slug}
- Organization profiles: ${baseUrl}/org/{slug}
- Branch profiles: ${baseUrl}/branch/{slug}

## Resources
- [Blog](${baseUrl}/blog)
- [Docs](${baseUrl}/docs)
- [API](${baseUrl}/developers/api)
- [Security](${baseUrl}/security)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
