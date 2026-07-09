import { MetadataRoute } from "next";
import { AI_CRAWLER_BOT_NAMES } from "@/lib/agents/detection";
import { getBaseUrl } from "@/lib/seo";

/**
 * Generate robots.txt for SEO
 * Controls which pages search engines can crawl
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();
  const publicAllow = [
    "/",
    "/pro/",
    "/pro/*",
    "/org/",
    "/org/*",
    "/branch/",
    "/branch/*",
    "/directory/",
    "/directory/*",
    "/s/",
    "/s/*",
    "/compare/",
    "/compare/*",
  ];
  const privateDisallow = [
    "/dashboard/",
    "/api/",
    "/survey/",
    "/reports/",
    "/login",
    "/signup",
    "/auth/",
    "/unsubscribed",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
      ...AI_CRAWLER_BOT_NAMES.map((userAgent) => ({
        userAgent,
        allow: publicAllow,
        disallow: privateDisallow,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
