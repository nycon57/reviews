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
} from "lucide-react";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeatureCard } from "@/components/marketing/feature-card";
import { Button } from "@/components/ui/button";
import { staggerContainer, fadeInUp } from "@/lib/motion";

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
  },
  {
    quote:
      "The AI insights help us understand exactly what customers love and where we can improve. Invaluable.",
    author: "Michael Chen",
    role: "VP of Operations",
    company: "Premier Lending Group",
  },
  {
    quote:
      "Finally, a platform that understands the mortgage industry. The automation saves us hours every week.",
    author: "Emily Rodriguez",
    role: "Loan Officer",
    company: "Hometown Home Loans",
  },
];

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

      {/* Stats Section */}
      <section className="border-t border-b bg-muted/50 py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 gap-8 md:grid-cols-4"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeInUp}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary md:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-3xl font-bold"
            >
              Everything You Need
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground"
            >
              A complete platform for collecting reviews, tracking metrics, and
              building your reputation.
            </motion.p>
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

      {/* How It Works Section */}
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
              className="mb-4 text-center text-3xl font-bold"
            >
              How It Works
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground"
            >
              Get started in minutes with our simple 3-step process.
            </motion.p>
            <div className="grid gap-8 md:grid-cols-3">
              {[
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
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={fadeInUp}
                  className="relative rounded-lg border bg-background p-6 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                    {item.step}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 text-center text-3xl font-bold"
            >
              Trusted by Mortgage Professionals
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground"
            >
              See what our customers have to say about ReviewHub.
            </motion.p>
            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="rounded-lg border bg-background p-6"
                >
                  <div className="mb-4 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-sm italic text-muted-foreground">
                    "{testimonial.quote}"
                  </p>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
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
              Built for Security & Scale
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={<Shield className="h-6 w-6" />}
                title="Enterprise Security"
                description="SOC 2 compliant with encryption at rest and in transit. Your data is always protected."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6" />}
                title="Multi-Tenant"
                description="Support for multiple branches and teams with role-based access control."
              />
              <FeatureCard
                icon={<TrendingUp className="h-6 w-6" />}
                title="99.9% Uptime"
                description="Reliable infrastructure that scales with your business needs."
              />
              <FeatureCard
                icon={<Globe className="h-6 w-6" />}
                title="GDPR Ready"
                description="Full compliance with data protection regulations and privacy laws."
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
          <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
            Ready to Get Started?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-8 max-w-xl text-muted-foreground"
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
