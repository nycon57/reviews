"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Star,
  BarChart3,
  MessageSquare,
  Zap,
  Users,
  TrendingUp,
  Globe,
  Shield,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { HeroSection, AnimatedStat } from "@/components/marketing";
import { FeatureCard } from "@/components/marketing/feature-card";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { TrustLogosBar } from "@/components/marketing/trust-logos-bar";
import { CTASection } from "@/components/marketing/cta-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, fadeInUp, viewportOnce, blobFloat, blobFloatRotate } from "@/lib/motion";

const stats = [
  { value: "10,000+", label: "Surveys Sent Monthly" },
  { value: "95%", label: "Response Rate" },
  { value: "4.9/5", label: "Average Rating" },
  { value: "500+", label: "Happy Customers" },
];

const testimonials = [
  {
    quote:
      "ReviewHub has transformed how we collect and manage customer feedback. Our review volume is up 300%.",
    author: "Sarah Johnson",
    role: "Branch Manager",
    company: "First National Mortgage",
    rating: 5,
    stat: { value: "+300%", label: "Review volume increase" },
  },
  {
    quote:
      "The AI insights help us understand exactly what customers love and where we can improve. Invaluable.",
    author: "Michael Chen",
    role: "VP of Operations",
    company: "Premier Lending Group",
    rating: 5,
  },
  {
    quote:
      "Finally, a platform that understands the mortgage industry. The automation saves us hours every week.",
    author: "Emily Rodriguez",
    role: "Loan Officer",
    company: "Hometown Home Loans",
    rating: 5,
  },
];

const trustLogos = [
  { name: "Encompass" },
  { name: "Byte Software" },
  { name: "Mortgage Flex" },
  { name: "LoanSafe" },
  { name: "Total Expert" },
];

const howItWorks = [
  {
    step: "1",
    title: "Connect Your Systems",
    description:
      "Integrate with your LOS, CRM, or use webhooks to automatically trigger surveys when loans close.",
  },
  {
    step: "2",
    title: "Customize & Send",
    description:
      "Brand your surveys, set up automated sequences, and let ReviewHub handle the rest.",
  },
  {
    step: "3",
    title: "Track & Grow",
    description:
      "Monitor your metrics, respond to reviews, and leverage AI insights to continuously improve.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-brand-snow">
      {/* Hero Section */}
      <HeroSection
        withBlobs
        badge="Trusted by 500+ mortgage professionals"
        subtitle="Customer Experience Platform"
        title={
          <>
            Build Your Reputation,
            <br />
            <span className="text-brand-blue">One Review at a Time</span>
          </>
        }
        description="Collect reviews, track satisfaction metrics, and gain AI-powered insights to deliver exceptional customer experiences. Built for mortgage professionals."
        cta={[
          { label: "Start Free Trial", href: "/signup", variant: "brand" },
          { label: "Watch Demo", href: "/demo", variant: "brand-outline" },
        ]}
      />

      {/* Trust Logos Bar */}
      <TrustLogosBar
        heading="Trusted by leading mortgage companies"
        logos={trustLogos}
        variant="default"
        className="border-t border-b border-brand-silver bg-white"
      />

      {/* Stats Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-frost to-brand-ice py-16 md:py-20">
        {/* Decorative elements */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={blobFloat}
          className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-brand-blue/5 blur-3xl"
        />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeInUp}>
                <AnimatedStat value={stat.value} label={stat.label} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 md:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-4">
              <Badge variant="brand-subtle" className="px-4 py-1.5">
                Features
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-heading-xl md:text-display-sm text-brand-navy"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-14 max-w-2xl text-center text-body-lg text-brand-slate"
            >
              A complete platform for collecting reviews, tracking metrics, and
              building your reputation.
            </motion.p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Star className="h-full w-full" />}
                title="Review Collection"
                description="Automated surveys sent at the perfect moment, with reminders to maximize response rates."
                accentColor="blue"
              />
              <FeatureCard
                icon={<BarChart3 className="h-full w-full" />}
                title="Analytics & NPS"
                description="Track NPS, CSAT, and satisfaction trends with real-time dashboards and reports."
                accentColor="emerald"
              />
              <FeatureCard
                icon={<MessageSquare className="h-full w-full" />}
                title="AI Insights"
                description="Sentiment analysis and AI-generated summaries reveal what customers really think."
                accentColor="iris"
              />
              <FeatureCard
                icon={<Zap className="h-full w-full" />}
                title="Integrations"
                description="Connect with Google Business, your LOS, and thousands of apps via Zapier."
                accentColor="amber"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28 border-t border-brand-silver">
        {/* Decorative blob */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={blobFloatRotate}
          className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-frost to-brand-ice/50 blur-3xl"
        />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-4">
              <Badge variant="brand-subtle" className="px-4 py-1.5">
                How It Works
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-heading-xl md:text-display-sm text-brand-navy"
            >
              Get Started in Minutes
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-14 max-w-2xl text-center text-body-lg text-brand-slate"
            >
              Our simple 3-step process gets you collecting reviews faster than ever.
            </motion.p>

            <div className="grid gap-8 md:grid-cols-3">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={item.step}
                  variants={fadeInUp}
                  className="relative rounded-2xl border border-brand-silver bg-brand-snow p-8 text-center hover:border-brand-blue/30 hover:shadow-lg transition-all duration-200"
                >
                  {/* Connector line */}
                  {index < howItWorks.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 right-0 translate-x-1/2 w-8 h-px bg-brand-silver" />
                  )}

                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue to-brand-iris text-2xl font-bold text-white shadow-lg shadow-brand-blue/20">
                    {item.step}
                  </div>
                  <h3 className="mb-3 text-heading-sm text-brand-navy">{item.title}</h3>
                  <p className="text-body-sm text-brand-slate leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-20 md:py-28 bg-brand-snow">
        {/* Decorative blob */}
        <motion.div
          initial="initial"
          animate="animate"
          variants={blobFloat}
          className="absolute top-20 right-0 h-80 w-80 rounded-full bg-gradient-to-br from-brand-blue/5 to-brand-iris/5 blur-3xl"
        />

        <div className="container relative mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-4">
              <Badge variant="brand-subtle" className="px-4 py-1.5">
                Testimonials
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-heading-xl md:text-display-sm text-brand-navy"
            >
              Trusted by Mortgage Professionals
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-14 max-w-2xl text-center text-body-lg text-brand-slate"
            >
              See what our customers have to say about ReviewHub.
            </motion.p>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={index}
                  quote={testimonial.quote}
                  author={testimonial.author}
                  role={testimonial.role}
                  company={testimonial.company}
                  rating={testimonial.rating}
                  stat={index === 0 ? testimonial.stat : undefined}
                  variant={index === 0 ? "featured" : "default"}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust/Security Section */}
      <section className="relative overflow-hidden bg-white py-20 md:py-28 border-t border-brand-silver">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-4">
              <Badge variant="brand-subtle" className="px-4 py-1.5">
                Enterprise Ready
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="mb-14 text-center text-heading-xl md:text-display-sm text-brand-navy"
            >
              Built for Security & Scale
            </motion.h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Shield className="h-full w-full" />}
                title="Enterprise Security"
                description="SOC 2 compliant with encryption at rest and in transit. Your data is always protected."
                iconStyle="gradient"
              />
              <FeatureCard
                icon={<Users className="h-full w-full" />}
                title="Multi-Tenant"
                description="Support for multiple branches and teams with role-based access control."
                iconStyle="gradient"
              />
              <FeatureCard
                icon={<TrendingUp className="h-full w-full" />}
                title="99.9% Uptime"
                description="Reliable infrastructure that scales with your business needs."
                iconStyle="gradient"
              />
              <FeatureCard
                icon={<Globe className="h-full w-full" />}
                title="GDPR Ready"
                description="Full compliance with data protection regulations and privacy laws."
                iconStyle="gradient"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <CTASection
        variant="gradient"
        title="Ready to Transform Your Customer Experience?"
        description="Join thousands of mortgage professionals who use ReviewHub to collect more reviews and build their reputation."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Contact Sales", href: "/contact" }}
      />
    </div>
  );
}
