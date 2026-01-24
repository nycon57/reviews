"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  FileText,
  ChartBar,
  Gear,
  PuzzlePiece,
  Question,
  CaretDown,
  CaretRight,
  type IconProps,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { docSections } from "@/lib/docs/content";

type PhosphorIcon = React.ComponentType<IconProps>;

const iconMap: Record<string, PhosphorIcon> = {
  Rocket,
  FileText,
  BarChart3: ChartBar,
  Settings: Gear,
  Puzzle: PuzzlePiece,
  HelpCircle: Question,
};

interface DocsSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function DocsSidebar({ className, onNavigate }: DocsSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  // Expand the current section on mount
  React.useEffect(() => {
    const currentSection = docSections.find((section) =>
      pathname.includes(`/docs/${section.slug}`)
    );
    if (currentSection && !expandedSections.includes(currentSection.id)) {
      setExpandedSections((prev) => [...prev, currentSection.id]);
    }
  }, [pathname, expandedSections]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isSectionActive = (sectionSlug: string) =>
    pathname.includes(`/docs/${sectionSlug}`);

  return (
    <nav className={cn("space-y-1", className)} aria-label="Documentation">
      {docSections.map((section) => {
        const Icon = iconMap[section.icon] || FileText;
        const isExpanded = expandedSections.includes(section.id);
        const sectionActive = isSectionActive(section.slug);

        return (
          <div key={section.id} className="space-y-1">
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors",
                "hover:bg-repwell-sage-100/50",
                sectionActive
                  ? "text-repwell-teal-300 bg-repwell-sage-100/30"
                  : "text-repwell-teal-500"
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1 text-left">{section.title}</span>
              {isExpanded ? (
                <CaretDown size={16} className="shrink-0 text-repwell-teal-400" />
              ) : (
                <CaretRight size={16} className="shrink-0 text-repwell-teal-400" />
              )}
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="ml-4 space-y-1 border-l border-border/50 pl-3 py-1">
                    {section.articles.map((article) => {
                      const href = `/docs/${section.slug}/${article.slug}`;
                      const active = isActive(href);

                      return (
                        <Link
                          key={article.id}
                          href={href}
                          onClick={onNavigate}
                          className={cn(
                            "block rounded-md px-3 py-1.5 text-body-sm transition-colors",
                            active
                              ? "text-repwell-teal-300 font-medium bg-repwell-sage-100/40"
                              : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/30"
                          )}
                        >
                          {article.title}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}
