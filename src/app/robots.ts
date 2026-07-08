import { MetadataRoute } from "next";
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
  const aiCrawlers = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot",
    "Google-Extended",
    "CCBot",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: publicAllow,
        disallow: privateDisallow,
      },
      ...aiCrawlers.map((userAgent) => ({
        userAgent,
        allow: publicAllow,
        disallow: privateDisallow,
      })),
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
