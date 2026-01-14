// Blog post types

export interface BlogAuthor {
  name: string;
  avatar?: string;
  role?: string;
}

export interface BlogPostFrontmatter {
  title: string;
  description: string;
  date: string;
  author: BlogAuthor;
  category: BlogCategory;
  tags: string[];
  image?: string;
  featured?: boolean;
}

export interface BlogPost extends BlogPostFrontmatter {
  slug: string;
  content: string;
  readingTime: number;
}

export interface BlogPostMeta extends BlogPostFrontmatter {
  slug: string;
  readingTime: number;
}

export type BlogCategory =
  | "Customer Experience"
  | "Review Management"
  | "AI & Analytics"
  | "Industry Insights"
  | "Product Updates"
  | "Best Practices";

export const BLOG_CATEGORIES: BlogCategory[] = [
  "Customer Experience",
  "Review Management",
  "AI & Analytics",
  "Industry Insights",
  "Product Updates",
  "Best Practices",
];
