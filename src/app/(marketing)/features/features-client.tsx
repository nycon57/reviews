"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star,
  ChartBar as BarChart3,
  Chats as MessageSquare,
  Lightning as Zap,
  PaperPlaneRight as Send,
  ChartLine as LineChart,
  Target,
  Brain,
  Shield,
  Globe,
  DeviceMobile as Smartphone,
  Users,
  Bell,
  FileText,
  TrendUp as TrendingUp,
  Medal as Award,
  CheckCircle,
  ArrowRight,
} from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, staggerChildrenDelayed, blobFloat, blobFloatRotate, viewportOnce } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrowserMockup } from "@/components/marketing/browser-mockup";
import { IntegrationsGrid } from "@/components/marketing/integrations-grid";
import { StatsSectionDark } from "@/components/marketing/stats-section-dark";
import { CTASection } from "@/components/marketing/cta-section";
import { cn } from "@/lib/utils";

// Feature categories with icons
const featureCategories = [
  {
    id: "reviews",
    icon: Star,
    title: "Automated Review Collection",
    tabName: "Reviews",
    description: "Perfectly-timed surveys sent when loans close, with smart reminders that maximize response rates without annoying clients.",
    features: [
      { icon: Star, title: "Automated Surveys", description: "Send surveys at the perfect moment with automatic reminders for maximum response rates." },
      { icon: Send, title: "Multi-channel Distribution", description: "Reach customers via email, SMS, or QR codes - wherever they are most responsive." },
      { icon: Target, title: "NPS & CSAT Tracking", description: "Measure customer loyalty and satisfaction with industry-standard metrics." },
      { icon: FileText, title: "Custom Templates", description: "Create branded survey templates with your logo, colors, and custom questions." },
    ],
    stat: { value: "3x", label: "more reviews collected" },
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop&q=80",
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Real-Time Analytics & NPS",
    tabName: "Analytics",
    description: "Track NPS, CSAT, and satisfaction trends across your organization with real-time dashboards and scheduled reports.",
    features: [
      { icon: BarChart3, title: "Real-time Dashboards", description: "Track reviews, ratings, and metrics in real-time with intuitive dashboards." },
      { icon: LineChart, title: "Trend Analysis", description: "Identify patterns and trends in customer feedback over time." },
      { icon: TrendingUp, title: "Performance Reports", description: "Generate detailed reports for individuals, teams, or the entire organization." },
      { icon: Award, title: "Leaderboards", description: "Motivate teams with gamification and competitive leaderboards." },
    ],
    stat: { value: "42%", label: "avg response rate" },
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=800&fit=crop&q=80",
  },
  {
    id: "ai",
    icon: Brain,
    title: "AI-Powered Insights",
    tabName: "AI Insights",
    description: "Sentiment analysis and AI-generated summaries reveal what customers really think, with actionable recommendations.",
    features: [
      { icon: Brain, title: "Sentiment Analysis", description: "Automatically analyze review text to understand customer sentiment." },
      { icon: MessageSquare, title: "AI Response Suggestions", description: "Get intelligent response suggestions for reviews based on context and tone." },
      { icon: FileText, title: "Testimonial Generator", description: "Extract and format marketing-ready testimonials from positive reviews." },
      { icon: TrendingUp, title: "AI Insights", description: "Discover themes and improvement opportunities with AI-powered analysis." },
    ],
    stat: { value: "94%", label: "accuracy rate" },
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=800&fit=crop&q=80",
  },
  {
    id: "amplify",
    icon: Zap,
    title: "Reputation Amplification",
    tabName: "Amplify",
    description: "Route positive reviews to Google and Zillow. Capture video testimonials. Publish to social media with one click.",
    features: [
      { icon: Globe, title: "Google Business Profile", description: "Sync and manage Google reviews directly from the platform." },
      { icon: Zap, title: "One-Click Publishing", description: "Publish positive reviews to major platforms with a single click." },
      { icon: Users, title: "Video Testimonials", description: "Capture and edit video testimonials from satisfied clients." },
      { icon: Bell, title: "Social Media Sharing", description: "Automated social media sharing to amplify your best reviews." },
    ],
    stat: { value: "+300%", label: "review volume increase" },
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1200&h=800&fit=crop&q=80",
  },
  {
    id: "team",
    icon: Users,
    title: "Team & Mobile",
    tabName: "Team",
    description: "Empower every team member with mobile access, role-based permissions, and smart notifications.",
    features: [
      { icon: Users, title: "Team Management", description: "Organize users by branch, region, or role with fine-grained permissions." },
      { icon: Smartphone, title: "Mobile App", description: "Access dashboards and respond to reviews on the go with our mobile app." },
      { icon: Bell, title: "Smart Notifications", description: "Get instant alerts for new reviews, especially negative ones requiring attention." },
      { icon: Shield, title: "Role-based Access", description: "Control access with Admin, Manager, and Loan Officer roles." },
    ],
    stat: { value: "24/7", label: "mobile access" },
    image: "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&h=800&fit=crop&q=80",
  },
];

// Hero Section Component
function FeaturesHero() {
  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background gradient blobs */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloat}
        className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-repwell-sage-100/40 to-repwell-teal-300/10 blur-3xl"
      />
      <motion.div
        initial="initial"
        animate="animate"
        variants={blobFloatRotate}
        className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-repwell-teal-300/10 to-repwell-sage-100/30 blur-3xl"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildrenDelayed}
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
              >
                Platform Features
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
            >
              Everything You Need to{" "}
              <span className="text-repwell-teal-300">Manage Reviews</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed mb-8"
            >
              A complete platform for collecting reviews, tracking metrics, and building your reputation. From automated surveys to AI-powered insights.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <Link href="/signup">
                <Button size="lg" className="shadow-lg shadow-repwell-teal-300/20">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View Pricing
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Browser Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hidden lg:block"
          >
            <BrowserMockup
              url="app.repwell.com/dashboard"
              className="shadow-2xl"
            >
              <div className="aspect-[16/10] bg-gradient-to-br from-repwell-sage-100/50 to-white p-6">
                {/* Mock dashboard content */}
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-1">
                    <div className="h-4 w-32 bg-repwell-teal-300/20 rounded" />
                    <div className="h-3 w-24 bg-repwell-sage-200/30 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-20 bg-repwell-teal-300 rounded-lg" />
                    <div className="h-8 w-8 bg-repwell-sage-200/50 rounded-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Reviews", value: "1,234" },
                    { label: "Avg Rating", value: "4.8" },
                    { label: "NPS Score", value: "72" },
                    { label: "Response Rate", value: "45%" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 shadow-sm">
                      <div className="text-xs text-repwell-teal-400 mb-1">{stat.label}</div>
                      <div className="text-lg font-bold text-repwell-teal-500">{stat.value}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <div className="h-3 w-28 bg-repwell-teal-300/20 rounded" />
                    <div className="h-3 w-16 bg-repwell-sage-200/30 rounded" />
                  </div>
                  <div className="space-y-2">
                    {[0.8, 0.6, 0.9, 0.7, 0.5].map((width, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2 flex-1 bg-repwell-sage-100 rounded-full">
                          <div
                            className="h-full bg-repwell-teal-300 rounded-full"
                            style={{ width: `${width * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </BrowserMockup>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Feature Tab Component
function FeatureTab({
  category,
  isActive,
  onClick,
}: {
  category: typeof featureCategories[0];
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = category.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-lg font-sans font-medium text-sm md:text-base transition-all duration-200",
        isActive
          ? "text-white"
          : "text-repwell-teal-400 hover:text-repwell-teal-500 hover:bg-repwell-sage-100/50"
      )}
    >
      {isActive && (
        <motion.div
          layoutId="featureTabActiveBg"
          className="absolute inset-0 bg-repwell-teal-300 rounded-lg"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <Icon className={cn("relative z-10 w-4 h-4 transition-transform duration-300", isActive && "scale-110")} />
      <span className="relative z-10">{category.tabName}</span>
    </button>
  );
}

// Feature Detail Section
function FeatureDetailSection({
  category,
  index,
}: {
  category: typeof featureCategories[0];
  index: number;
}) {
  const isReversed = index % 2 === 1;

  return (
    <section
      id={category.id}
      className={cn(
        "py-16 md:py-24 lg:py-32 scroll-mt-20",
        index % 2 === 0 ? "bg-white" : "bg-repwell-sage-100/30"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center",
          isReversed && "lg:grid-flow-dense"
        )}>
          {/* Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className={isReversed ? "lg:col-start-2" : ""}
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-teal-300 text-white shadow-lg shadow-repwell-teal-300/20">
                <category.icon className="h-7 w-7" />
              </div>
              {category.stat && (
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-repwell-teal-300">
                    {category.stat.value}
                  </span>
                  <span className="text-sm text-repwell-teal-400">
                    {category.stat.label}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4"
            >
              {category.title}
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-teal-400 leading-relaxed mb-8"
            >
              {category.description}
            </motion.p>

            <motion.ul variants={fadeInUp} className="space-y-4">
              {category.features.map((feature, i) => (
                <motion.li
                  key={feature.title}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-repwell-teal-500">{feature.title}: </span>
                    <span className="text-repwell-teal-400">{feature.description}</span>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={isReversed ? "lg:col-start-1" : ""}
          >
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/20 to-transparent" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Feature Tabs Section
function FeatureTabsSection() {
  const [activeTab, setActiveTab] = React.useState(featureCategories[0].id);
  const activeIndex = featureCategories.findIndex((c) => c.id === activeTab);
  const activeCategory = featureCategories[activeIndex] || featureCategories[0];
  const isReversed = activeIndex % 2 === 1;

  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white overflow-hidden">
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Badge
            variant="outline"
            className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
          >
            Core Features
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4">
            Explore What&apos;s Possible
          </h2>
          <p className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto">
            From automated review collection to AI-powered insights, see how RepWell can transform your customer experience.
          </p>
        </motion.div>
      </div>

      {/* Tab navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 lg:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 md:gap-4"
        >
          {featureCategories.map((category) => (
            <FeatureTab
              key={category.id}
              category={category}
              isActive={activeTab === category.id}
              onClick={() => setActiveTab(category.id)}
            />
          ))}
        </motion.div>
      </div>

      {/* Active feature content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center`}
        >
          {/* Text content */}
          <div className={isReversed ? "lg:order-2" : ""}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-repwell-teal-300 text-white shadow-lg shadow-repwell-teal-300/20">
                <activeCategory.icon className="h-7 w-7" />
              </div>
              {activeCategory.stat && (
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-repwell-teal-300">
                    {activeCategory.stat.value}
                  </span>
                  <span className="text-sm text-repwell-teal-400">
                    {activeCategory.stat.label}
                  </span>
                </div>
              )}
            </div>

            <h3 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-4">
              {activeCategory.title}
            </h3>

            <p className="text-lg text-repwell-teal-400 leading-relaxed mb-8">
              {activeCategory.description}
            </p>

            <ul className="space-y-4">
              {activeCategory.features.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-repwell-sage-200 flex-shrink-0 mt-1" />
                  <div>
                    <span className="font-medium text-repwell-teal-500">{feature.title}: </span>
                    <span className="text-repwell-teal-400">{feature.description}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Image */}
          <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl ${isReversed ? "lg:order-1" : ""}`}>
            <img
              src={activeCategory.image}
              alt={activeCategory.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/20 to-transparent" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function FeaturesPageClient() {
  return (
    <>
      {/* Hero with browser mockup */}
      <FeaturesHero />

      {/* Feature tabs showcase */}
      <FeatureTabsSection />

      {/* Integrations */}
      <IntegrationsGrid
        badge="Integrations"
        heading="Connect Your Existing Tools"
        subheading="RepWell integrates seamlessly with the platforms your team already uses."
      />

      {/* Stats */}
      <StatsSectionDark heading="Powering Reputation Growth" />

      {/* CTA */}
      <CTASection variant="gradient" />
    </>
  );
}
