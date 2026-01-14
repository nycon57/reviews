"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BlogCategory, BLOG_CATEGORIES } from "@/types/blog";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function CategoryFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") as BlogCategory | null;

  const handleCategoryChange = (category: BlogCategory | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("category", category);
    } else {
      params.delete("category");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <ScrollArea className="w-full whitespace-nowrap pb-2">
      <div className="flex gap-2">
        <Button
          variant={currentCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => handleCategoryChange(null)}
          className="shrink-0"
        >
          All Posts
        </Button>
        {BLOG_CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={currentCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(category)}
            className="shrink-0"
          >
            {category}
          </Button>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
