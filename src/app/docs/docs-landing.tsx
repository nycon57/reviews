"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Rocket,
  FileText,
  BarChart3,
  Settings,
  Puzzle,
  HelpCircle,
  ArrowRight,
  Book,
  Video,
  MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fadeInUp, staggerContainer, viewportOnce, cardHover } from "@/lib/motion";
import { docSections } from "@/lib/docs/content";

const iconMap: Record<string, React.ElementType> = {
  Rocket,
  FileText,
  BarChart3,
  Settings,
  Puzzle,
  HelpCircle,
};

const quickStartLinks = [
  {
    title: "Quick Start Guide",
    description: "Get up and running in 5 minutes",
    href: "/docs/getting-started/quick-start",
    icon: Rocket,
    badge: "Popular",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step video guides",
    href: "/docs/getting-started/introduction",
    icon: Video,
  },
  {
    title: "Contact Support",
    description: "Get help from our team",
    href: "mailto:support@repwell.com",
    icon: MessageCircle,
  },
];

export function DocsLanding() {
  return (
    <div className="space-y-12">
      {/* Hero */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="text-center"
      >
        <motion.div variants={fadeInUp}>
          <Badge variant="default" className="mb-4">
            Documentation
          </Badge>
        </motion.div>
        <motion.h1 variants={fadeInUp} className="text-display-md text-repwell-teal-500 mb-4">
          RepWell Documentation
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-body-lg text-repwell-teal-400 max-w-2xl mx-auto">
          Everything you need to know about using RepWell. From getting started
          to advanced integrations, find guides and tutorials for all features.
        </motion.p>
      </motion.section>

      {/* Quick Start */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeInUp} className="text-heading-lg text-repwell-teal-500 mb-6">
          Quick Links
        </motion.h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickStartLinks.map((link) => (
            <motion.div key={link.title} variants={fadeInUp}>
              <Link href={link.href}>
                <motion.div whileHover={cardHover}>
                  <Card className="h-full cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-repwell-teal-300/10">
                          <link.icon className="h-5 w-5 text-repwell-teal-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-repwell-teal-500">
                              {link.title}
                            </h3>
                            {link.badge && (
                              <Badge variant="secondary" className="text-caption">
                                {link.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-body-sm text-repwell-teal-400">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Documentation Sections */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.h2 variants={fadeInUp} className="text-heading-lg text-repwell-teal-500 mb-6">
          Browse by Topic
        </motion.h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {docSections.map((section) => {
            const Icon = iconMap[section.icon] || Book;
            const firstArticle = section.articles[0];

            return (
              <motion.div key={section.id} variants={fadeInUp}>
                <Link href={`/docs/${section.slug}/${firstArticle.slug}`}>
                  <motion.div whileHover={cardHover}>
                    <Card className="h-full cursor-pointer group">
                      <CardHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-sage-100 mb-3">
                          <Icon className="h-6 w-6 text-repwell-teal-300" />
                        </div>
                        <CardTitle className="group-hover:text-repwell-teal-300 transition-colors">
                          {section.title}
                        </CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {section.articles.slice(0, 3).map((article) => (
                            <li
                              key={article.id}
                              className="flex items-center gap-2 text-body-sm text-repwell-teal-400"
                            >
                              <ArrowRight className="h-3 w-3 text-border" />
                              {article.title}
                            </li>
                          ))}
                          {section.articles.length > 3 && (
                            <li className="text-body-sm text-repwell-teal-300 font-medium mt-2">
                              +{section.articles.length - 3} more articles
                            </li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* Help Banner */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeInUp}
        className="rounded-2xl bg-gradient-to-br from-repwell-teal-300 to-repwell-teal-500 p-8 text-center text-white"
      >
        <h2 className="text-heading-lg mb-3">Can't find what you're looking for?</h2>
        <p className="text-body-md opacity-90 mb-6 max-w-lg mx-auto">
          Our support team is here to help. Reach out and we'll get back to you
          within 24 hours.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:support@repwell.com"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-body-sm font-medium text-repwell-teal-500 transition-colors hover:bg-background"
          >
            <MessageCircle className="h-4 w-4" />
            Contact Support
          </a>
          <Link
            href="/docs/faq/general"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-2.5 text-body-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <HelpCircle className="h-4 w-4" />
            View FAQ
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
