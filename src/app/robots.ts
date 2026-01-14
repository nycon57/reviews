import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

/**
 * Generate robots.txt for SEO
 * Controls which pages search engines can crawl
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/lo/", "/lo/*"],
        disallow: [
          "/dashboard/",
          "/api/",
          "/survey/",
          "/reports/",
          "/login",
          "/signup",
          "/auth/",
          "/unsubscribed",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
