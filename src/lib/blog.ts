import { createUntypedAdminClient } from "@/lib/supabase/admin";
import {
  BlogPost,
  BlogPostMeta,
  BlogCategory,
  BlogAuthor,
} from "@/types/blog";

/** The columns every list query selects — everything a card needs, minus the body. */
interface BlogPostMetaRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  image: string | null;
  featured: boolean;
  reading_time: number;
  status: string;
}

/** A full post row: the card columns plus the article body. */
interface BlogPostRow extends BlogPostMetaRow {
  content: string;
}

/**
 * `blog_posts` is absent from the generated schema, so every query here runs through the untyped
 * admin client and returns untyped rows. The assertions below are each anchored to a select list
 * that names exactly the columns on the asserted row type.
 */

function rowToPost(row: BlogPostRow): BlogPost {
  return {
    title: row.title,
    description: row.description,
    date: row.date,
    author: row.author,
    category: row.category,
    tags: row.tags,
    image: row.image ?? undefined,
    featured: row.featured,
    slug: row.slug,
    content: row.content,
    readingTime: row.reading_time,
  };
}

function rowToMeta(row: BlogPostMetaRow): BlogPostMeta {
  return {
    title: row.title,
    description: row.description,
    date: row.date,
    author: row.author,
    category: row.category,
    tags: row.tags,
    image: row.image ?? undefined,
    featured: row.featured,
    slug: row.slug,
    readingTime: row.reading_time,
  };
}

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
export async function getAllPostSlugs(): Promise<string[]> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published")
    .order("date", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !data) return null;
  // SAFETY: the `select("*")` above returns every `blog_posts` column, which is what
  // BlogPostRow names; `.single()` already rejected the empty and multi-row cases.
  return rowToPost(data as BlogPostRow);
}

/**
 * Get all blog posts with metadata only (no content)
 */
export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, description, date, author, category, tags, image, featured, reading_time, status"
    )
    .eq("status", "published")
    .order("date", { ascending: false });

  if (error || !data) return [];
  // SAFETY: the select list above names exactly the columns on BlogPostMetaRow.
  return (data as BlogPostMetaRow[]).map(rowToMeta);
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(
  category: BlogCategory
): Promise<BlogPostMeta[]> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, description, date, author, category, tags, image, featured, reading_time, status"
    )
    .eq("status", "published")
    .eq("category", category)
    .order("date", { ascending: false });

  if (error || !data) return [];
  // SAFETY: the select list above names exactly the columns on BlogPostMetaRow.
  return (data as BlogPostMetaRow[]).map(rowToMeta);
}

/**
 * Get posts by tag
 */
export async function getPostsByTag(tag: string): Promise<BlogPostMeta[]> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, description, date, author, category, tags, image, featured, reading_time, status"
    )
    .eq("status", "published")
    .contains("tags", [tag.toLowerCase()])
    .order("date", { ascending: false });

  if (error || !data) return [];
  // SAFETY: the select list above names exactly the columns on BlogPostMetaRow.
  return (data as BlogPostMetaRow[]).map(rowToMeta);
}

/**
 * Get featured posts
 */
export async function getFeaturedPosts(): Promise<BlogPostMeta[]> {
  const supabase = createUntypedAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      "id, slug, title, description, date, author, category, tags, image, featured, reading_time, status"
    )
    .eq("status", "published")
    .eq("featured", true)
    .order("date", { ascending: false });

  if (error || !data) return [];
  // SAFETY: the select list above names exactly the columns on BlogPostMetaRow.
  return (data as BlogPostMetaRow[]).map(rowToMeta);
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(
  currentSlug: string,
  category: BlogCategory,
  tags: string[],
  limit: number = 3
): Promise<BlogPostMeta[]> {
  const allPosts = await getAllPosts();
  const filtered = allPosts.filter((post) => post.slug !== currentSlug);

  // Score each post based on matching category and tags
  const scoredPosts = filtered.map((post) => {
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
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

