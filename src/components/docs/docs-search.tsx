"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlass as Search,
  FileText,
  X,
  ArrowRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getAllArticles, type DocArticle } from "@/lib/docs/content";

interface SearchResult extends DocArticle {
  section: string;
  sectionTitle: string;
}

interface DocsSearchProps {
  className?: string;
}

export function DocsSearch({ className }: DocsSearchProps) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  // Initialize Fuse.js
  const fuse = React.useMemo(() => {
    const articles = getAllArticles();
    return new Fuse(articles, {
      keys: [
        { name: "title", weight: 2 },
        { name: "description", weight: 1.5 },
        { name: "content", weight: 1 },
        { name: "tags", weight: 1.5 },
      ],
      threshold: 0.3,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }, []);

  // Search handler
  React.useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const searchResults = fuse.search(query).slice(0, 8);
    setResults(searchResults.map((r) => r.item));
    setIsOpen(searchResults.length > 0);
    setSelectedIndex(0);
  }, [query, fuse]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          navigateToResult(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setQuery("");
        break;
    }
  };

  // Navigate to result
  const navigateToResult = (result: SearchResult) => {
    router.push(`/docs/${result.section}/${result.slug}`);
    setQuery("");
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Close on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-label" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search documentation..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
          className="pl-10 pr-20"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
              }}
              className="p-1 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 rounded"
            >
              <X className="h-3.5 w-3.5 text-label" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-caption font-medium text-label">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border border-border bg-background shadow-elevation-4"
          >
            <div className="p-2">
              <p className="px-2 py-1.5 text-caption text-label">
                {results.length} result{results.length !== 1 ? "s" : ""} found
              </p>
              <div className="space-y-1">
                {results.map((result, index) => (
                  <button
                    key={`${result.section}-${result.slug}`}
                    onClick={() => navigateToResult(result)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      index === selectedIndex
                        ? "bg-repwell-sage-100 dark:bg-repwell-teal-300/15 text-heading"
                        : "hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 text-heading"
                    )}
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-label" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-body-sm truncate">
                        {result.title}
                      </p>
                      <p className="text-caption text-label truncate">
                        {result.sectionTitle} &middot; {result.description}
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 transition-opacity",
                        index === selectedIndex ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="border-t border-border/50 bg-background/50 px-4 py-2">
              <p className="text-caption text-label">
                <kbd className="rounded border border-border bg-white px-1">↑</kbd>{" "}
                <kbd className="rounded border border-border bg-white px-1">↓</kbd> to
                navigate,{" "}
                <kbd className="rounded border border-border bg-white px-1">↵</kbd> to
                select,{" "}
                <kbd className="rounded border border-border bg-white px-1">esc</kbd> to
                close
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
