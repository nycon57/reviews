"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  FileText,
  Envelope as Mail,
  MagnifyingGlass as Search,
  ArrowSquareOut as ExternalLink,
  Shield,
  Gear as Settings,
  Users,
  ChartBar as BarChart3,
  PaperPlaneRight as Send,
  Star,
} from "@phosphor-icons/react";
import { SECURITY_EMAIL, SUPPORT_EMAIL } from "@/lib/brand";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "1",
    question: "How do I send a review request?",
    answer: "Use the Send review request button on your dashboard, or open Reviews and choose the Requests tab. From there you can send a text, email, or video request to a contact and track its status.",
    category: "requests",
  },
  {
    id: "2",
    question: "What is NPS and how is it calculated?",
    answer: "NPS (Net Promoter Score) measures customer loyalty on a scale from -100 to +100. Customers who rate 9-10 are Promoters, 7-8 are Passives, and 0-6 are Detractors. NPS = % Promoters - % Detractors. A score above 50 is excellent, above 70 is world-class.",
    category: "analytics",
  },
  {
    id: "3",
    question: "Where do I manage reviews, videos, and requests?",
    answer: "Open Reviews from the sidebar. The hub includes Text Reviews, Videos, Requests, Contacts, Share Studio, and Disputes, depending on your account permissions.",
    category: "reviews",
  },
  {
    id: "4",
    question: "How do contacts work?",
    answer: "Contacts live in the Contacts tab inside Reviews. They are created as you send review or video requests, and you can import contacts when you need to build a list before outreach.",
    category: "contacts",
  },
  {
    id: "5",
    question: "How do I invite people to my workspace?",
    answer: "Enterprise managers and admins can open People from the sidebar to manage members and employees. Individual accounts do not use the People management flow.",
    category: "people",
  },
  {
    id: "6",
    question: "What's the difference between user roles?",
    answer: "Enterprise workspaces use Admin, Manager, and User roles. Admins manage billing and workspace settings, managers can oversee team workflows, and users focus on their own reviews, requests, and profile.",
    category: "people",
  },
  {
    id: "7",
    question: "How do I create a survey?",
    answer: "Open Surveys from the Manage section to create and edit customer feedback surveys. Use EX Surveys for employee experience surveys.",
    category: "surveys",
  },
  {
    id: "8",
    question: "Can customers leave reviews on external platforms?",
    answer: "Yes. You can connect review sources and configure links in Workspace settings so happy customers can continue to platforms like Google, Facebook, and Yelp.",
    category: "reviews",
  },
  {
    id: "9",
    question: "How do campaigns work?",
    answer: "Campaigns combines sequences and email templates. Use it to build outreach workflows, choose audiences, and manage reusable messaging for review request follow-up.",
    category: "campaigns",
  },
  {
    id: "10",
    question: "How can I export or connect my data?",
    answer: "Use export controls where they appear in Reviews, Analytics, and related tables. For integrations, webhooks, API keys, and billing, open Workspace from the Manage section or contact support.",
    category: "data",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics", icon: Book },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "requests", label: "Requests", icon: Send },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "people", label: "People", icon: Users },
  { id: "surveys", label: "Surveys", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "campaigns", label: "Campaigns", icon: Send },
  { id: "data", label: "Data & Export", icon: Settings },
];

const QUICK_LINKS = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of RepWell",
    icon: Book,
    href: "/docs/getting-started",
    badge: "New",
  },
  {
    title: "API Documentation",
    description: "Integrate with your systems",
    icon: FileText,
    href: "/docs/developers",
  },
];

const SUPPORT_OPTIONS = [
  {
    title: "Email Support",
    description: "Get help via email within 24 hours",
    icon: Mail,
    action: SUPPORT_EMAIL,
    actionLabel: "Send Email",
  },
  {
    title: "Security",
    description: "Report security concerns",
    icon: Shield,
    action: SECURITY_EMAIL,
    actionLabel: "Report Issue",
  },
];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredFAQ = FAQ_ITEMS.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search help articles"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <Link key={link.title} href={link.href} className="block">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <link.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold">{link.title}</h3>
                      {link.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {link.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.description}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to the most common questions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-1.5"
              >
                <category.icon className="h-3.5 w-3.5" />
                {category.label}
              </Button>
            ))}
          </div>

          {/* FAQ accordion */}
          {filteredFAQ.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQ.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-sm text-left">
                    <div className="flex items-center gap-3">
                      <span>{item.question}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No results found for your search.</p>
              <p className="text-sm mt-1">Try different keywords or browse all topics.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Support options */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>
            Contact our support team for personalized assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {SUPPORT_OPTIONS.map((option) => (
              <div
                key={option.title}
                className="flex flex-col items-center text-center p-6 rounded-lg border bg-muted/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold">{option.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  {option.description}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={option.action.includes("@") ? `mailto:${option.action}` : option.action}
                  >
                    {option.actionLabel}
                  </a>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="text-center text-sm text-muted-foreground py-4">
        <p>
          Can't find what you're looking for?{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-medium text-repwell-teal-400 underline">
            Contact support
          </a>{" "}
          and we'll help you out.
        </p>
      </div>
    </div>
  );
}
