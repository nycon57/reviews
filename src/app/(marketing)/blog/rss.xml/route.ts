import { generateRssFeed } from "@/lib/blog";

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://reviewhub.com";
  const feed = generateRssFeed(siteUrl);

  return new Response(feed, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
