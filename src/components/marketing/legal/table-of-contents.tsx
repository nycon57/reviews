"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CaretDown as ChevronDown,
  Envelope as Mail,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  title: string;
  subsections?: { id: string; title: string }[];
}

interface TableOfContentsProps {
  sections: Section[];
  contactEmail?: string;
  className?: string;
}

export function TableOfContents({
  sections,
  contactEmail,
  className,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>("");
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Track active section on scroll
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

    // Observe all section headings
    const allIds = sections.flatMap((s) => [
      s.id,
      ...(s.subsections?.map((sub) => sub.id) || []),
    ]);

    allIds.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.offsetTop - 120;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
    // Close mobile menu after clicking
    setIsExpanded(false);
  };

  const navContent = (
    <>
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-repwell-teal-300 mb-6">
        On This Page
      </p>
      <nav>
        <ul className="space-y-2">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full text-left py-1.5 px-3 rounded-lg text-sm transition-colors",
                  activeId === section.id
                    ? "bg-repwell-sage-100 text-repwell-teal-500 font-semibold"
                    : "text-repwell-teal-400 font-medium hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
                )}
              >
                {section.title}
              </button>
              {/* Subsections */}
              {section.subsections && section.subsections.length > 0 && (
                <ul className="ml-4 mt-2 space-y-1 border-l border-repwell-sage-100 pl-3">
                  {section.subsections.map((sub) => (
                    <li key={sub.id}>
                      <button
                        onClick={() => scrollToSection(sub.id)}
                        className={cn(
                          "w-full text-left py-1 px-2 rounded text-xs transition-colors",
                          activeId === sub.id
                            ? "text-repwell-teal-500 font-medium"
                            : "text-repwell-teal-300 hover:text-repwell-teal-400"
                        )}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Contact Card */}
      {contactEmail && (
        <div className="mt-8 p-4 rounded-xl bg-repwell-sage-100/50 border border-repwell-sage-100">
          <p className="text-sm font-medium text-repwell-teal-500 mb-2">
            Questions?
          </p>
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center gap-2 text-sm text-repwell-teal-300 hover:text-repwell-teal-400 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {contactEmail}
          </a>
        </div>
      )}
    </>
  );

  return (
    <div className={cn("", className)}>
      {/* Mobile collapsible TOC */}
      <div className="lg:hidden">
        <Button
          variant="outline"
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
          <div className="p-4 bg-white rounded-xl border border-repwell-sage-100 shadow-sm mb-6">
            {navContent}
          </div>
        </motion.div>
      </div>

      {/* Desktop sticky TOC */}
      <div className="hidden lg:block sticky top-24">
        <div className="p-6 bg-white rounded-xl border border-repwell-sage-100 shadow-sm">
          {navContent}
        </div>
      </div>
    </div>
  );
}
