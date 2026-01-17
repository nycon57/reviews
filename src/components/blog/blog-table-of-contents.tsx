"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface BlogTableOfContentsProps {
  /** Headings extracted from the article */
  headings: Heading[];
  /** Additional className */
  className?: string;
}

export function BlogTableOfContents({
  headings,
  className,
}: BlogTableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Track active heading on scroll
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-100px 0px -60% 0px",
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
    setIsExpanded(false);
  };

  if (headings.length === 0) return null;

  const navContent = (
    <>
      <p className="font-display text-sm font-semibold text-repwell-teal-500 uppercase tracking-wider mb-3">
        Contents
      </p>
      <nav>
        <ul className="space-y-1">
          {headings.map((heading) => (
            <li
              key={heading.id}
              style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
            >
              <button
                onClick={() => scrollToHeading(heading.id)}
                className={cn(
                  "w-full text-left py-1.5 px-2 rounded text-sm transition-colors",
                  activeId === heading.id
                    ? "bg-repwell-sage-100 text-repwell-teal-500 font-medium"
                    : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {heading.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );

  return (
    <div className={cn("", className)}>
      {/* Mobile collapsible TOC */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between mb-4"
        >
          <span>Table of Contents</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </Button>
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="p-4 bg-white rounded-xl border border-repwell-sage-100 mb-6">
            {navContent}
          </div>
        </motion.div>
      </div>

      {/* Desktop sticky TOC */}
      <div className="hidden lg:block sticky top-24">
        <div className="p-5 bg-white rounded-xl border border-repwell-sage-100 shadow-sm">
          {navContent}
        </div>
      </div>
    </div>
  );
}
