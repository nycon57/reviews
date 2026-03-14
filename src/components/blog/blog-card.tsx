"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
} from "@phosphor-icons/react";
import { format } from "date-fns";
import { BlogPostMeta } from "@/types/blog";
import { fadeInUp } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BlogCardProps {
  post: BlogPostMeta;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Link href={`/blog/${post.slug}`}>
        <Card
          className={`h-full transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
            featured ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <CardHeader variant="plain" className="pb-3">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {post.category}
              </Badge>
              {featured && (
                <Badge variant="default" className="text-xs">
                  Featured
                </Badge>
              )}
            </div>
            <CardTitle className="line-clamp-2 text-lg leading-tight">
              {post.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {post.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{post.author.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(post.date), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{post.readingTime} min read</span>
              </div>
            </div>
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
