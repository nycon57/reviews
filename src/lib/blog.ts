import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  BlogPost,
  BlogPostMeta,
  BlogPostFrontmatter,
  BlogCategory,
} from "@/types/blog";

const CONTENT_DIR = path.join(process.cwd(), "content/blog");

/**
 * Calculate reading time in minutes based on word count
 * Average reading speed: 200 words per minute
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

/**
 * Get all blog post slugs
 */
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR);
  return files
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

/**
 * Get a single blog post by slug
 */
export function getPostBySlug(slug: string): BlogPost | null {
  const fullPath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = data as BlogPostFrontmatter;

  return {
    ...frontmatter,
    slug,
    content,
    readingTime: calculateReadingTime(content),
  };
}

/**
 * Get all blog posts with metadata only (no content)
 */
export function getAllPosts(): BlogPostMeta[] {
  const slugs = getAllPostSlugs();
  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug);
      if (!post) return null;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...meta } = post;
      return meta;
    })
    .filter((post): post is BlogPostMeta => post !== null);

  // Sort by date descending
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/**
 * Get posts by category
 */
export function getPostsByCategory(category: BlogCategory): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((post) =>
    post.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

/**
 * Get featured posts
 */
export function getFeaturedPosts(): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.featured);
}

/**
 * Get related posts based on category and tags
 */
export function getRelatedPosts(
  currentSlug: string,
  category: BlogCategory,
  tags: string[],
  limit: number = 3
): BlogPostMeta[] {
  const allPosts = getAllPosts().filter((post) => post.slug !== currentSlug);

  // Score each post based on matching category and tags
  const scoredPosts = allPosts.map((post) => {
    let score = 0;

    // Category match is worth 2 points
    if (post.category === category) {
      score += 2;
    }

    // Each matching tag is worth 1 point
    const matchingTags = post.tags.filter((tag) =>
      tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
    );
    score += matchingTags.length;

    return { post, score };
  });

  // Sort by score descending, then by date descending
  scoredPosts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.date).getTime() - new Date(a.post.date).getTime();
  });

  return scoredPosts.slice(0, limit).map(({ post }) => post);
}

/**
 * Get all unique tags from all posts
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Generate RSS feed XML
 */
export function generateRssFeed(siteUrl: string): string {
  const posts = getAllPosts();

  const rssItems = posts
    .slice(0, 20) // Limit to 20 most recent posts
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      ${post.tags.map((tag) => `<category>${tag}</category>`).join("\n      ")}
      <author>noreply@reviewhub.com (${post.author.name})</author>
    </item>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ReviewHub Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Insights on customer experience, review management, and AI-powered analytics for mortgage professionals.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`;
}
