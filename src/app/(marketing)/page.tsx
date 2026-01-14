"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Star, BarChart3, MessageSquare, Zap } from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/motion";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <HeroSection
        title={
          <>
            Customer Experience
            <br />
            <span className="text-primary">Management Platform</span>
          </>
        }
        description="Collect reviews, track satisfaction metrics, and gain AI-powered insights to deliver exceptional customer experiences. Built for mortgage professionals."
        cta={[
          { label: "Start Free Trial", href: "/auth/sign-up" },
          { label: "Watch Demo", href: "/demo", variant: "outline" },
        ]}
      />

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center text-3xl font-bold"
            >
              Everything You Need
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Star className="h-6 w-6" />}
                title="Review Collection"
                description="Automated surveys sent at the perfect moment, with reminders to maximize response rates."
              />
              <FeatureCard
                icon={<BarChart3 className="h-6 w-6" />}
                title="Analytics & NPS"
                description="Track NPS, CSAT, and satisfaction trends with real-time dashboards and reports."
              />
              <FeatureCard
                icon={<MessageSquare className="h-6 w-6" />}
                title="AI Insights"
                description="Sentiment analysis and AI-generated summaries reveal what customers really think."
              />
              <FeatureCard
                icon={<Zap className="h-6 w-6" />}
                title="Integrations"
                description="Connect with Google Business, your LOS, and thousands of apps via Zapier."
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="mb-4 text-3xl font-bold"
          >
            Ready to Get Started?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mb-8 text-muted-foreground max-w-xl mx-auto"
          >
            Join thousands of mortgage professionals who use ReviewHub to collect
            more reviews and build their reputation.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center gap-4">
            <Link href="/auth/sign-up">
              <Button size="lg">Start Free Trial</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Contact Sales
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
