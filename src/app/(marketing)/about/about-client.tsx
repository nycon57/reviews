"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Target,
  Heart,
  Lightbulb,
  Shield,
  Users,
  Sparkle as Sparkles,
  ArrowRight,
} from "@phosphor-icons/react";
import { fadeInUp, staggerContainer, staggerChildrenDelayed, blobFloat, blobFloatRotate, viewportOnce } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/marketing/cta-section";
import { cn } from "@/lib/utils";

const values = [
  {
    icon: Target,
    title: "Customer-Centric",
    description: "Everything we build starts with the customer experience. We obsess over making every interaction smooth and valuable.",
  },
  {
    icon: Heart,
    title: "Transparency",
    description: "We believe in honest feedback and open communication. Our pricing is clear, our practices are ethical.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We leverage cutting-edge technology, including AI, to deliver insights that truly matter to our customers.",
  },
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We protect your data like it's our own. Enterprise-grade security is built into everything we do.",
  },
  {
    icon: Users,
    title: "Partnership",
    description: "We see ourselves as an extension of your team. Your success is our success.",
  },
  {
    icon: Sparkles,
    title: "Excellence",
    description: "We're never satisfied with 'good enough'. We continuously improve our platform and service.",
  },
];

const timeline = [
  {
    year: "2023",
    title: "The Beginning",
    description: "RepWell was founded with a simple mission: help mortgage professionals build trust through authentic customer feedback.",
  },
  {
    year: "2024",
    title: "Platform Launch",
    description: "Launched our full-featured platform with survey automation, analytics dashboards, and team management capabilities.",
  },
  {
    year: "2024",
    title: "AI Integration",
    description: "Introduced AI-powered sentiment analysis and response suggestions, transforming how teams handle customer feedback.",
  },
  {
    year: "2025",
    title: "Mobile & Integrations",
    description: "Released mobile apps and expanded integrations with Google Business, Zapier, and popular LOS platforms.",
  },
  {
    year: "Future",
    title: "What's Next",
    description: "Continuing to innovate with advanced AI features, industry benchmarks, and tools that help you deliver exceptional experiences.",
  },
];

// Hero Section
function AboutHero() {
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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildrenDelayed}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
            >
              About Us
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-display text-4xl sm:text-5xl md:text-6xl font-bold text-repwell-teal-500 tracking-tight mb-6"
          >
            Building Trust Through{" "}
            <span className="text-repwell-teal-300">Customer Feedback</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg md:text-xl text-repwell-teal-400 leading-relaxed"
          >
            We're on a mission to help mortgage professionals collect, manage, and leverage customer reviews to grow their business and build lasting relationships.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// Mission Section with floating images
function MissionSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-sage-100/30 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Floating Images */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative h-[400px] lg:h-[500px] hidden md:block"
          >
            {/* Main image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="absolute top-0 left-0 w-[60%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=750&fit=crop&q=80"
                alt="Team collaborating"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Secondary image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute bottom-0 right-0 w-[55%] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-4 border-white"
            >
              <img
                src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&h=750&fit=crop&q=80"
                alt="Professional meeting"
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute top-1/2 right-[35%] w-16 h-16 bg-repwell-teal-300 rounded-xl rotate-12"
            />
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute bottom-[20%] left-[45%] w-8 h-8 bg-repwell-sage-200 rounded-lg -rotate-6"
            />
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
              >
                Our Mission
              </Badge>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500 mb-6"
            >
              Trust Is Everything in the Mortgage Industry
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-teal-400 leading-relaxed mb-4"
            >
              Every professional knows that referrals and reputation drive business. Yet collecting and managing customer feedback has traditionally been fragmented, manual, and time-consuming.
            </motion.p>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-teal-400 leading-relaxed mb-8"
            >
              RepWell changes that. We've built a comprehensive platform that automates review collection, surfaces actionable insights through AI, and helps you showcase the great work you do—all while saving you hours every week.
            </motion.p>

            <motion.div variants={fadeInUp}>
              <Link href="/features">
                <Button className="group">
                  Explore Our Platform
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Values Section
function ValuesSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Our Values
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            What We Stand For
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            Our values guide every decision we make and every feature we build.
          </motion.p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="bg-white rounded-xl border border-repwell-sage-100 p-6 lg:p-8 shadow-sm hover:shadow-md transition-all"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10 text-repwell-teal-300">
                <value.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold text-repwell-teal-500 mb-2">
                {value.title}
              </h3>
              <p className="text-repwell-teal-400 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Timeline Section
function TimelineSection() {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-repwell-sage-100/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="text-center mb-12 md:mb-16"
        >
          <motion.div variants={fadeInUp}>
            <Badge
              variant="outline"
              className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
            >
              Our Journey
            </Badge>
          </motion.div>

          <motion.h2
            variants={fadeInUp}
            className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 mb-4"
          >
            Growing With You
          </motion.h2>

          <motion.p
            variants={fadeInUp}
            className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto"
          >
            From our founding to today, we've been focused on one thing: helping you build trust.
          </motion.p>
        </motion.div>

        {/* Timeline */}
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-repwell-sage-200 md:-translate-x-1/2" />

          {timeline.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative mb-8 md:mb-12 flex items-start gap-6",
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              )}
            >
              {/* Timeline dot */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                className="absolute left-4 md:left-1/2 z-10 h-4 w-4 rounded-full bg-repwell-teal-300 border-4 border-white shadow md:-translate-x-1/2"
              />

              {/* Content card */}
              <div
                className={cn(
                  "ml-12 md:ml-0 flex-1 rounded-xl border border-repwell-sage-100 bg-white p-5 shadow-sm",
                  index % 2 === 0 ? "md:mr-8 md:text-right" : "md:ml-8"
                )}
              >
                <span className="inline-block rounded-full bg-repwell-teal-300/10 px-3 py-1 text-xs font-semibold text-repwell-teal-300 mb-2">
                  {item.year}
                </span>
                <h3 className="font-display font-semibold text-repwell-teal-500 mb-1">
                  {item.title}
                </h3>
                <p className="text-sm text-repwell-teal-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutPageClient() {
  return (
    <>
      {/* Hero */}
      <AboutHero />

      {/* Mission Section */}
      <MissionSection />

      {/* Values */}
      <ValuesSection />

      {/* Timeline */}
      <TimelineSection />

      {/* CTA */}
      <CTASection
        variant="dark"
        title="Ready to Join Our Story?"
        description="Start your free trial today and see how RepWell can transform your customer experience management."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Contact Us", href: "/contact" }}
      />
    </>
  );
}
