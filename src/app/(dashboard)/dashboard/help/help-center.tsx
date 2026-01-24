"use client";

import { useState } from "react";
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
  ChatCircle as MessageCircle,
  MagnifyingGlass as Search,
  ArrowSquareOut as ExternalLink,
  VideoCamera as Video,
  Lightbulb,
  Shield,
  Gear as Settings,
  Users,
  ChartBar as BarChart3,
  PaperPlaneRight as Send,
  Star,
} from "@phosphor-icons/react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    id: "1",
    question: "How do I send a survey to a customer?",
    answer: "You can send surveys to customers in two ways: 1) Go to 'Send Survey' in the sidebar and fill out the customer details manually, or 2) Use the Distribution Queue to schedule and automate survey delivery. Both methods allow you to select a loan officer and survey template.",
    category: "surveys",
  },
  {
    id: "2",
    question: "What is NPS and how is it calculated?",
    answer: "NPS (Net Promoter Score) measures customer loyalty on a scale from -100 to +100. Customers who rate 9-10 are Promoters, 7-8 are Passives, and 0-6 are Detractors. NPS = % Promoters - % Detractors. A score above 50 is excellent, above 70 is world-class.",
    category: "analytics",
  },
  {
    id: "3",
    question: "How do I invite team members to my organization?",
    answer: "Navigate to 'Team' in the sidebar (requires Manager or Admin role), click 'Invite Member', enter their email address, select their role (Admin, Manager, or Loan Officer), and send the invitation. They'll receive an email to join your organization.",
    category: "team",
  },
  {
    id: "4",
    question: "What's the difference between user roles?",
    answer: "There are three roles: Admin (full access including billing and organization settings), Manager (can manage team members, view all analytics, and configure surveys), and Loan Officer (can view their own reviews and analytics, and receive customer surveys).",
    category: "team",
  },
  {
    id: "5",
    question: "How do I customize survey templates?",
    answer: "Go to 'Surveys' in the sidebar, then click 'Create Template' or edit an existing one. You can customize the questions, rating scales, and thank-you messages. Templates can be set as active or inactive based on your needs.",
    category: "surveys",
  },
  {
    id: "6",
    question: "Can customers leave reviews on external platforms?",
    answer: "Yes! After completing a survey, customers with high ratings (typically 4-5 stars) are prompted to share their experience on platforms like Google, Zillow, or other review sites you've configured in your organization settings.",
    category: "reviews",
  },
  {
    id: "7",
    question: "How does the reputation score work?",
    answer: "The reputation score is a composite metric that combines your average rating, NPS score, review volume, and response rate. Higher scores indicate better overall customer satisfaction and engagement. Scores are calculated for each loan officer and aggregated for the team.",
    category: "analytics",
  },
  {
    id: "8",
    question: "What are badges and how do I earn them?",
    answer: "Badges are achievements earned for hitting milestones like collecting your first review, reaching certain NPS scores, or maintaining high ratings. They appear on your profile and leaderboard, motivating healthy competition within your team.",
    category: "gamification",
  },
  {
    id: "9",
    question: "How do I schedule automated survey campaigns?",
    answer: "Go to 'Campaigns' in the sidebar, click 'New Campaign', and configure the timing, target audience, and survey template. You can create one-time campaigns, recurring schedules, or triggered campaigns based on loan events.",
    category: "campaigns",
  },
  {
    id: "10",
    question: "How can I export my data?",
    answer: "Most sections include an 'Export' button that generates a CSV file. You can export reviews, leaderboard rankings, analytics data, and campaign results. For API access or custom integrations, contact our support team.",
    category: "data",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics", icon: Book },
  { id: "surveys", label: "Surveys", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "team", label: "Team", icon: Users },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "campaigns", label: "Campaigns", icon: Send },
  { id: "gamification", label: "Gamification", icon: Lightbulb },
  { id: "data", label: "Data & Export", icon: Settings },
];

const QUICK_LINKS = [
  {
    title: "Getting Started Guide",
    description: "Learn the basics of RepWell",
    icon: Book,
    href: "#",
    badge: "New",
  },
  {
    title: "Video Tutorials",
    description: "Watch step-by-step tutorials",
    icon: Video,
    href: "#",
  },
  {
    title: "API Documentation",
    description: "Integrate with your systems",
    icon: FileText,
    href: "#",
  },
];

const SUPPORT_OPTIONS = [
  {
    title: "Email Support",
    description: "Get help via email within 24 hours",
    icon: Mail,
    action: "support@repwell.com",
    actionLabel: "Send Email",
  },
  {
    title: "Live Chat",
    description: "Chat with our support team",
    icon: MessageCircle,
    action: "#",
    actionLabel: "Start Chat",
  },
  {
    title: "Security",
    description: "Report security concerns",
    icon: Shield,
    action: "security@repwell.com",
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
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-12 text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-4 md:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Card key={link.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <link.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{link.title}</h3>
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
                  <AccordionTrigger className="text-left">
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
          <div className="grid gap-4 md:grid-cols-3">
            {SUPPORT_OPTIONS.map((option) => (
              <div
                key={option.title}
                className="flex flex-col items-center text-center p-6 rounded-lg border bg-muted/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">{option.title}</h3>
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
          <a href="mailto:support@repwell.com" className="text-primary hover:underline">
            Contact support
          </a>{" "}
          and we'll help you out.
        </p>
      </div>
    </div>
  );
}
