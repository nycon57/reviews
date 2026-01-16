"use client";

import * as React from "react";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Star,
  BarChart3,
  MessageSquare,
  Zap,
  Send,
  LineChart,
  Target,
  Brain,
  Shield,
  Globe,
  Smartphone,
  Users,
  Bell,
  FileText,
  TrendingUp,
  Award,
} from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { staggerContainer, fadeInUp } from "@/lib/motion";

interface FeatureCategorySectionProps {
  category: {
    title: string;
    description: string;
    features: {
      icon: React.ReactNode;
      title: string;
      description: string;
    }[];
  };
  index: number;
}

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section className="py-16 md:py-24">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={staggerContainer}
        className="container mx-auto px-4 text-center"
      >
        <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
          Ready to Transform Your Customer Experience?
        </motion.h2>
        <motion.p
          variants={fadeInUp}
          className="mx-auto mb-8 max-w-xl text-muted-foreground"
        >
          Join thousands of mortgage professionals using RepWell to collect
          more reviews and build stronger client relationships.
        </motion.p>
        <motion.div variants={fadeInUp}>
          <a href="/signup">
            <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              Get Started Free
            </button>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeatureCategorySection({ category, index }: FeatureCategorySectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      className={`py-16 md:py-24 ${index % 2 === 0 ? "bg-muted/50" : ""}`}
    >
      <div className="container mx-auto px-4">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">{category.title}</h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              {category.description}
            </p>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {category.features.map((feature) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const featureCategories = [
  {
    title: "Review Collection",
    description:
      "Automate review collection with smart surveys and follow-ups",
    features: [
      {
        icon: <Star className="h-6 w-6" />,
        title: "Automated Surveys",
        description:
          "Send surveys at the perfect moment with automatic reminders for maximum response rates.",
      },
      {
        icon: <Send className="h-6 w-6" />,
        title: "Multi-channel Distribution",
        description:
          "Reach customers via email, SMS, or QR codes - wherever they are most responsive.",
      },
      {
        icon: <Target className="h-6 w-6" />,
        title: "NPS & CSAT Tracking",
        description:
          "Measure customer loyalty and satisfaction with industry-standard metrics.",
      },
      {
        icon: <FileText className="h-6 w-6" />,
        title: "Custom Templates",
        description:
          "Create branded survey templates with your logo, colors, and custom questions.",
      },
    ],
  },
  {
    title: "Analytics & Insights",
    description: "Understand your performance with real-time data and trends",
    features: [
      {
        icon: <BarChart3 className="h-6 w-6" />,
        title: "Real-time Dashboards",
        description:
          "Track reviews, ratings, and metrics in real-time with intuitive dashboards.",
      },
      {
        icon: <LineChart className="h-6 w-6" />,
        title: "Trend Analysis",
        description:
          "Identify patterns and trends in customer feedback over time.",
      },
      {
        icon: <TrendingUp className="h-6 w-6" />,
        title: "Performance Reports",
        description:
          "Generate detailed reports for individuals, teams, or the entire organization.",
      },
      {
        icon: <Award className="h-6 w-6" />,
        title: "Leaderboards",
        description:
          "Motivate teams with gamification and competitive leaderboards.",
      },
    ],
  },
  {
    title: "AI-Powered Features",
    description: "Leverage artificial intelligence for deeper insights",
    features: [
      {
        icon: <Brain className="h-6 w-6" />,
        title: "Sentiment Analysis",
        description:
          "Automatically analyze review text to understand customer sentiment.",
      },
      {
        icon: <MessageSquare className="h-6 w-6" />,
        title: "AI Response Suggestions",
        description:
          "Get intelligent response suggestions for reviews based on context and tone.",
      },
      {
        icon: <FileText className="h-6 w-6" />,
        title: "Testimonial Generator",
        description:
          "Extract and format marketing-ready testimonials from positive reviews.",
      },
      {
        icon: <TrendingUp className="h-6 w-6" />,
        title: "AI Insights",
        description:
          "Discover themes and improvement opportunities with AI-powered analysis.",
      },
    ],
  },
  {
    title: "Integrations & Automation",
    description: "Connect with your existing tools and workflows",
    features: [
      {
        icon: <Globe className="h-6 w-6" />,
        title: "Google Business Profile",
        description:
          "Sync and manage Google reviews directly from the platform.",
      },
      {
        icon: <Zap className="h-6 w-6" />,
        title: "Zapier Integration",
        description:
          "Connect with thousands of apps via Zapier triggers and actions.",
      },
      {
        icon: <Shield className="h-6 w-6" />,
        title: "Webhook System",
        description:
          "Integrate with your LOS or CRM via secure webhook endpoints.",
      },
      {
        icon: <FileText className="h-6 w-6" />,
        title: "Public API",
        description:
          "Build custom integrations with our comprehensive REST API.",
      },
    ],
  },
  {
    title: "Team & Mobile",
    description: "Empower your team on any device",
    features: [
      {
        icon: <Users className="h-6 w-6" />,
        title: "Team Management",
        description:
          "Organize users by branch, region, or role with fine-grained permissions.",
      },
      {
        icon: <Smartphone className="h-6 w-6" />,
        title: "Mobile App",
        description:
          "Access dashboards and respond to reviews on the go with our mobile app.",
      },
      {
        icon: <Bell className="h-6 w-6" />,
        title: "Smart Notifications",
        description:
          "Get instant alerts for new reviews, especially negative ones requiring attention.",
      },
      {
        icon: <Shield className="h-6 w-6" />,
        title: "Role-based Access",
        description:
          "Control access with Admin, Manager, and Loan Officer roles.",
      },
    ],
  },
];

export function FeaturesPageClient() {
  return (
    <>
      <HeroSection
        subtitle="Features"
        title="Everything You Need to Manage Customer Experience"
        description="A complete platform for collecting reviews, tracking metrics, and building your reputation. From automated surveys to AI-powered insights."
        cta={[
          { label: "Start Free Trial", href: "/signup" },
          { label: "View Pricing", href: "/pricing", variant: "outline" },
        ]}
      />

      {featureCategories.map((category, categoryIndex) => (
        <FeatureCategorySection
          key={category.title}
          category={category}
          index={categoryIndex}
        />
      ))}

      {/* CTA Section */}
      <CTASection />
    </>
  );
}
