"use client";

import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";

// Import new components
import { FloatingAvatarsHero } from "@/components/marketing/floating-avatars-hero";
import { FeatureTabsShowcase } from "@/components/marketing/feature-tabs-showcase";
import { TabNavigationSection } from "@/components/marketing/tab-navigation-section";
import { FeatureShowcase } from "@/components/marketing/feature-showcase";
import { IntegrationsGrid } from "@/components/marketing/integrations-grid";
import { VideoSection } from "@/components/marketing/video-section";
import { StatsSectionDark } from "@/components/marketing/stats-section-dark";
import { TestimonialCard } from "@/components/marketing/testimonial-card";
import { SecurityBadges } from "@/components/marketing/security-badges";
import { CTASection } from "@/components/marketing/cta-section";
import { Badge } from "@/components/ui/badge";

// Testimonials data
const testimonials = [
  {
    quote:
      "RepWell has transformed how we collect and manage customer feedback. Our review volume is up 300%.",
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

export default function HomePage() {
  return (
    <div className="bg-background">
      {/* Section 1: Floating Avatars Hero */}
      <FloatingAvatarsHero
        badge="Trusted by 500+ mortgage professionals"
        title={
          <>
            Build Your Reputation,
            <br />
            <span className="text-repwell-teal-300">One Review at a Time</span>
          </>
        }
        description="Collect reviews, track satisfaction metrics, and gain AI-powered insights to deliver exceptional customer experiences. Built for mortgage professionals."
        cta={[
          { label: "Start Free Trial", href: "/signup", variant: "default" },
          { label: "Watch Demo", href: "/demo", variant: "outline" },
        ]}
      />

      {/* Section 2: Feature Tabs Showcase */}
      <FeatureTabsShowcase />

      {/* Section 4: Tab Navigation Section */}
      <TabNavigationSection
        badge="Built for Every Role"
        heading="One Platform, Every Team"
        subheading="RepWell adapts to the needs of each role in your organization."
      />

      {/* Section 5: Feature Showcase */}
      <FeatureShowcase
        badge="How It Works"
        heading="From Survey to Five-Star Review"
        subheading="See how RepWell transforms customer feedback into reputation growth."
      />

      {/* Section 6: Integrations Grid */}
      <IntegrationsGrid
        badge="Integrations"
        heading="Connect Your Existing Tools"
        subheading="RepWell integrates seamlessly with the platforms your team already uses."
      />

      {/* Section 7: Video Section */}
      <VideoSection
        badge="Product Demo"
        heading="See RepWell in Action"
        subheading="Watch how leading mortgage companies use RepWell to transform their review collection and reputation management."
        ctaText="Schedule a Live Demo"
        ctaHref="/demo"
      />

      {/* Section 8: Dark Stats Section */}
      <StatsSectionDark
        heading="Powering Reputation Growth"
        stats={[
          { value: 150000, suffix: "+", label: "Surveys Sent Monthly" },
          { value: 42, suffix: "%", label: "Average Response Rate" },
          { value: 4.8, suffix: "/5", label: "Customer Satisfaction", decimals: 1 },
          { value: 99.9, suffix: "%", label: "Platform Uptime", decimals: 1 },
        ]}
      />

      {/* Section 9: Testimonials */}
      <section className="py-16 md:py-24 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 text-sm border-repwell-teal-300/50 text-repwell-teal-400"
              >
                Customer Stories
              </Badge>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-repwell-teal-500 text-center mb-4"
            >
              Trusted by Mortgage Professionals
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="font-sans text-lg text-repwell-teal-400 max-w-2xl mx-auto text-center mb-12 md:mb-16"
            >
              See what our customers have to say about RepWell.
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

      {/* Section 10: Security Badges */}
      <SecurityBadges
        heading="Enterprise-Grade Security"
        securityPageHref="/security"
      />

      {/* Section 11: Final CTA Section */}
      <CTASection
        variant="gradient"
        title="Ready to Transform Your Customer Experience?"
        description="Join thousands of mortgage professionals who use RepWell to collect more reviews and build their reputation."
        primaryCta={{ label: "Start Free Trial", href: "/signup" }}
        secondaryCta={{ label: "Contact Sales", href: "/contact" }}
      />
    </div>
  );
}
